const auth = require('./middleware/auth')
const permission = require('./middleware/permission')

function initPlugins(config) {
	const fs = require('fs')
	const path = require('path')
	const pluginDir = path.resolve(__dirname, 'plugin')
	let files
	try {
		files = fs.readdirSync(pluginDir)
	} catch (e) {}
	if (!files || files.length === 0) {
		return config
	}
	const EXTNAME = '.js'
	const configPlugins = config.plugin || {}
	files.forEach(file => {
		if (path.extname(file) !== EXTNAME) {
			return
		}
		let pluginOptions
		const pluginId = file.replace(EXTNAME, '')
		const configPlugin = configPlugins[pluginId]
		if (configPlugin === false) {
			return
		}
		if (configPlugin) {
			if (configPlugin.enable === false) {
				return
			}
			if (configPlugin.options) {
				pluginOptions = configPlugin.options
			}
		}
		const plugin = require(path.resolve(pluginDir, file))(pluginOptions)
		plugin && plugin.onInit(config)
	})
	return config
}

module.exports = initPlugins({
	baseDir: __dirname, // 项目根目录
	plugin: {}, // 插件配置，可设置是否启用某插件及插件所有参数
	middleware: [
		[
			auth(), // uniId 校验 token 中间件
			{
				name: 'auth',
				enable: true,
				ignore: 'user'
			}
		],
		[
			permission(), // uniId 校验权限中间件
			{
				name: 'permission',
				enable: true,
				ignore: ['app', 'user', 'self']
			}
		]
	]
})
