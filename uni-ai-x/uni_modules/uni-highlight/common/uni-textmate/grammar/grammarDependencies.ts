/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { IRawGrammar, IRawRepository, IRawRule } from '../rawGrammar';
import { ScopeName } from '../theme';
import { mergeObjects } from '../utils';
import { IGrammarRepository } from './grammar';

export type AbsoluteRuleReference = TopLevelRuleReference | TopLevelRepositoryRuleReference;

/**
 * References the top level rule of a grammar with the given scope name.
*/
export class TopLevelRuleReference {
	constructor(
		public readonly scopeName: ScopeName
	) { }

	public toKey(): string {
		return this.scopeName;
	}
}

/**
 * References a rule of a grammar in the top level repository section with the given name.
*/
export class TopLevelRepositoryRuleReference {
	constructor(
		public readonly scopeName: ScopeName,
		public readonly ruleName: string
	) { }

	public toKey(): string {
		return `${this.scopeName}#${this.ruleName}`;
	}
}

export class ExternalReferenceCollector {
	private readonly _references: AbsoluteRuleReference[] = [];
	private readonly _seenReferenceKeys = new Set<string>();

	public get references(): readonly AbsoluteRuleReference[] {
		return this._references;
	}

	public readonly visitedRule = new Set<IRawRule>();

	public add(reference: AbsoluteRuleReference): void {
		const key = reference.toKey();
		if (this._seenReferenceKeys.has(key)) {
			return;
		}
		this._seenReferenceKeys.add(key);
		this._references.push(reference);
	}
}

export class ScopeDependencyProcessor {
	public readonly seenFullScopeRequests = new Set<ScopeName>();
	public readonly seenPartialScopeRequests = new Set<string>();
	public Q: AbsoluteRuleReference[];

	constructor(
		public readonly repo: IGrammarRepository,
		public readonly initialScopeName: ScopeName
	) {
		this.seenFullScopeRequests.add(this.initialScopeName);
		this.Q = [new TopLevelRuleReference(this.initialScopeName)];
	}

	public processQueue(): void {
		const q = this.Q;
		this.Q = [];

		const deps = new ExternalReferenceCollector();
		for (const dep of q) {
			collectReferencesOfReference(dep, this.initialScopeName, this.repo, deps);
		}

		for (const dep of deps.references) {
			if (dep instanceof TopLevelRuleReference) {
				if (this.seenFullScopeRequests.has(dep.scopeName)) {
					// already processed
					continue;
				}
				this.seenFullScopeRequests.add(dep.scopeName);
				this.Q.push(dep);
			} else {
				if (this.seenFullScopeRequests.has(dep.scopeName)) {
					// already processed in full
					continue;
				}
				if (this.seenPartialScopeRequests.has(dep.toKey())) {
					// already processed
					continue;
				}
				this.seenPartialScopeRequests.add(dep.toKey());
				this.Q.push(dep);
			}
		}
	}
}

function collectReferencesOfReference(
	reference: TopLevelRuleReference | TopLevelRepositoryRuleReference,
	baseGrammarScopeName: ScopeName,
	repo: IGrammarRepository,
	result: ExternalReferenceCollector,
) {
	const selfGrammar = repo.lookup(reference.scopeName);
	if (!selfGrammar) {
		if (reference.scopeName === baseGrammarScopeName) {
			throw new Error(`No grammar provided for <${baseGrammarScopeName}>`);
		}
		return;
	}

	const baseGrammar = repo.lookup(baseGrammarScopeName)!;

	if (reference instanceof TopLevelRuleReference) {
		collectExternalReferencesInTopLevelRule({ baseGrammar, selfGrammar }, result);
	} else {
		collectExternalReferencesInTopLevelRepositoryRule(
			reference.ruleName,
			{ baseGrammar, selfGrammar, repository: selfGrammar.repository },
			result
		);
	}

	const injections = repo.injections(reference.scopeName);
	if (injections) {
		for (const injection of injections) {
			result.add(new TopLevelRuleReference(injection));
		}
	}
}

interface Context {
	baseGrammar: IRawGrammar;
	selfGrammar: IRawGrammar;
}

interface ContextWithRepository {
	baseGrammar: IRawGrammar;
	selfGrammar: IRawGrammar;
	repository: Record<string, IRawRule> | undefined;
}

function collectExternalReferencesInTopLevelRepositoryRule(
	ruleName: string,
	context: ContextWithRepository,
	result: ExternalReferenceCollector
): void {
	if (context.repository && context.repository[ruleName]) {
		const rule = context.repository[ruleName];
		collectExternalReferencesInRules([rule], context, result);
	}
}

function collectExternalReferencesInTopLevelRule(context: Context, result: ExternalReferenceCollector): void {
	if (context.selfGrammar.patterns && Array.isArray(context.selfGrammar.patterns)) {
		collectExternalReferencesInRules(
			context.selfGrammar.patterns,
			{ ...context, repository: context.selfGrammar.repository },
			result
		);
	}
	if (context.selfGrammar.injections) {
		collectExternalReferencesInRules(
			Object.values(context.selfGrammar.injections),
			{ ...context, repository: context.selfGrammar.repository },
			result
		);
	}
}

function collectExternalReferencesInRules(
	rules: IRawRule[],
	context: ContextWithRepository,
	result: ExternalReferenceCollector,
): void {
	for (const rule of rules) {
		if (result.visitedRule.has(rule)) {
			continue;
		}
		result.visitedRule.add(rule);

		const patternRepository = rule.repository ? mergeObjects({}, context.repository, rule.repository) : context.repository;

		if (Array.isArray(rule.patterns)) {
			collectExternalReferencesInRules(rule.patterns, { ...context, repository: patternRepository }, result);
		}

		const include = rule.include;

		if (!include) {
			continue;
		}

		const reference = parseInclude(include);

		switch (reference.kind) {
			case IncludeReferenceKind.Base:
				collectExternalReferencesInTopLevelRule({ ...context, selfGrammar: context.baseGrammar }, result);
				break;
			case IncludeReferenceKind.Self:
				collectExternalReferencesInTopLevelRule(context, result);
				break;
			case IncludeReferenceKind.RelativeReference:
				collectExternalReferencesInTopLevelRepositoryRule(reference.ruleName, { ...context, repository: patternRepository }, result);
				break;
			case IncludeReferenceKind.TopLevelReference:
			case IncludeReferenceKind.TopLevelRepositoryReference:
				const selfGrammar =
					reference.scopeName === context.selfGrammar.scopeName
						? context.selfGrammar
						: reference.scopeName === context.baseGrammar.scopeName
						? context.baseGrammar
						: undefined;
				if (selfGrammar) {
					const newContext: ContextWithRepository = { baseGrammar: context.baseGrammar, selfGrammar, repository: patternRepository };
					if (reference.kind === IncludeReferenceKind.TopLevelRepositoryReference) {
						collectExternalReferencesInTopLevelRepositoryRule(reference.ruleName, newContext, result);
					} else {
						collectExternalReferencesInTopLevelRule(newContext, result);
					}
				} else {
					if (reference.kind === IncludeReferenceKind.TopLevelRepositoryReference) {
						result.add(new TopLevelRepositoryRuleReference(reference.scopeName, reference.ruleName));
					} else {
						result.add(new TopLevelRuleReference(reference.scopeName));
					}
				}
				break;
		}
	}
}

export type IncludeReference =
	| BaseReference
	| SelfReference
	| RelativeReference
	| TopLevelReference
	| TopLevelRepositoryReference;

export const enum IncludeReferenceKind {
	Base,
	Self,
	RelativeReference,
	TopLevelReference,
	TopLevelRepositoryReference,
}

export class BaseReference {
	public readonly kind = IncludeReferenceKind.Base;
}

export class SelfReference {
	public readonly kind = IncludeReferenceKind.Self;
}

export class RelativeReference {
	public readonly kind = IncludeReferenceKind.RelativeReference;
	constructor(public readonly ruleName: string) {}
}

export class TopLevelReference {
	public readonly kind = IncludeReferenceKind.TopLevelReference;
	constructor(public readonly scopeName: ScopeName) {}
}

export class TopLevelRepositoryReference {
	public readonly kind = IncludeReferenceKind.TopLevelRepositoryReference;
	constructor(public readonly scopeName: ScopeName, public readonly ruleName: string) {}
}

export function parseInclude(include: string): IncludeReference {
	if (include === '$base') {
		return new BaseReference();
	} else if (include === '$self') {
		return new SelfReference();
	}

	const indexOfSharp = include.indexOf("#");
	if (indexOfSharp === -1) {
		return new TopLevelReference(include);
	} else if (indexOfSharp === 0) {
		return new RelativeReference(include.substring(1));
	} else {
		const scopeName = include.substring(0, indexOfSharp);
		const ruleName = include.substring(indexOfSharp + 1);
		return new TopLevelRepositoryReference(scopeName, ruleName);
	}
}
