/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { BalancedBracketSelectors, StateStackImpl } from './grammar';
import * as grammarReader from './parseRawGrammar';
import { IOnigLib } from './onigLib';
import { IRawGrammar } from './rawGrammar';
import { SyncRegistry } from './registry';
import { IRawTheme, ScopeName, Theme } from './theme';
import { StandardTokenType } from './encodedTokenAttributes';
import { ScopeDependencyProcessor } from './grammar/grammarDependencies'
import { applyStateStackDiff, diffStateStacksRefEq, StackDiff } from './diffStateStacks';

export * from './onigLib';

export type { IRawGrammar, IRawTheme };

/**
 * A registry helper that can locate grammar file paths given scope names.
 */
export interface RegistryOptions {
	onigLib: Promise<IOnigLib>;
	theme?: IRawTheme;
	colorMap?: string[];
	loadGrammar(scopeName: ScopeName): Promise<IRawGrammar | undefined | null>;
	getInjections?(scopeName: ScopeName): ScopeName[] | undefined;
}

/**
 * A map from scope name to a language id. Please do not use language id 0.
 */
export interface IEmbeddedLanguagesMap {
	[scopeName: string]: number;
}

/**
 * A map from selectors to token types.
 */
export interface ITokenTypeMap {
	[selector: string]: StandardTokenType;
}

export interface IGrammarConfiguration {
	embeddedLanguages?: IEmbeddedLanguagesMap;
	tokenTypes?: ITokenTypeMap;
	balancedBracketSelectors?: string[];
	unbalancedBracketSelectors?: string[];
}

/**
 * The registry that will hold all grammars.
 */
export class Registry {
	private readonly _options: RegistryOptions;
	private readonly _syncRegistry: SyncRegistry;
	private readonly _ensureGrammarCache: Map<string, Promise<void>>;

	constructor(options: RegistryOptions) {
		this._options = options;
		this._syncRegistry = new SyncRegistry(
			Theme.createFromRawTheme(options.theme, options.colorMap),
			options.onigLib
		);
		this._ensureGrammarCache = new Map<string, Promise<void>>();
	}

	public dispose(): void {
		this._syncRegistry.dispose();
	}

	/**
	 * Change the theme. Once called, no previous `ruleStack` should be used anymore.
	 */
	public setTheme(theme: IRawTheme, colorMap?: string[]): void {
		this._syncRegistry.setTheme(Theme.createFromRawTheme(theme, colorMap));
	}

	/**
	 * Returns a lookup array for color ids.
	 */
	public getColorMap(): string[] {
		return this._syncRegistry.getColorMap();
	}

	/**
	 * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
	 * Please do not use language id 0.
	 */
	public loadGrammarWithEmbeddedLanguages(
		initialScopeName: ScopeName,
		initialLanguage: number,
		embeddedLanguages: IEmbeddedLanguagesMap
	): Promise<IGrammar | null> {
		return this.loadGrammarWithConfiguration(initialScopeName, initialLanguage, { embeddedLanguages });
	}

	/**
	 * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
	 * Please do not use language id 0.
	 */
	public loadGrammarWithConfiguration(
		initialScopeName: ScopeName,
		initialLanguage: number,
		configuration: IGrammarConfiguration
	): Promise<IGrammar | null> {
		return this._loadGrammar(
			initialScopeName,
			initialLanguage,
			configuration.embeddedLanguages,
			configuration.tokenTypes,
			new BalancedBracketSelectors(
				configuration.balancedBracketSelectors || [],
				configuration.unbalancedBracketSelectors || []
			)
		);
	}

	/**
	 * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
	 */
	public loadGrammar(initialScopeName: ScopeName): Promise<IGrammar | null> {
		return this._loadGrammar(initialScopeName, 0, null, null, null);
	}

	private async _loadGrammar(
		initialScopeName: ScopeName,
		initialLanguage: number,
		embeddedLanguages: IEmbeddedLanguagesMap | null | undefined,
		tokenTypes: ITokenTypeMap | null | undefined,
		balancedBracketSelectors: BalancedBracketSelectors | null
	): Promise<IGrammar | null> {
		const dependencyProcessor = new ScopeDependencyProcessor(this._syncRegistry, initialScopeName);
		while (dependencyProcessor.Q.length > 0) {
			await Promise.all(dependencyProcessor.Q.map((request) => this._loadSingleGrammar(request.scopeName)));
			dependencyProcessor.processQueue();
		}

		return this._grammarForScopeName(
			initialScopeName,
			initialLanguage,
			embeddedLanguages,
			tokenTypes,
			balancedBracketSelectors
		);
	}

	private async _loadSingleGrammar(scopeName: ScopeName): Promise<void> {
		if (!this._ensureGrammarCache.has(scopeName)) {
			this._ensureGrammarCache.set(scopeName, this._doLoadSingleGrammar(scopeName));
		}
		return this._ensureGrammarCache.get(scopeName);
	}

	private async _doLoadSingleGrammar(scopeName: ScopeName): Promise<void> {
		const grammar = await this._options.loadGrammar(scopeName);
		if (grammar) {
			const injections =
				typeof this._options.getInjections === "function" ? this._options.getInjections(scopeName) : undefined;
			this._syncRegistry.addGrammar(grammar, injections);
		}
	}

	/**
	 * Adds a rawGrammar.
	 */
	public async addGrammar(
		rawGrammar: IRawGrammar,
		injections: string[] = [],
		initialLanguage: number = 0,
		embeddedLanguages: IEmbeddedLanguagesMap | null = null
	): Promise<IGrammar> {
		this._syncRegistry.addGrammar(rawGrammar, injections);
		return (await this._grammarForScopeName(rawGrammar.scopeName, initialLanguage, embeddedLanguages))!;
	}

	/**
	 * Get the grammar for `scopeName`. The grammar must first be created via `loadGrammar` or `addGrammar`.
	 */
	private _grammarForScopeName(
		scopeName: string,
		initialLanguage: number = 0,
		embeddedLanguages: IEmbeddedLanguagesMap | null = null,
		tokenTypes: ITokenTypeMap | null = null,
		balancedBracketSelectors: BalancedBracketSelectors | null = null
	): Promise<IGrammar | null> {
		return this._syncRegistry.grammarForScopeName(
			scopeName,
			initialLanguage,
			embeddedLanguages,
			tokenTypes,
			balancedBracketSelectors
		);
	}
}

/**
 * A grammar
 */
export interface IGrammar {
	/**
	 * Tokenize `lineText` using previous line state `prevState`.
	 */
	tokenizeLine(lineText: string, prevState: StateStack | null, timeLimit?: number): ITokenizeLineResult;

	/**
	 * Tokenize `lineText` using previous line state `prevState`.
	 * The result contains the tokens in binary format, resolved with the following information:
	 *  - language
	 *  - token type (regex, string, comment, other)
	 *  - font style
	 *  - foreground color
	 *  - background color
	 * e.g. for getting the languageId: `(metadata & MetadataConsts.LANGUAGEID_MASK) >>> MetadataConsts.LANGUAGEID_OFFSET`
	 */
	tokenizeLine2(lineText: string, prevState: StateStack | null, timeLimit?: number): ITokenizeLineResult2;
}

export interface ITokenizeLineResult {
	readonly tokens: IToken[];
	/**
	 * The `prevState` to be passed on to the next line tokenization.
	 */
	readonly ruleStack: StateStack;
	/**
	 * Did tokenization stop early due to reaching the time limit.
	 */
	readonly stoppedEarly: boolean;
}

export interface ITokenizeLineResult2 {
	/**
	 * The tokens in binary format. Each token occupies two array indices. For token i:
	 *  - at offset 2*i => startIndex
	 *  - at offset 2*i + 1 => metadata
	 *
	 */
	readonly tokens: Uint32Array;
	/**
	 * The `prevState` to be passed on to the next line tokenization.
	 */
	readonly ruleStack: StateStack;
	/**
	 * Did tokenization stop early due to reaching the time limit.
	 */
	readonly stoppedEarly: boolean;
}

export interface IToken {
	startIndex: number;
	readonly endIndex: number;
	readonly scopes: string[];
}

/**
 * **IMPORTANT** - Immutable!
 */
export interface StateStack {
	_stackElementBrand: void;
	readonly depth: number;

	clone(): StateStack;
	equals(other: StateStack): boolean;
}

export const INITIAL: StateStack = StateStackImpl.NULL;

export const parseRawGrammar: (content: string, filePath?: string) => IRawGrammar = grammarReader.parseRawGrammar;

export type { diffStateStacksRefEq, applyStateStackDiff, StackDiff, };
