/**
 * @class ErrorLog 错误日志模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const {
	DateTime,
	UniCrypto
} = require('../lib')
module.exports = class ErrorLog extends BaseMod {
	constructor() {
		super()
		this.tableName = 'error-logs'
	}

	/**
	 * 错误日志数据填充
	 * @param {Object} reportParams 上报参数
	 */
	async fill(reportParams) {
		let params, errorHash, errorCount, cacheKey;
		const fillParams = []
		const platform = new Platform()
		const dateTime = new DateTime()
		const uniCrypto = new UniCrypto()
		const channel = new Channel()
		const {
			needCheck,
			checkTime
		} = this.getConfig('errorCheck')
		const errorCheckTime = Math.max(checkTime, 1)
		let spaceId
		let spaceProvider
		for (const rk in reportParams) {
			params = reportParams[rk]
			errorHash = uniCrypto.md5(params.em)
			cacheKey = 'error-count-' + errorHash
			// 校验在指定时间段内是否已存在相同的错误项
			if (needCheck) {
				errorCount = await this.getCache(cacheKey)
				if (!errorCount) {
					errorCount = await this.getCollection(this.tableName).where({
						error_hash: errorHash,
						create_time: {
							$gte: dateTime.getTime() - errorCheckTime * 60000
						}
					}).count()
					if (errorCount && errorCount.total > 0) {
						await this.setCache(cacheKey, errorCount, errorCheckTime * 60)
					}
				}

				if (errorCount && errorCount.total > 0) {
					if (this.debug) {
						console.log('This error have already existsed: ' + params.em)
					}
					continue
				}
			}

			//获取云端信息
			spaceId = null
			spaceProvider = null
			if (params.spi) {
				//云函数调用参数
				spaceId = params.spi.spaceId
				spaceProvider = params.spi.provider
			} else {
				//云对象调用参数
				if (params.spid) {
					spaceId = params.spid
				}
				if (params.sppd) {
					spaceProvider = params.sppd
				}
			}

			// 填充数据
			fillParams.push({
				appid: params.ak,
				version: params.v ? params.v : '',
				platform: platform.getPlatformCode(params.ut, params.p),
				channel: channel.getChannelCode(params),
				device_id: params.did,
				uid: params.uid ? params.uid : '',
				os: params.on ? params.on : platform.getOsName(params.p),
				ua: params.ua ? params.ua : '',
				page_url: params.url ? params.url : '',
				space_id: spaceId ? spaceId : '',
				space_provider: spaceProvider ? spaceProvider : '',
				platform_version: params.mpv ? params.mpv : '',
				error_msg: params.em ? params.em : '',
				error_hash: errorHash,
				create_time: dateTime.getTime()
			})
		}

		if (fillParams.length === 0) {
			return {
				code: 200,
				msg: 'Invild param'
			}
		}

		const res = await this.insert(this.tableName, fillParams)
		if (res && res.inserted) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'Filled error'
			}
		}
	}

	/**
	 * 错误日志清理
	 * @param {Number} days 日志保留天数, 0为永久保留
	 */
	async clean(days) {
		if(days === 0) {
			return false;
		}
		days = Math.max(parseInt(days), 1)
		console.log('clean error logs - day:', days)
		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})
		if (!res.code) {
			console.log('clean error log:', res)
		}
		return res
	}
}
