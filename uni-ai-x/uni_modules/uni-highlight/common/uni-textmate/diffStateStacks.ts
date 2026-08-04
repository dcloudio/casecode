/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { StateStackImpl, StateStackFrame } from "./grammar";
import { StateStack } from "./main";

export function diffStateStacksRefEq(first: StateStack, second: StateStack): StackDiff {
	let pops = 0;
	const newFrames: StateStackFrame[] = [];

	let curFirst: StateStackImpl | null = first as StateStackImpl;
	let curSecond: StateStackImpl | null = second as StateStackImpl;

	while (curFirst !== curSecond) {
		if (curFirst && (!curSecond || curFirst.depth >= curSecond.depth)) {
			// curFirst is certainly not contained in curSecond
			pops++;
			curFirst = curFirst.parent;
		} else {
			// curSecond is certainly not contained in curFirst.
			// Also, curSecond must be defined, as otherwise a previous case would match
			newFrames.push(curSecond!.toStateStackFrame());
			curSecond = curSecond!.parent;
		}
	}
	return {
		pops,
		newFrames: newFrames.reverse(),
	};
}

export function applyStateStackDiff(stack: StateStack | null, diff: StackDiff): StateStackImpl | null {
	let curStack = stack as StateStackImpl | null;
	for (let i = 0; i < diff.pops; i++) {
		curStack = curStack!.parent;
	}
	for (const frame of diff.newFrames) {
		curStack = StateStackImpl.pushFrame(curStack, frame);
	}
	return curStack;
}

export interface StackDiff {
	readonly pops: number;
	readonly newFrames: StateStackFrame[];
}
