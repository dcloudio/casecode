/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { IOnigLib } from '../onigLib';

let onigurumaLib: Promise<IOnigLib> | null = null;

export function getOniguruma(): Promise<IOnigLib> {
	if (!onigurumaLib) {
		let vscodeOnigurumaModule = require('vscode-oniguruma');
		let fs = require('fs');
		let path = require('path');
		const wasmBin = fs.readFileSync(path.join(__dirname, '../../node_modules/vscode-oniguruma/release/onig.wasm')).buffer;
		onigurumaLib = (<Promise<any>>vscodeOnigurumaModule.loadWASM(wasmBin)).then((_: any) => {
			return {
				createOnigScanner(patterns: string[]) { return new vscodeOnigurumaModule.OnigScanner(patterns); },
				createOnigString(s: string) { return new vscodeOnigurumaModule.OnigString(s); }
			};
		});
	}
	return onigurumaLib;
}
