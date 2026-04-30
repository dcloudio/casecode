/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { IRawGrammar } from './rawGrammar';
import * as plist from './plist';
import { DebugFlags } from './debug';
import { parseJSON } from './json';

export function parseRawGrammar(content: string, filePath: string | null = null): IRawGrammar {
	if (filePath !== null && /\.json$/.test(filePath)) {
		return parseJSONGrammar(content, filePath);
	}
	return parsePLISTGrammar(content, filePath);
}

function parseJSONGrammar(contents: string, filename: string | null): IRawGrammar {
	if (DebugFlags.InDebugMode) {
		return <IRawGrammar>parseJSON(contents, filename, true);
	}
	return <IRawGrammar>JSON.parse(contents);
}

function parsePLISTGrammar(contents: string, filename: string | null): IRawGrammar {
	if (DebugFlags.InDebugMode) {
		return <IRawGrammar>plist.parseWithLocation(contents, filename, '$vscodeTextmateLocation');
	}
	return <IRawGrammar>plist.parsePLIST(contents);
}
