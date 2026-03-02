/**
 * @class ErrorResult 错误结果统计模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const ErrorLog = require('./errorLog')
const AppCrashLogs = require('./appCrashLogs')
const SessionLog = require('./sessionLog')
const {
	DateTime
} = require('../lib')
module.exports = class ErrorResult extends BaseMod {
	constructor() {
		super()
		this.tableName = 'error-result'
		this.platforms = []
		this.channels = []
		this.versions = []
		this.errors = []
	}

	/**
	 * 错误结果统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async stat(type, date, reset) {
		//前端js错误统计
		const resJs = await this.statJs(type, date, reset)
		//原生应用崩溃错误统计
		const resCrash = await this.statCrash(type, date, reset)

		return {
			code: 0,
			msg: 'success',
			data: {
				resJs,
				resCrash
			}
		}
	}

	/**
	 * 前端js错误结果统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async statJs(type, date, reset) {
		const allowedType = ['day']
		if (!allowedType.includes(type)) {
			return {
				code: 1002,
				msg: 'This type is not allowed'
			}
		}
		this.fillType = type
		const dateTime = new DateTime()
		const dateDimension = dateTime.getTimeDimensionByType(type, -1, date)
		this.startTime = dateDimension.startTime
		this.endTime = dateDimension.endTime

		if (this.debug) {
			console.log('dimension time', this.startTime + '--' + this.endTime)
		}

		// 查看当前时间段日志是否已存在,防止重复生成
		if (!reset) {
			const checkRes = await this.getCollection(this.tableName).where({
				type: 'js',
				start_time: this.startTime,
				end_time: this.endTime
			}).get()
			if (checkRes.data.length > 0) {
				console.log('error log have existed')
				return {
					code: 1003,
					msg: 'This log have existed'
				}
			}
		} else {
			const delRes = await this.delete(this.tableName, {
				type: 'js',
				start_time: this.startTime,
				end_time: this.endTime
			})
			console.log('delete old data result:', JSON.stringify(delRes))
		}

		// 数据获取
		this.errorLog = new ErrorLog()
		const statRes = await this.aggregate(this.errorLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				error_hash: 1,
				create_time: 1
			},
			match: {
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: {
				_id: {
					appid: '$appid',
					version: '$version',
					platform: '$platform',
					channel: '$channel',
					error_hash: '$error_hash'
				},
				error_count: {
					$sum: 1
				}
			},
			sort: {
				error_count: 1
			},
			getAll: true
		})

		let res = {
			code: 0,
			msg: 'success'
		}
		if (this.debug) {
			console.log('statRes', JSON.stringify(statRes))
		}
		if (statRes.data.length > 0) {
			this.fillData = []
			for (const i in statRes.data) {
				await this.fillJs(statRes.data[i])
			}

			if (this.fillData.length > 0) {
				res = await this.batchInsert(this.tableName, this.fillData)
			}
		}
		return res
	}

	/**
	 * 前端js错误统计结果数据填充
	 * @param {Object} data 数据集合
	 */
	async fillJs(data) {
		// 平台信息
		let platformInfo = null
		if (this.platforms && this.platforms[data._id.platform]) {
			//暂存下数据，减少读库
			platformInfo = this.platforms[data._id.platform]
		} else {
			const platform = new Platform()
			platformInfo = await platform.getPlatformAndCreate(data._id.platform, null)
			if (!platformInfo || platformInfo.length === 0) {
				platformInfo._id = ''
			}
			this.platforms[data._id.platform] = platformInfo
			if (this.debug) {
				console.log('platformInfo', JSON.stringify(platformInfo))
			}
		}

		// 渠道信息
		let channelInfo = null
		const channelKey = data._id.appid + '_' + platformInfo._id + '_' + data._id.channel
		if (this.channels && this.channels[channelKey]) {
			channelInfo = this.channels[channelKey]
		} else {
			const channel = new Channel()
			channelInfo = await channel.getChannelAndCreate(data._id.appid, platformInfo._id, data._id.channel)
			if (!channelInfo || channelInfo.length === 0) {
				channelInfo._id = ''
			}
			this.channels[channelKey] = channelInfo
			if (this.debug) {
				console.log('channelInfo', JSON.stringify(channelInfo))
			}
		}

		// 版本信息
		let versionInfo = null
		const versionKey = data._id.appid + '_' + data._id.platform + '_' + data._id.version
		if (this.versions && this.versions[versionKey]) {
			versionInfo = this.versions[versionKey]
		} else {
			const version = new Version()
			versionInfo = await version.getVersionAndCreate(data._id.appid, data._id.platform, data._id.version)
			if (!versionInfo || versionInfo.length === 0) {
				versionInfo._id = ''
			}
			this.versions[versionKey] = versionInfo
			if (this.debug) {
				console.log('versionInfo', JSON.stringify(versionInfo))
			}
		}

		// 错误信息
		let errorInfo = null
		if (this.errors && this.errors[data._id.error_hash]) {
			errorInfo = this.errors[data._id.error_hash]
		} else {
			const cacheKey = 'uni-stat-errors-' + data._id.error_hash
			errorInfo = await this.getCache(cacheKey)
			if (!errorInfo) {
				errorInfo = await this.getCollection(this.errorLog.tableName).where({
					error_hash: data._id.error_hash
				}).limit(1).get()
				if (!errorInfo || errorInfo.data.length === 0) {
					errorInfo.error_msg = ''
				} else {
					errorInfo = errorInfo.data[0]
					await this.setCache(cacheKey, errorInfo)
				}
			}
			this.errors[data._id.error_hash] = errorInfo
		}

		// 最近一次报错时间
		const matchCondition = data._id
		Object.assign(matchCondition, {
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		})
		const lastErrorLog = await this.getCollection(this.errorLog.tableName).where(matchCondition).orderBy(
			'create_time', 'desc').limit(1).get()
		let lastErrorTime = ''
		if (lastErrorLog && lastErrorLog.data.length > 0) {
			lastErrorTime = lastErrorLog.data[0].create_time
		}

		//数据填充
		const datetime = new DateTime()
		const insertParams = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			type: 'js',
			hash: data._id.error_hash,
			msg: errorInfo.error_msg,
			count: data.error_count,
			last_time: lastErrorTime,
			dimension: this.fillType,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}

		this.fillData.push(insertParams)

		return insertParams
	}


	/**
	 * 原生应用错误结果统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async statCrash(type, date, reset) {
		const allowedType = ['day']
		if (!allowedType.includes(type)) {
			return {
				code: 1002,
				msg: 'This type is not allowed'
			}
		}
		this.fillType = type
		const dateTime = new DateTime()
		const dateDimension = dateTime.getTimeDimensionByType(type, -1, date)
		this.startTime = dateDimension.startTime
		this.endTime = dateDimension.endTime

		if (this.debug) {
			console.log('dimension time', this.startTime + '--' + this.endTime)
		}

		// 查看当前时间段日志是否已存在,防止重复生成
		if (!reset) {
			const checkRes = await this.getCollection(this.tableName).where({
				type: 'crash',
				start_time: this.startTime,
				end_time: this.endTime
			}).get()
			if (checkRes.data.length > 0) {
				console.log('error log have existed')
				return {
					code: 1003,
					msg: 'This log have existed'
				}
			}
		} else {
			const delRes = await this.delete(this.tableName, {
				type: 'crash',
				start_time: this.startTime,
				end_time: this.endTime
			})
			console.log('delete old data result:', JSON.stringify(delRes))
		}

		// 数据获取
		this.crashLogs = new AppCrashLogs()
		const statRes = await this.aggregate(this.crashLogs.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				create_time: 1
			},
			match: {
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: {
				_id: {
					appid: '$appid',
					version: '$version',
					platform: '$platform',
					channel: '$channel'
				},
				error_count: {
					$sum: 1
				}
			},
			sort: {
				error_count: 1
			},
			getAll: true
		})

		let res = {
			code: 0,
			msg: 'success'
		}
		if (this.debug) {
			console.log('statRes', JSON.stringify(statRes))
		}
		if (statRes.data.length > 0) {
			this.fillData = []
			for (const i in statRes.data) {
				await this.fillCrash(statRes.data[i])
			}

			if (this.fillData.length > 0) {
				res = await this.batchInsert(this.tableName, this.fillData)
			}
		}
		return res
	}

	async fillCrash(data) {
		// 平台信息
		let platformInfo = null
		if (this.platforms && this.platforms[data._id.platform]) {
			//暂存下数据，减少读库
			platformInfo = this.platforms[data._id.platform]
		} else {
			const platform = new Platform()
			platformInfo = await platform.getPlatformAndCreate(data._id.platform, null)
			if (!platformInfo || platformInfo.length === 0) {
				platformInfo._id = ''
			}
			this.platforms[data._id.platform] = platformInfo
			if (this.debug) {
				console.log('platformInfo', JSON.stringify(platformInfo))
			}
		}

		// 渠道信息
		let channelInfo = null
		data._id.channel = data._id.channel ? data._id.channel : '1001'
		const channelKey = data._id.appid + '_' + platformInfo._id + '_' + data._id.channel
		if (this.channels && this.channels[channelKey]) {
			channelInfo = this.channels[channelKey]
		} else {
			const channel = new Channel()
			channelInfo = await channel.getChannelAndCreate(data._id.appid, platformInfo._id, data._id.channel)
			if (!channelInfo || channelInfo.length === 0) {
				channelInfo._id = ''
			}
			this.channels[channelKey] = channelInfo
			if (this.debug) {
				console.log('channelInfo', JSON.stringify(channelInfo))
			}
		}

		// 版本信息
		let versionInfo = null
		const versionKey = data._id.appid + '_' + data._id.platform + '_' + data._id.version
		if (this.versions && this.versions[versionKey]) {
			versionInfo = this.versions[versionKey]
		} else {
			const version = new Version()
			versionInfo = await version.getVersionAndCreate(data._id.appid, data._id.platform, data._id.version)
			if (!versionInfo || versionInfo.length === 0) {
				versionInfo._id = ''
			}
			this.versions[versionKey] = versionInfo
			if (this.debug) {
				console.log('versionInfo', JSON.stringify(versionInfo))
			}
		}

		//app启动次数
		const sessionLog = new SessionLog()
		const sessionTimesRes = await this.getCollection(sessionLog.tableName).where({
			appid: data._id.appid,
			version: data._id.version,
			platform: data._id.platform,
			channel: data._id.channel,
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		}).count()

		let sessionTimes = 0
		if(sessionTimesRes && sessionTimesRes.total > 0) {
			sessionTimes = sessionTimesRes.total
		} else {
			console.log('Not found session logs')
			return false
		}


		//数据填充
		const datetime = new DateTime()
		const insertParams = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			type: 'crash',
			count: data.error_count,
			app_launch_count: sessionTimes,
			dimension: this.fillType,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}

		this.fillData.push(insertParams)

		return insertParams
	}
}
