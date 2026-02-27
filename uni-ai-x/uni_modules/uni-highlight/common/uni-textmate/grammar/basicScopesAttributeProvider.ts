/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { OptionalStandardTokenType } from "../encodedTokenAttributes";
import { IEmbeddedLanguagesMap } from "../main";
import { ScopeName } from "../theme";
import { CachedFn, escapeRegExpCharacters } from "../utils";

export class BasicScopeAttributes {
	constructor(
		public readonly languageId: number,
		public readonly tokenType: OptionalStandardTokenType
	) {
	}
}

export class BasicScopeAttributesProvider {
	private readonly _defaultAttributes: BasicScopeAttributes;
	private readonly _embeddedLanguagesMatcher: ScopeMatcher</* language id */ number>;

	constructor(initialLanguageId: number, embeddedLanguages: IEmbeddedLanguagesMap | null) {
		this._defaultAttributes = new BasicScopeAttributes(initialLanguageId, OptionalStandardTokenType.NotSet);
		this._embeddedLanguagesMatcher = new ScopeMatcher(Object.entries(embeddedLanguages || {}));
	}

	public getDefaultAttributes(): BasicScopeAttributes {
		return this._defaultAttributes;
	}

	public getBasicScopeAttributes(scopeName: ScopeName | null): BasicScopeAttributes {
		if (scopeName === null) {
			return BasicScopeAttributesProvider._NULL_SCOPE_METADATA;
		}
		return this._getBasicScopeAttributes.get(scopeName);
	}

	private static readonly _NULL_SCOPE_METADATA = new BasicScopeAttributes(0, 0);

	private readonly _getBasicScopeAttributes = new CachedFn<ScopeName, BasicScopeAttributes>((scopeName) => {
		const languageId = this._scopeToLanguage(scopeName);
		const standardTokenType = this._toStandardTokenType(scopeName);
		return new BasicScopeAttributes(languageId, standardTokenType);
	});

	/**
	 * Given a produced TM scope, return the language that token describes or null if unknown.
	 * e.g. source.html => html, source.css.embedded.html => css, punctuation.definition.tag.html => null
	 */
	private _scopeToLanguage(scope: ScopeName): number {
		return this._embeddedLanguagesMatcher.match(scope) || 0;
	}

	private _toStandardTokenType(scopeName: ScopeName): OptionalStandardTokenType {
		const m = scopeName.match(BasicScopeAttributesProvider.STANDARD_TOKEN_TYPE_REGEXP);
		if (!m) {
			return OptionalStandardTokenType.NotSet;
		}
		switch (m[1]) {
			case "comment":
				return OptionalStandardTokenType.Comment;
			case "string":
				return OptionalStandardTokenType.String;
			case "regex":
				return OptionalStandardTokenType.RegEx;
			case "meta.embedded":
				return OptionalStandardTokenType.Other;
		}
		throw new Error("Unexpected match for standard token type!");
	}

	private static STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|meta\.embedded)\b/;
}

class ScopeMatcher<TValue> {
	private readonly values: ReadonlyMap<string, TValue> | null;
	private readonly scopesRegExp: RegExp | null;

	constructor(values: [ScopeName, TValue][]) {
		if (values.length === 0) {
			this.values = null;
			this.scopesRegExp = null;
		} else {
			this.values = new Map(values);

			// create the regex
			const escapedScopes = values.map(
				([scopeName, value]) => escapeRegExpCharacters(scopeName)
			);

			escapedScopes.sort();
			escapedScopes.reverse(); // Longest scope first
			this.scopesRegExp = new RegExp(
				`^((${escapedScopes.join(")|(")}))($|\\.)`,
				""
			);
		}
	}

	public match(scope: ScopeName): TValue | undefined {
		if (!this.scopesRegExp) {
			return undefined;
		}
		const m = scope.match(this.scopesRegExp);
		if (!m) {
			// no scopes matched
			return undefined;
		}
		return this.values!.get(m[1])!;
	}
}
