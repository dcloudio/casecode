'use strict';
const {
	secret,
	getVersion
} = require('hello-common')
exports.main = async (event, context) => {
	let version = getVersion()

	console.log("secret: " + secret);
	console.log("version: " + version);

	return {
		secret,
		version
	}
};
