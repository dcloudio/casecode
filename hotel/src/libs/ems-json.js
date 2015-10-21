define(function(require, exports, module) {
	"require:nomunge,exports:nomunge,module:nomunge";
	"use strict";

	exports.load = function(name, req, onLoad, config) {
		var uri = req.toUrl(name);
		require('./ems-text!' + uri, function(rs) {
			onLoad(JSON.parse(rs));
		});
	};
});