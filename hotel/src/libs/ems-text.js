(function() {
	var globalRequire = typeof require != "undefined" && require;
	define(function(require, exports, module) {
		"require:nomunge,exports:nomunge,module:nomunge";
		"use strict";

		var $ = require("../libs/jquery");

		exports.load = function(name, req, onLoad, config) {
			var uri = req.toUrl(name);
			if (globalRequire && globalRequire.nodeRequire) {
				onLoad(globalRequire.nodeRequire('fs').readFileSync(uri, 'utf8'));
			} else {
				$.get(uri, onLoad);
			}
		};
	});
})();