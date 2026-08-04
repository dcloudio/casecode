/**
 * @class Platform 应用平台模型
 */
const BaseMod = require('./base')
const {
	DateTime
} = require('../lib')
module.exports = class Platform extends BaseMod {
	constructor() {
		super()
		this.tableName = 'app-platforms'
	}

	/**
	 * 获取平台信息
	 * @param {String} platform 平台代码
	 * @param {String} os 系统
	 */
	async getPlatform(platform, os) {
		const cacheKey = 'uni-stat-platform-' + platform + '-' + os
		let platformData = await this.getCache(cacheKey)
		if (!platformData) {
			const platformCode = this.getPlatformCode(platform, os)
			const platformInfo = await this.getCollection(this.tableName).where({
				code: platformCode
			}).limit(1).get()
			platformData = []
			if (platformInfo.data.length > 0) {
				platformData = platformInfo.data[0]
				await this.setCache(cacheKey, platformData)
			}
		}
		return platformData
	}

	/**
	 * 获取平台信息没有则创建
	 * @param {String} platform 平台代码
	 * @param {String} os 系统
	 */
	async getPlatformAndCreate(platform, os) {
		if (!platform) {
			return false
		}
		const platformInfo = await this.getPlatform(platform, os)

		if (platformInfo.length === 0) {
			const platformCode = this.getPlatformCode(platform, os)
			const insertParam = {
				code: platformCode,
				name: platformCode,
				create_time: new DateTime().getTime()
			}
			const res = await this.insert(this.tableName, insertParam)
			if (res && res.id) {
				return Object.assign(insertParam, {
					_id: res.id
				})
			}
		}
		return platformInfo
	}

	/**
	 * 获取平台代码
	 * @param {String} platform 平台代码
	 * @param {String} os 系统
	 */
	getPlatformCode(platform, os) {
		let platformCode = platform

		//兼容客户端上报参数
		switch (platform) {
			//h5|web
			case 'h5':
				platformCode = 'web'
				break
				//微信小程序
			case 'wx':
				platformCode = 'mp-weixin'
				break
				//百度小程序
			case 'bd':
				platformCode = 'mp-baidu'
				break
				//支付宝小程序
			case 'ali':
				platformCode = 'mp-alipay'
				break
				//字节跳动小程序
			case 'tt':
				platformCode = 'mp-toutiao'
				break
				//qq小程序
			case 'qq':
				platformCode = 'mp-qq'
				break
				//快应用联盟
			case 'qn':
				platformCode = 'quickapp-webview-union'
				break
				//快应用(webview)
			case 'qw':
				platformCode = 'quickapp-webview'
				break
				//快应用华为
			case 'qi':
				platformCode = 'quickapp-webview-huawei'
				break
				//360小程序
			case '360':
				platformCode = 'mp-360'
				break
				//京东小程序
			case 'jd':
				platformCode = 'mp-jd'
				break
				//钉钉小程序
			case 'dt':
				platformCode = 'mp-dingtalk'
				break
				//快手小程序
			case 'ks':
				platformCode = 'mp-kuaishou'
				break
				//飞书小程序
			case 'lark':
				platformCode = 'mp-lark'
				break
				//鸿蒙元服务
			case 'mhm':
				platformCode = 'mp-harmony'
				break
				//小红书小程序
			case 'xhs':
				platformCode = 'mp-xhs'
				break
				//原生应用
			case 'app-android':
				platformCode = 'android'
				break
			case 'app-ios':
				platformCode = 'ios'
				break
			case 'app-harmony':
				platformCode = 'harmony'
				break
			case 'n':
			case 'app-plus':
			case 'app':
				os = this.getOsName(os)
				if (os === 'ios') {
					platformCode = 'ios'
				} else if (os === 'harmonyos') {
					platformCode = 'harmony'
				} else {
					platformCode = 'android'
				}
				break
		}
		return platformCode
	}

	/**
	 * 获取系统名称
	 * @param {Object} os系统标识
	 */
	getOsName(os) {
		if (!os) {
			return ''
		}
		//兼容老版上报参数
		const osSetting = {
			i: 'ios',
			a: 'android',
			h: 'harmonyos'
		}
		return osSetting[os] ? osSetting[os] : os
	}
}
