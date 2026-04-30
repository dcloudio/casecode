if (process.env.VITE_ROOT_DIR) { // vite
	const {
		uniPostcssPlugin,
		parseRpx2UnitOnce,
	} = require('@dcloudio/uni-cli-shared')
	module.exports = {
		plugins: [
			uniPostcssPlugin(
				Object.assign({
						page: process.env.UNI_PLATFORM === 'h5' ? 'uni-page-body' : 'body'
					},
					parseRpx2UnitOnce(process.env.UNI_INPUT_DIR)
				)
			),
			require('autoprefixer')(),
		],
	}
} else {

	const path = require('path')
	module.exports = {
		parser: 'postcss-comment',
		plugins: {
			'postcss-import': {
				resolve(id, basedir, importOptions) {
					if (id.startsWith('~@/')) {
						return path.resolve(process.env.UNI_INPUT_DIR, id.substr(3))
					} else if (id.startsWith('@/')) {
						return path.resolve(process.env.UNI_INPUT_DIR, id.substr(2))
					} else if (id.startsWith('/') && !id.startsWith('//')) {
						return path.resolve(process.env.UNI_INPUT_DIR, id.substr(1))
					}
					return id
				}
			},
			'autoprefixer': {
				overrideBrowserslist: ["> 1%", "last 2 versions", "not dead"],
				remove: process.env.UNI_PLATFORM !== 'h5',
				ignoreUnknownVersions: true
			},
			'@dcloudio/vue-cli-plugin-uni/packages/postcss': {}
		}
	}
}
