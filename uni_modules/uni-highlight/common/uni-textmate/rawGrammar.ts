/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { RuleId } from "./rule";
import { ScopeName } from "./theme";

export interface IRawGrammar extends ILocatable {
	repository: IRawRepository;
	readonly scopeName: ScopeName;
	readonly patterns: IRawRule[];
	readonly injections?: { [expression: string]: IRawRule };
	readonly injectionSelector?: string;

	readonly fileTypes?: string[];
	readonly name?: string;
	readonly firstLineMatch?: string;
}

/**
 * Allowed values:
 * * Scope Name, e.g. `source.ts`
 * * Top level scope reference, e.g. `source.ts#entity.name.class`
 * * Relative scope reference, e.g. `#entity.name.class`
 * * self, e.g. `$self`
 * * base, e.g. `$base`
 */
export type IncludeString = string;
export type RegExpString = string;

export interface IRawRepositoryMap {
	[name: string]: IRawRule;
	$self: IRawRule;
	$base: IRawRule;
}

export type IRawRepository = IRawRepositoryMap & ILocatable;

export interface IRawRule extends ILocatable {
	id?: RuleId; // This is not part of the spec only used internally

	readonly include?: IncludeString;

	readonly name?: ScopeName;
	readonly contentName?: ScopeName;

	readonly match?: RegExpString;
	readonly captures?: IRawCaptures;
	readonly begin?: RegExpString;
	readonly beginCaptures?: IRawCaptures;
	readonly end?: RegExpString;
	readonly endCaptures?: IRawCaptures;
	readonly while?: RegExpString;
	readonly whileCaptures?: IRawCaptures;
	readonly patterns?: IRawRule[];

	readonly repository?: IRawRepository;

	readonly applyEndPatternLast?: boolean;
}

export type IRawCaptures = IRawCapturesMap & ILocatable;

export interface IRawCapturesMap {
	[captureId: string]: IRawRule;
}

export interface ILocation {
	readonly filename: string;
	readonly line: number;
	readonly char: number;
}

export interface ILocatable {
	readonly $vscodeTextmateLocation?: ILocation;
}
