/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as fs from 'fs';
import { Registry, IGrammar, parseRawGrammar } from '../main';
import { StateStackImpl as StackElementImpl, Grammar as GrammarImpl } from '../grammar';
import * as debug from '../debug';
import { getOniguruma } from './onigLibs';

class ExtendedStackElement extends StackElementImpl {
	_instanceId?: number;
}

debug.DebugFlags.InDebugMode = true;

if (process.argv.length < 4) {
	console.log('usage: node index.js <mainGrammarPath> [<additionalGrammarPath1> ...] <filePath>');
	process.exit(0);
}

const GRAMMAR_PATHS = process.argv.slice(2, process.argv.length - 1);
const FILE_PATH = process.argv[process.argv.length - 1];

const registry = new Registry({
	onigLib: getOniguruma(),
	loadGrammar: () => Promise.resolve(null)
});
let grammarPromises: Promise<IGrammar>[] = [];
for (let path of GRAMMAR_PATHS) {
	console.log('LOADING GRAMMAR: ' + path);
	const content = fs.readFileSync(path).toString();
	const rawGrammar = parseRawGrammar(content, path);
	grammarPromises.push(registry.addGrammar(rawGrammar));
}

Promise.all(grammarPromises).then(_grammars => {
	const grammar = _grammars[0];
	const fileContents = fs.readFileSync(FILE_PATH).toString();
	const lines = fileContents.split(/\r\n|\r|\n/);
	let ruleStack = null;
	let lastElementId = 0;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		console.log('');
		console.log('');
		console.log('===========================================');
		console.log('TOKENIZING LINE ' + (i + 1) + ': |' + line + '|');

		const r = grammar.tokenizeLine(line, ruleStack);

		console.log('');

		let stackElement: ExtendedStackElement | null = <ExtendedStackElement>r.ruleStack;
		let cnt = 0;
		while (stackElement) {
			cnt++;
			stackElement = stackElement.parent;
		}

		console.log('@@LINE END RULE STACK CONTAINS ' + cnt + ' RULES:');
		stackElement = <ExtendedStackElement>r.ruleStack;
		let list: string[] = [];
		while (stackElement) {
			if (!stackElement._instanceId) {
				stackElement._instanceId = (++lastElementId);
			}
			let ruleDesc = stackElement.getRule(grammar as GrammarImpl);
			if (!ruleDesc) {
				list.push('  * no rule description found');
			} else {
				list.push('  * ' + ruleDesc.debugName + '  -- [' + ruleDesc.id + ',' + stackElement._instanceId + '] "' + stackElement.nameScopesList!.getScopeNames() + '", "' + stackElement.contentNameScopesList!.getScopeNames() + '"');
			}
			stackElement = stackElement.parent;
		}
		list.reverse();
		console.log(list.join('\n'));

		ruleStack = r.ruleStack;
	}
});
