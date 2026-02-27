/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { IOnigCaptureIndex } from './onigLib';

export function clone<T>(something: T): T {
	return doClone(something);
}

function doClone(something: any): any {
	if (Array.isArray(something)) {
		return cloneArray(something);
	}
	if (typeof something === 'object') {
		return cloneObj(something);
	}
	return something;
}

function cloneArray(arr: any[]): any[] {
	let r: any[] = [];
	for (let i = 0, len = arr.length; i < len; i++) {
		r[i] = doClone(arr[i]);
	}
	return r;
}

function cloneObj(obj: any): any {
	let r: any = {};
	for (let key in obj) {
		r[key] = doClone(obj[key]);
	}
	return r;
}

export function mergeObjects(target: any, ...sources: any[]): any {
	sources.forEach(source => {
		for (let key in source) {
			target[key] = source[key];
		}
	});
	return target;
}

export function basename(path: string): string {
	const idx = ~path.lastIndexOf('/') || ~path.lastIndexOf('\\');
	if (idx === 0) {
		return path;
	} else if (~idx === path.length - 1) {
		return basename(path.substring(0, path.length - 1));
	} else {
		return path.substr(~idx + 1);
	}
}

let CAPTURING_REGEX_SOURCE = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g;

export class RegexSource {

	public static hasCaptures(regexSource: string | null): boolean {
		if (regexSource === null) {
			return false;
		}
		CAPTURING_REGEX_SOURCE.lastIndex = 0;
		return CAPTURING_REGEX_SOURCE.test(regexSource);
	}

	public static replaceCaptures(regexSource: string, captureSource: string, captureIndices: IOnigCaptureIndex[]): string {
		return regexSource.replace(CAPTURING_REGEX_SOURCE, (match: string, index: string, commandIndex: string, command: string) => {
			let capture = captureIndices[parseInt(index || commandIndex, 10)];
			if (capture) {
				let result = captureSource.substring(capture.start, capture.end);
				// Remove leading dots that would make the selector invalid
				while (result[0] === '.') {
					result = result.substring(1);
				}
				switch (command) {
					case 'downcase':
						return result.toLowerCase();
					case 'upcase':
						return result.toUpperCase();
					default:
						return result;
				}
			} else {
				return match;
			}
		});
	}
}

/**
 * A union of given const enum values.
*/
export type OrMask<T extends number> = number;

export function strcmp(a: string, b: string): number {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
}

export function strArrCmp(a: readonly string[] | null, b: readonly string[] | null): number {
	if (a === null && b === null) {
		return 0;
	}
	if (!a) {
		return -1;
	}
	if (!b) {
		return 1;
	}
	let len1 = a.length;
	let len2 = b.length;
	if (len1 === len2) {
		for (let i = 0; i < len1; i++) {
			let res = strcmp(a[i], b[i]);
			if (res !== 0) {
				return res;
			}
		}
		return 0;
	}
	return len1 - len2;
}

export function isValidHexColor(hex: string): boolean {
	if (/^#[0-9a-f]{6}$/i.test(hex)) {
		// #rrggbb
		return true;
	}

	if (/^#[0-9a-f]{8}$/i.test(hex)) {
		// #rrggbbaa
		return true;
	}

	if (/^#[0-9a-f]{3}$/i.test(hex)) {
		// #rgb
		return true;
	}

	if (/^#[0-9a-f]{4}$/i.test(hex)) {
		// #rgba
		return true;
	}

	return false;
}

/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value: string): string {
	return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}

export class CachedFn<TKey, TValue> {
	private readonly cache = new Map<TKey, TValue>();
	constructor(private readonly fn: (key: TKey) => TValue) {
	}

	public get(key: TKey): TValue {
		if (this.cache.has(key)) {
			return this.cache.get(key)!;
		}
		const value = this.fn(key);
		this.cache.set(key, value);
		return value;
	}
}

declare let performance: { now: () => number } | undefined;
export const performanceNow =
	typeof performance === "undefined"
		// performance.now() is not available in this environment, so use Date.now()
		? function () {
				return Date.now();
		  }
		: function () {
				return performance!.now();
		  };