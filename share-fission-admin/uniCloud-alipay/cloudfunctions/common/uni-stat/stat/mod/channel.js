/**
 * @class Channel 渠道模型
 */
const BaseMod = require('./base')
const Scenes = require('./scenes')
const Platform = require('./platform')
const {
	DateTime
} = require('../lib')
module.exports = class Channel extends BaseMod {
	constructor() {
		super()
		this.tableName = 'app-channels'
		this.scenes = new Scenes()
	}

	/**
	 * 获取渠道信息
	 * @param {String} appid
	 * @param {String} platformId 平台编号
	 * @param {String} channel 渠道代码
	 */
	async getChannel(appid, platformId, channel) {
		const cacheKey = 'uni-stat-channel-' + appid + '-' + platformId + '-' + channel
		let channelData = await this.getCache(cacheKey)
		if (!channelData) {
			const channelInfo = await this.getCollection(this.tableName).where({
				appid: appid,
				platform_id: platformId,
				channel_code: channel
			}).limit(1).get()
			channelData = []
			if (channelInfo.data.length > 0) {
				channelData = channelInfo.data[0]
				if (channelData.channel_name === '') {
					const scenesName = await this.scenes.getScenesNameByPlatformId(platformId, channel)
					if (scenesName) {
						await this.update(this.tableName, {
							channel_name: scenesName,
							update_time: new DateTime().getTime()
						}, {
							_id: channelData._id
						})
					}
				}
				await this.setCache(cacheKey, channelData)
			}
		}
		return channelData
	}

	/**
	 * 获取渠道信息没有则进行创建
	 * @param {String} appid
	 * @param {String} platformId
	 * @param {String} channel
	 */
	async getChannelAndCreate(appid, platformId, channel) {
		if (!appid || !platformId) {
			return []
		}
		const channelInfo = await this.getChannel(appid, platformId, channel)
		if (channelInfo.length === 0) {
			const thisTime = new DateTime().getTime()
			const insertParam = {
				appid: appid,
				platform_id: platformId,
				channel_code: channel,
				channel_name: await this.scenes.getScenesNameByPlatformId(platformId, channel),
				create_time: thisTime,
				update_time: thisTime
			}
			const res = await this.insert(this.tableName, insertParam)
			if (res && res.id) {
				return Object.assign(insertParam, {
					_id: res.id
				})
			}
		}
		return channelInfo
	}

	/**
	 * 获取渠道_id
	 * @param {String} appid
	 * @param {String} platformId
	 * @param {String} channel
	 */
	async getChannelId(appid, platformId, channel) {
		const channelInfo = await this.getChannel(appid, platformId, channel)
		return channelInfo.length > 0 ? channelInfo._id : ''
	}

	/**
	 * 获取渠道码或者场景值
	 * @param {Object} params 上报参数
	 */
	getChannelCode(params) {
		//小程序未上报渠道则使用场景值
		const platform = new Platform()
		const platformCode = platform.getPlatformCode(params.ut, params.p)
		if (params.ch) {
			return params.ch
		} else if (params.sc && platformCode.indexOf('mp-') === 0) {
			return params.sc
		}
		return this.scenes.defualtCode
	}
}
