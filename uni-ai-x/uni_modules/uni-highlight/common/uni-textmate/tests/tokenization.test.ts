/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import { Registry, IGrammar, RegistryOptions, StateStack, parseRawGrammar } from '../main';
import { IOnigLib } from '../onigLib';
import { getOniguruma } from './onigLibs';
import { IRawGrammar } from '../rawGrammar';
import { applyStateStackDiff, diffStateStacksRefEq } from '../diffStateStacks';

const REPO_ROOT = path.join(__dirname, '../../');

function assertTokenizationSuite(testLocation: string): void {

	interface IRawTest {
		desc: string;
		grammars: string[];
		grammarPath?: string;
		grammarScopeName?: string;
		grammarInjections?: string[];
		lines: IRawTestLine[];
	}
	interface IRawTestLine {
		line: string;
		tokens: IRawToken[];
	}
	interface IRawToken {
		value: string;
		scopes: string[];
	}

	let tests: IRawTest[] = JSON.parse(fs.readFileSync(testLocation).toString());


	tests.forEach((tst) => {

		test(tst.desc, async () => {
			await performTest(tst, getOniguruma());
		});
	});

	async function performTest(test: IRawTest, onigLib: Promise<IOnigLib>): Promise<void> {

		let grammarScopeName = test.grammarScopeName;
		let grammarByScope : { [scope:string]:IRawGrammar } = {};
		for (let grammarPath of test.grammars) {
			let content = fs.readFileSync(path.join(path.dirname(testLocation), grammarPath)).toString();
			let rawGrammar = parseRawGrammar(content, grammarPath);
			grammarByScope[rawGrammar.scopeName] = rawGrammar;
			if (!grammarScopeName && grammarPath === test.grammarPath) {
				grammarScopeName = rawGrammar.scopeName;
			}
		}
		if (!grammarScopeName) {
			throw new Error('I HAVE NO GRAMMAR FOR TEST');
		}

		let options: RegistryOptions = {
			onigLib: onigLib,
			loadGrammar: (scopeName: string) => Promise.resolve(grammarByScope[scopeName]),
			getInjections: (scopeName: string) => {
				if (scopeName === grammarScopeName) {
					return test.grammarInjections;
				}
			}
		};
		let registry = new Registry(options);
		let grammar: IGrammar | null = await registry.loadGrammar(grammarScopeName);
		if (!grammar) {
			throw new Error('I HAVE NO GRAMMAR FOR TEST');
		}
		let prevState: StateStack | null = null;
		for (let i = 0; i < test.lines.length; i++) {
			prevState = assertLineTokenization(grammar, test.lines[i], prevState);
		}
	}

	function assertLineTokenization(grammar: IGrammar, testCase: IRawTestLine, prevState: StateStack | null): StateStack {
		let actual = grammar.tokenizeLine(testCase.line, prevState);

		let actualTokens: IRawToken[] = actual.tokens.map((token) => {
			return {
				value: testCase.line.substring(token.startIndex, token.endIndex),
				scopes: token.scopes
			};
		});

		// TODO@Alex: fix tests instead of working around
		if (testCase.line.length > 0) {
			// Remove empty tokens...
			testCase.tokens = testCase.tokens.filter((token) => {
				return (token.value.length > 0);
			});
		}

		assert.deepStrictEqual(actualTokens, testCase.tokens, 'Tokenizing line ' + testCase.line);

		if (prevState) {
			const diff = diffStateStacksRefEq(prevState, actual.ruleStack);
			actual = { ...actual, ruleStack: applyStateStackDiff(prevState, diff)! }
		}

		return actual.ruleStack;
	}
}

assertTokenizationSuite(path.join(REPO_ROOT, 'test-cases/first-mate/tests.json'));
assertTokenizationSuite(path.join(REPO_ROOT, 'test-cases/suite1/tests.json'));
assertTokenizationSuite(path.join(REPO_ROOT, 'test-cases/suite1/whileTests.json'));
