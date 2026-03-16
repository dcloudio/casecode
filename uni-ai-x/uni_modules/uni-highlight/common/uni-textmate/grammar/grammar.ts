/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { DebugFlags } from '../debug';
import { EncodedTokenAttributes, OptionalStandardTokenType, StandardTokenType, toOptionalTokenType } from '../encodedTokenAttributes';
import { IEmbeddedLanguagesMap, IGrammar, IToken, ITokenizeLineResult, ITokenizeLineResult2, ITokenTypeMap, StateStack } from '../main';
import { createMatchers, Matcher } from '../matcher';
import { disposeOnigString, IOnigLib, OnigScanner, OnigString } from '../onigLib';
import { IRawGrammar, IRawRepository, IRawRule } from '../rawGrammar';
import { ruleIdFromNumber, IRuleFactoryHelper, IRuleRegistry, Rule, RuleFactory, RuleId, ruleIdToNumber } from '../rule';
import { FontStyle, ScopeName, ScopePath, ScopeStack, StyleAttributes } from '../theme';
import { clone } from '../utils';
import { BasicScopeAttributes, BasicScopeAttributesProvider } from './basicScopesAttributeProvider';
import { _tokenizeString } from './tokenizeString';

export function createGrammar(
	scopeName: ScopeName,
	grammar: IRawGrammar,
	initialLanguage: number,
	embeddedLanguages: IEmbeddedLanguagesMap | null,
	tokenTypes: ITokenTypeMap | null,
	balancedBracketSelectors: BalancedBracketSelectors | null,
	grammarRepository: IGrammarRepository & IThemeProvider,
	onigLib: IOnigLib
): Grammar {
	return new Grammar(
		scopeName,
		grammar,
		initialLanguage,
		embeddedLanguages,
		tokenTypes,
		balancedBracketSelectors,
		grammarRepository,
		onigLib
	); //TODO
}

export interface IThemeProvider {
	themeMatch(scopePath: ScopeStack): StyleAttributes | null;
	getDefaults(): StyleAttributes;
}

export interface IGrammarRepository {
	lookup(scopeName: ScopeName): IRawGrammar | undefined;
	injections(scopeName: ScopeName): ScopeName[];
}

export interface Injection {
	readonly debugSelector: string;
	readonly matcher: Matcher<string[]>;
	readonly priority: -1 | 0 | 1; // 0 is the default. -1 for 'L' and 1 for 'R'
	readonly ruleId: RuleId;
	readonly grammar: IRawGrammar;
}

function collectInjections(result: Injection[], selector: string, rule: IRawRule, ruleFactoryHelper: IRuleFactoryHelper, grammar: IRawGrammar): void {
	const matchers = createMatchers(selector, nameMatcher);
	const ruleId = RuleFactory.getCompiledRuleId(rule, ruleFactoryHelper, grammar.repository);
	for (const matcher of matchers) {
		result.push({
			debugSelector: selector,
			matcher: matcher.matcher,
			ruleId: ruleId,
			grammar: grammar,
			priority: matcher.priority
		});
	}
}

function nameMatcher(identifers: ScopeName[], scopes: ScopeName[]): boolean {
	if (scopes.length < identifers.length) {
		return false;
	}
	let lastIndex = 0;
	return identifers.every(identifier => {
		for (let i = lastIndex; i < scopes.length; i++) {
			if (scopesAreMatching(scopes[i], identifier)) {
				lastIndex = i + 1;
				return true;
			}
		}
		return false;
	});
}

function scopesAreMatching(thisScopeName: string, scopeName: string): boolean {
	if (!thisScopeName) {
		return false;
	}
	if (thisScopeName === scopeName) {
		return true;
	}
	const len = scopeName.length;
	return thisScopeName.length > len && thisScopeName.substr(0, len) === scopeName && thisScopeName[len] === '.';
}

export class Grammar implements IGrammar, IRuleFactoryHelper, IOnigLib {
	private _rootId: RuleId | -1;
	private _lastRuleId: number;
	private readonly _ruleId2desc: Rule[];
	private readonly _includedGrammars: { [scopeName: string]: IRawGrammar };
	private readonly _grammarRepository: IGrammarRepository & IThemeProvider;
	private readonly _grammar: IRawGrammar;
	private _injections: Injection[] | null;
	private readonly _basicScopeAttributesProvider: BasicScopeAttributesProvider;
	private readonly _tokenTypeMatchers: TokenTypeMatcher[];

	public get themeProvider(): IThemeProvider { return this._grammarRepository; }

	constructor(
		private readonly _rootScopeName: ScopeName,
		grammar: IRawGrammar,
		initialLanguage: number,
		embeddedLanguages: IEmbeddedLanguagesMap | null,
		tokenTypes: ITokenTypeMap | null,
		private readonly balancedBracketSelectors: BalancedBracketSelectors | null,
		grammarRepository: IGrammarRepository & IThemeProvider,
		private readonly _onigLib: IOnigLib
	) {
		this._basicScopeAttributesProvider = new BasicScopeAttributesProvider(
			initialLanguage,
			embeddedLanguages
		);

		this._rootId = -1;
		this._lastRuleId = 0;
		this._ruleId2desc = [null!];
		this._includedGrammars = {};
		this._grammarRepository = grammarRepository;
		this._grammar = initGrammar(grammar, null);
		this._injections = null;

		this._tokenTypeMatchers = [];
		if (tokenTypes) {
			for (const selector of Object.keys(tokenTypes)) {
				const matchers = createMatchers(selector, nameMatcher);
				for (const matcher of matchers) {
					this._tokenTypeMatchers.push({
						matcher: matcher.matcher,
						type: tokenTypes[selector],
					});
				}
			}
		}
	}

	public dispose(): void {
		for (const rule of this._ruleId2desc) {
			if (rule) {
				rule.dispose();
			}
		}
	}

	public createOnigScanner(sources: string[]): OnigScanner {
		return this._onigLib.createOnigScanner(sources);
	}

	public createOnigString(sources: string): OnigString {
		return this._onigLib.createOnigString(sources);
	}

	public getMetadataForScope(scope: string): BasicScopeAttributes {
		return this._basicScopeAttributesProvider.getBasicScopeAttributes(scope);
	}

	private _collectInjections(): Injection[] {
		const grammarRepository: IGrammarRepository = {
			lookup: (scopeName: string): IRawGrammar | undefined => {
				if (scopeName === this._rootScopeName) {
					return this._grammar;
				}
				return this.getExternalGrammar(scopeName);
			},
			injections: (scopeName: string): string[] => {
				return this._grammarRepository.injections(scopeName);
			},
		};

		const result: Injection[] = [];

		const scopeName = this._rootScopeName;

		const grammar = grammarRepository.lookup(scopeName);
		if (grammar) {
			// add injections from the current grammar
			const rawInjections = grammar.injections;
			if (rawInjections) {
				for (let expression in rawInjections) {
					collectInjections(
						result,
						expression,
						rawInjections[expression],
						this,
						grammar
					);
				}
			}

			// add injection grammars contributed for the current scope

			const injectionScopeNames = this._grammarRepository.injections(scopeName);
			if (injectionScopeNames) {
				injectionScopeNames.forEach((injectionScopeName) => {
					const injectionGrammar =
						this.getExternalGrammar(injectionScopeName);
					if (injectionGrammar) {
						const selector = injectionGrammar.injectionSelector;
						if (selector) {
							collectInjections(
								result,
								selector,
								injectionGrammar,
								this,
								injectionGrammar
							);
						}
					}
				});
			}
		}

		result.sort((i1, i2) => i1.priority - i2.priority); // sort by priority

		return result;
	}

	public getInjections(): Injection[] {
		if (this._injections === null) {
			this._injections = this._collectInjections();

			if (DebugFlags.InDebugMode && this._injections.length > 0) {
				console.log(
					`Grammar ${this._rootScopeName} contains the following injections:`
				);
				for (const injection of this._injections) {
					console.log(`  - ${injection.debugSelector}`);
				}
			}
		}
		return this._injections;
	}

	public registerRule<T extends Rule>(factory: (id: RuleId) => T): T {
		const id = ++this._lastRuleId;
		const result = factory(ruleIdFromNumber(id));
		this._ruleId2desc[id] = result;
		return result;
	}

	public getRule(ruleId: RuleId): Rule {
		return this._ruleId2desc[ruleIdToNumber(ruleId)];
	}

	public getExternalGrammar(
		scopeName: string,
		repository?: IRawRepository
	): IRawGrammar | undefined {
		if (this._includedGrammars[scopeName]) {
			return this._includedGrammars[scopeName];
		} else if (this._grammarRepository) {
			const rawIncludedGrammar =
				this._grammarRepository.lookup(scopeName);
			if (rawIncludedGrammar) {
				// console.log('LOADED GRAMMAR ' + pattern.include);
				this._includedGrammars[scopeName] = initGrammar(
					rawIncludedGrammar,
					repository && repository.$base
				);
				return this._includedGrammars[scopeName];
			}
		}
		return undefined;
	}

	public tokenizeLine(
		lineText: string,
		prevState: StateStackImpl | null,
		timeLimit: number = 0
	): ITokenizeLineResult {
		const r = this._tokenize(lineText, prevState, false, timeLimit);
		return {
			tokens: r.lineTokens.getResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly,
		};
	}

	public tokenizeLine2(
		lineText: string,
		prevState: StateStackImpl | null,
		timeLimit: number = 0
	): ITokenizeLineResult2 {
		const r = this._tokenize(lineText, prevState, true, timeLimit);
		return {
			tokens: r.lineTokens.getBinaryResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly,
		};
	}

	private _tokenize(
		lineText: string,
		prevState: StateStackImpl | null,
		emitBinaryTokens: boolean,
		timeLimit: number
	): {
		lineLength: number;
		lineTokens: LineTokens;
		ruleStack: StateStackImpl;
		stoppedEarly: boolean;
	} {
		if (this._rootId === -1) {
			this._rootId = RuleFactory.getCompiledRuleId(
				this._grammar.repository.$self,
				this,
				this._grammar.repository
			);
			// This ensures ids are deterministic, and thus equal in renderer and webworker.
			this.getInjections();
		}

		let isFirstLine: boolean;
		if (!prevState || prevState === StateStackImpl.NULL) {
			isFirstLine = true;
			const rawDefaultMetadata =
				this._basicScopeAttributesProvider.getDefaultAttributes();
			const defaultStyle = this.themeProvider.getDefaults();
			const defaultMetadata = EncodedTokenAttributes.set(
				0,
				rawDefaultMetadata.languageId,
				rawDefaultMetadata.tokenType,
				null,
				defaultStyle.fontStyle,
				defaultStyle.foregroundId,
				defaultStyle.backgroundId
			);

			const rootScopeName = this.getRule(this._rootId).getName(
				null,
				null
			);

			let scopeList: AttributedScopeStack;
			if (rootScopeName) {
				scopeList = AttributedScopeStack.createRootAndLookUpScopeName(
					rootScopeName,
					defaultMetadata,
					this
				);
			} else {
				scopeList = AttributedScopeStack.createRoot(
					 "unknown",
					 defaultMetadata
				);
			}

			prevState = new StateStackImpl(
				null,
				this._rootId,
				-1,
				-1,
				false,
				null,
				scopeList,
				scopeList
			);
		} else {
			isFirstLine = false;
			prevState.reset();
		}

		lineText = lineText + "\n";
		const onigLineText = this.createOnigString(lineText);
		const lineLength = onigLineText.content.length;
		const lineTokens = new LineTokens(
			emitBinaryTokens,
			lineText,
			this._tokenTypeMatchers,
			this.balancedBracketSelectors
		);
		const r = _tokenizeString(
			this,
			onigLineText,
			isFirstLine,
			0,
			prevState,
			lineTokens,
			true,
			timeLimit
		);

		disposeOnigString(onigLineText);

		return {
			lineLength: lineLength,
			lineTokens: lineTokens,
			ruleStack: r.stack,
			stoppedEarly: r.stoppedEarly,
		};
	}
}

function initGrammar(grammar: IRawGrammar, base: IRawRule | null | undefined): IRawGrammar {
	grammar = clone(grammar);

	grammar.repository = grammar.repository || <any>{};
	grammar.repository.$self = {
		$vscodeTextmateLocation: grammar.$vscodeTextmateLocation,
		patterns: grammar.patterns,
		name: grammar.scopeName
	};
	grammar.repository.$base = base || grammar.repository.$self;
	return grammar;
}

export class AttributedScopeStack {
	static fromExtension(namesScopeList: AttributedScopeStack | null, contentNameScopesList: AttributedScopeStackFrame[]): AttributedScopeStack | null {
		let current = namesScopeList;
		let scopeNames = namesScopeList?.scopePath ?? null;
		for (const frame of contentNameScopesList) {
			scopeNames = ScopeStack.push(scopeNames, frame.scopeNames);
			current = new AttributedScopeStack(current, scopeNames!, frame.encodedTokenAttributes);
		}
		return current;
	}

	public static createRoot(scopeName: ScopeName, tokenAttributes: EncodedTokenAttributes): AttributedScopeStack {
		return new AttributedScopeStack(null, new ScopeStack(null, scopeName), tokenAttributes);
	}

	public static createRootAndLookUpScopeName(scopeName: ScopeName, tokenAttributes: EncodedTokenAttributes, grammar: Grammar): AttributedScopeStack {
		const rawRootMetadata = grammar.getMetadataForScope(scopeName);
		const scopePath = new ScopeStack(null, scopeName);
		const rootStyle = grammar.themeProvider.themeMatch(scopePath);

		const resolvedTokenAttributes = AttributedScopeStack.mergeAttributes(
			tokenAttributes,
			rawRootMetadata,
			rootStyle
		);

		return new AttributedScopeStack(null, scopePath, resolvedTokenAttributes);
	}

	public get scopeName(): ScopeName { return this.scopePath.scopeName; }

	/**
	 * Invariant:
	 * ```
	 * if (parent && !scopePath.extends(parent.scopePath)) {
	 * 	throw new Error();
	 * }
	 * ```
	 */
	private constructor(
		public readonly parent: AttributedScopeStack | null,
		public readonly scopePath: ScopeStack,
		public readonly tokenAttributes: EncodedTokenAttributes
	) {
	}

	public toString() {
		return this.getScopeNames().join(' ');
	}

	public equals(other: AttributedScopeStack): boolean {
		return AttributedScopeStack.equals(this, other);
	}

	public static equals(
		a: AttributedScopeStack | null,
		b: AttributedScopeStack | null
	): boolean {
		do {
			if (a === b) {
				return true;
			}

			if (!a && !b) {
				// End of list reached for both
				return true;
			}

			if (!a || !b) {
				// End of list reached only for one
				return false;
			}

			if (a.scopeName !== b.scopeName || a.tokenAttributes !== b.tokenAttributes) {
				return false;
			}

			// Go to previous pair
			a = a.parent;
			b = b.parent;
		} while (true);
	}

	private static mergeAttributes(
		existingTokenAttributes: EncodedTokenAttributes,
		basicScopeAttributes: BasicScopeAttributes,
		styleAttributes: StyleAttributes | null
	): EncodedTokenAttributes {
		let fontStyle = FontStyle.NotSet;
		let foreground = 0;
		let background = 0;

		if (styleAttributes !== null) {
			fontStyle = styleAttributes.fontStyle;
			foreground = styleAttributes.foregroundId;
			background = styleAttributes.backgroundId;
		}

		return EncodedTokenAttributes.set(
			existingTokenAttributes,
			basicScopeAttributes.languageId,
			basicScopeAttributes.tokenType,
			null,
			fontStyle,
			foreground,
			background
		);
	}

	public pushAttributed(scopePath: ScopePath | null, grammar: Grammar): AttributedScopeStack {
		if (scopePath === null) {
			return this;
		}

		if (scopePath.indexOf(' ') === -1) {
			// This is the common case and much faster

			return AttributedScopeStack._pushAttributed(this, scopePath, grammar);
		}

		const scopes = scopePath.split(/ /g);
		let result: AttributedScopeStack = this;
		for (const scope of scopes) {
			result = AttributedScopeStack._pushAttributed(result, scope, grammar);
		}
		return result;

	}

	private static _pushAttributed(
		target: AttributedScopeStack,
		scopeName: ScopeName,
		grammar: Grammar,
	): AttributedScopeStack {
		const rawMetadata = grammar.getMetadataForScope(scopeName);

		const newPath = target.scopePath.push(scopeName);
		const scopeThemeMatchResult =
			grammar.themeProvider.themeMatch(newPath);
		const metadata = AttributedScopeStack.mergeAttributes(
			target.tokenAttributes,
			rawMetadata,
			scopeThemeMatchResult
		);
		return new AttributedScopeStack(target, newPath, metadata);
	}

	public getScopeNames(): string[] {
		return this.scopePath.getSegments();
	}

	public getExtensionIfDefined(base: AttributedScopeStack | null): AttributedScopeStackFrame[] | undefined {
		const result: AttributedScopeStackFrame[] = [];
		let self: AttributedScopeStack | null = this;

		while (self && self !== base) {
			result.push({
				encodedTokenAttributes: self.tokenAttributes,
				scopeNames: self.scopePath.getExtensionIfDefined(self.parent?.scopePath ?? null)!,
			});
			self = self.parent;
		}
		return self === base ? result.reverse() : undefined;
	}
}

interface AttributedScopeStackFrame {
	encodedTokenAttributes: number;
	scopeNames: string[];
}

/**
 * Represents a "pushed" state on the stack (as a linked list element).
 */
export class StateStackImpl implements StateStack {
	_stackElementBrand: void = undefined;

	// TODO remove me
	public static NULL = new StateStackImpl(
		null,
		0 as any,
		0,
		0,
		false,
		null,
		null,
		null
	);

	/**
	 * The position on the current line where this state was pushed.
	 * This is relevant only while tokenizing a line, to detect endless loops.
	 * Its value is meaningless across lines.
	 */
	private _enterPos: number;

	/**
	 * The captured anchor position when this stack element was pushed.
	 * This is relevant only while tokenizing a line, to restore the anchor position when popping.
	 * Its value is meaningless across lines.
	 */
	private _anchorPos: number;


	/**
	 * The depth of the stack.
	 */
	public readonly depth: number;


	/**
	 * Invariant:
	 * ```
	 * if (contentNameScopesList !== nameScopesList && contentNameScopesList?.parent !== nameScopesList) {
	 * 	throw new Error();
	 * }
	 * if (this.parent && !nameScopesList.extends(this.parent.contentNameScopesList)) {
	 * 	throw new Error();
	 * }
	 * ```
	 */
	constructor(
		/**
		 * The previous state on the stack (or null for the root state).
		 */
		public readonly parent: StateStackImpl | null,

		/**
		 * The state (rule) that this element represents.
		 */
		private readonly ruleId: RuleId,

		enterPos: number,
		anchorPos: number,

		/**
		 * The state has entered and captured \n. This means that the next line should have an anchorPosition of 0.
		 */
		public readonly beginRuleCapturedEOL: boolean,

		/**
		 * The "pop" (end) condition for this state in case that it was dynamically generated through captured text.
		 */
		public readonly endRule: string | null,

		/**
		 * The list of scopes containing the "name" for this state.
		 */
		public readonly nameScopesList: AttributedScopeStack | null,

		/**
		 * The list of scopes containing the "contentName" (besides "name") for this state.
		 * This list **must** contain as an element `scopeName`.
		 */
		public readonly contentNameScopesList: AttributedScopeStack | null,
	) {
		this.depth = this.parent ? this.parent.depth + 1 : 1;
		this._enterPos = enterPos;
		this._anchorPos = anchorPos;
	}

	public equals(other: StateStackImpl): boolean {
		if (other === null) {
			return false;
		}
		return StateStackImpl._equals(this, other);
	}

	private static _equals(a: StateStackImpl, b: StateStackImpl): boolean {
		if (a === b) {
			return true;
		}
		if (!this._structuralEquals(a, b)) {
			return false;
		}
		return AttributedScopeStack.equals(a.contentNameScopesList, b.contentNameScopesList);
	}

	/**
	 * A structural equals check. Does not take into account `scopes`.
	 */
	private static _structuralEquals(
		a: StateStackImpl | null,
		b: StateStackImpl | null
	): boolean {
		do {
			if (a === b) {
				return true;
			}

			if (!a && !b) {
				// End of list reached for both
				return true;
			}

			if (!a || !b) {
				// End of list reached only for one
				return false;
			}

			if (
				a.depth !== b.depth ||
				a.ruleId !== b.ruleId ||
				a.endRule !== b.endRule
			) {
				return false;
			}

			// Go to previous pair
			a = a.parent;
			b = b.parent;
		} while (true);
	}

	public clone(): StateStackImpl {
		return this;
	}

	private static _reset(el: StateStackImpl | null): void {
		while (el) {
			el._enterPos = -1;
			el._anchorPos = -1;
			el = el.parent;
		}
	}

	public reset(): void {
		StateStackImpl._reset(this);
	}

	public pop(): StateStackImpl | null {
		return this.parent;
	}

	public safePop(): StateStackImpl {
		if (this.parent) {
			return this.parent;
		}
		return this;
	}

	public push(
		ruleId: RuleId,
		enterPos: number,
		anchorPos: number,
		beginRuleCapturedEOL: boolean,
		endRule: string | null,
		nameScopesList: AttributedScopeStack | null,
		contentNameScopesList: AttributedScopeStack | null,
	): StateStackImpl {
		return new StateStackImpl(
			this,
			ruleId,
			enterPos,
			anchorPos,
			beginRuleCapturedEOL,
			endRule,
			nameScopesList,
			contentNameScopesList
		);
	}

	public getEnterPos(): number {
		return this._enterPos;
	}

	public getAnchorPos(): number {
		return this._anchorPos;
	}

	public getRule(grammar: IRuleRegistry): Rule {
		return grammar.getRule(this.ruleId);
	}

	public toString(): string {
		const r: string[] = [];
		this._writeString(r, 0);
		return "[" + r.join(",") + "]";
	}

	private _writeString(res: string[], outIndex: number): number {
		if (this.parent) {
			outIndex = this.parent._writeString(res, outIndex);
		}

		res[
			outIndex++
		] = `(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`;

		return outIndex;
	}

	public withContentNameScopesList(
		contentNameScopeStack: AttributedScopeStack
	): StateStackImpl {
		if (this.contentNameScopesList === contentNameScopeStack) {
			return this;
		}
		return this.parent!.push(
			this.ruleId,
			this._enterPos,
			this._anchorPos,
			this.beginRuleCapturedEOL,
			this.endRule,
			this.nameScopesList,
			contentNameScopeStack
		);
	}

	public withEndRule(endRule: string): StateStackImpl {
		if (this.endRule === endRule) {
			return this;
		}
		return new StateStackImpl(
			this.parent,
			this.ruleId,
			this._enterPos,
			this._anchorPos,
			this.beginRuleCapturedEOL,
			endRule,
			this.nameScopesList,
			this.contentNameScopesList
		);
	}

	// Used to warn of endless loops
	public hasSameRuleAs(other: StateStackImpl): boolean {
		let el: StateStackImpl | null = this;
		while (el && el._enterPos === other._enterPos) {
			if (el.ruleId === other.ruleId) {
				return true;
			}
			el = el.parent;
		}
		return false;
	}

	public toStateStackFrame(): StateStackFrame {
		return {
			ruleId: ruleIdToNumber(this.ruleId),
			beginRuleCapturedEOL: this.beginRuleCapturedEOL,
			endRule: this.endRule,
			nameScopesList: this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList ?? null)! ?? [],
			contentNameScopesList: this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList)! ?? [],
		};
	}

	public static pushFrame(self: StateStackImpl | null, frame: StateStackFrame): StateStackImpl {
		const namesScopeList = AttributedScopeStack.fromExtension(self?.nameScopesList ?? null, frame.nameScopesList)!;
		return new StateStackImpl(
			self,
			ruleIdFromNumber(frame.ruleId),
			frame.enterPos ?? -1,
			frame.anchorPos ?? -1,
			frame.beginRuleCapturedEOL,
			frame.endRule,
			namesScopeList,
			AttributedScopeStack.fromExtension(namesScopeList, frame.contentNameScopesList)!
		);
	}
}

export interface StateStackFrame {
	ruleId: number;
	enterPos?: number;
	anchorPos?: number;
	beginRuleCapturedEOL: boolean;
	endRule: string | null;
	nameScopesList: AttributedScopeStackFrame[];
	/**
	 * on top of nameScopesList
	 */
	contentNameScopesList: AttributedScopeStackFrame[];
}

interface TokenTypeMatcher {
	readonly matcher: Matcher<string[]>;
	readonly type: StandardTokenType;
}

export class BalancedBracketSelectors {
	private readonly balancedBracketScopes: Matcher<string[]>[];
	private readonly unbalancedBracketScopes: Matcher<string[]>[];

	private allowAny = false;

	constructor(
		balancedBracketScopes: string[],
		unbalancedBracketScopes: string[],
	) {
		this.balancedBracketScopes = balancedBracketScopes.flatMap((selector) => {
				if (selector === '*') {
					this.allowAny = true;
					return [];
				}
				return createMatchers(selector, nameMatcher).map((m) => m.matcher);
			}
		);
		this.unbalancedBracketScopes = unbalancedBracketScopes.flatMap((selector) =>
			createMatchers(selector, nameMatcher).map((m) => m.matcher)
		);
	}

	public get matchesAlways(): boolean {
		return this.allowAny && this.unbalancedBracketScopes.length === 0;
	}

	public get matchesNever(): boolean {
		return this.balancedBracketScopes.length === 0 && !this.allowAny;
	}

	public match(scopes: string[]): boolean {
		for (const excluder of this.unbalancedBracketScopes) {
			if (excluder(scopes)) {
				return false;
			}
		}

		for (const includer of this.balancedBracketScopes) {
			if (includer(scopes)) {
				return true;
			}
		}
		return this.allowAny;
	}
}

export class LineTokens {
	private readonly _emitBinaryTokens: boolean;
	/**
	 * defined only if `DebugFlags.InDebugMode`.
	 */
	private readonly _lineText: string | null;
	/**
	 * used only if `_emitBinaryTokens` is false.
	 */
	private readonly _tokens: IToken[];
	/**
	 * used only if `_emitBinaryTokens` is true.
	 */
	private readonly _binaryTokens: number[];

	private _lastTokenEndIndex: number;

	private readonly _tokenTypeOverrides: TokenTypeMatcher[];

	constructor(
		emitBinaryTokens: boolean,
		lineText: string,
		tokenTypeOverrides: TokenTypeMatcher[],
		private readonly balancedBracketSelectors: BalancedBracketSelectors | null,
	) {
		this._emitBinaryTokens = emitBinaryTokens;
		this._tokenTypeOverrides = tokenTypeOverrides;
		if (DebugFlags.InDebugMode) {
			this._lineText = lineText;
		} else {
			this._lineText = null;
		}
		this._tokens = [];
		this._binaryTokens = [];
		this._lastTokenEndIndex = 0;
	}

	public produce(stack: StateStackImpl, endIndex: number): void {
		this.produceFromScopes(stack.contentNameScopesList, endIndex);
	}

	public produceFromScopes(
		scopesList: AttributedScopeStack | null,
		endIndex: number
	): void {
		if (this._lastTokenEndIndex >= endIndex) {
			return;
		}

		if (this._emitBinaryTokens) {
			let metadata = scopesList?.tokenAttributes ?? 0;
			let containsBalancedBrackets = false;
			if (this.balancedBracketSelectors?.matchesAlways) {
				containsBalancedBrackets = true;
			}

			if (this._tokenTypeOverrides.length > 0 || (this.balancedBracketSelectors && !this.balancedBracketSelectors.matchesAlways && !this.balancedBracketSelectors.matchesNever)) {
				// Only generate scope array when required to improve performance
				const scopes = scopesList?.getScopeNames() ?? [];
				for (const tokenType of this._tokenTypeOverrides) {
					if (tokenType.matcher(scopes)) {
						metadata = EncodedTokenAttributes.set(
							metadata,
							0,
							toOptionalTokenType(tokenType.type),
							null,
							FontStyle.NotSet,
							0,
							0
						);
					}
				}
				if (this.balancedBracketSelectors) {
					containsBalancedBrackets = this.balancedBracketSelectors.match(scopes);
				}
			}

			if (containsBalancedBrackets) {
				metadata = EncodedTokenAttributes.set(
					metadata,
					0,
					OptionalStandardTokenType.NotSet,
					containsBalancedBrackets,
					FontStyle.NotSet,
					0,
					0
				);
			}

			if (this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === metadata) {
				// no need to push a token with the same metadata
				this._lastTokenEndIndex = endIndex;
				return;
			}

			if (DebugFlags.InDebugMode) {
				const scopes = scopesList?.getScopeNames() ?? [];
				console.log('  token: |' + this._lineText!.substring(this._lastTokenEndIndex, endIndex).replace(/\n$/, '\\n') + '|');
				for (let k = 0; k < scopes.length; k++) {
					console.log('      * ' + scopes[k]);
				}
			}

			this._binaryTokens.push(this._lastTokenEndIndex);
			this._binaryTokens.push(metadata);

			this._lastTokenEndIndex = endIndex;
			return;
		}

		const scopes = scopesList?.getScopeNames() ?? [];

		if (DebugFlags.InDebugMode) {
			console.log('  token: |' + this._lineText!.substring(this._lastTokenEndIndex, endIndex).replace(/\n$/, '\\n') + '|');
			for (let k = 0; k < scopes.length; k++) {
				console.log('      * ' + scopes[k]);
			}
		}

		this._tokens.push({
			startIndex: this._lastTokenEndIndex,
			endIndex: endIndex,
			// value: lineText.substring(lastTokenEndIndex, endIndex),
			scopes: scopes
		});

		this._lastTokenEndIndex = endIndex;
	}

	public getResult(stack: StateStackImpl, lineLength: number): IToken[] {
		if (this._tokens.length > 0 && this._tokens[this._tokens.length - 1].startIndex === lineLength - 1) {
			// pop produced token for newline
			this._tokens.pop();
		}

		if (this._tokens.length === 0) {
			this._lastTokenEndIndex = -1;
			this.produce(stack, lineLength);
			this._tokens[this._tokens.length - 1].startIndex = 0;
		}

		return this._tokens;
	}

	public getBinaryResult(stack: StateStackImpl, lineLength: number): Uint32Array {
		if (this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 2] === lineLength - 1) {
			// pop produced token for newline
			this._binaryTokens.pop();
			this._binaryTokens.pop();
		}

		if (this._binaryTokens.length === 0) {
			this._lastTokenEndIndex = -1;
			this.produce(stack, lineLength);
			this._binaryTokens[this._binaryTokens.length - 2] = 0;
		}

		const result = new Uint32Array(this._binaryTokens.length);
		for (let i = 0, len = this._binaryTokens.length; i < len; i++) {
			result[i] = this._binaryTokens[i];
		}

		return result;
	}
}

