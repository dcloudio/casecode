/**
 * @class EventResult 事件结果统计
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const EventLog = require('./eventLog')
const {
	DateTime
} = require('../lib')
module.exports = class EventResult extends BaseMod {
	constructor() {
		super()
		this.tableName = 'event-result'
		this.platforms = []
		this.channels = []
		this.versions = []
	}

	/**
	 * 事件数据统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async stat(type, date, reset) {
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
				start_time: this.startTime,
				end_time: this.endTime
			}).get()
			if (checkRes.data.length > 0) {
				console.log('event log have existed')
				return {
					code: 1003,
					msg: 'This log have existed'
				}
			}
		} else {
			const delRes = await this.delete(this.tableName, {
				start_time: this.startTime,
				end_time: this.endTime
			})
			console.log('delete old data result:', JSON.stringify(delRes))
		}

		// 数据获取
		this.eventLog = new EventLog()
		const statRes = await this.aggregate(this.eventLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				event_key: 1,
				device_id: 1,
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
					event_key: '$event_key'
				},
				event_count: {
					$sum: 1
				}
			},
			sort: {
				event_count: 1
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
				await this.fill(statRes.data[i])
			}
			if (this.fillData.length > 0) {
				res = await this.batchInsert(this.tableName, this.fillData)
			}
		}
		return res
	}
	
	/**
	 * 事件统计数据填充
	 * @param {Object} data 数据集合
	 */
	async fill(data) {
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

		const matchCondition = data._id
		Object.assign(matchCondition, {
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		})
		if (this.debug) {
			console.log('matchCondition', JSON.stringify(matchCondition))
		}

		// 触发事件设备数统计
		const statEventDeviceRes = await this.aggregate(this.eventLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				event_key: 1,
				device_id: 1,
				create_time: 1
			},
			match: matchCondition,
			group: [{
				_id: {
					device_id: '$device_id'
				}
			}, {
				_id: {},
				total_devices: {
					$sum: 1
				}
			}]
		})

		let eventDeviceCount = 0
		if (statEventDeviceRes.data.length > 0) {
			eventDeviceCount = statEventDeviceRes.data[0].total_devices
		}

		// 触发事件用户数统计
		const statEventUserRes = await this.aggregate(this.eventLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				event_key: 1,
				uid: 1,
				create_time: 1
			},
			match: {
				...matchCondition,
				uid: {
					$ne: ''
				}
			},
			group: [{
				_id: {
					uid: '$uid'
				}
			}, {
				_id: {},
				total_users: {
					$sum: 1
				}
			}]
		})

		let eventUserCount = 0
		if (statEventUserRes.data.length > 0) {
			eventUserCount = statEventUserRes.data[0].total_users
		}

		const datetime = new DateTime()
		const insertParams = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			event_key: data._id.event_key,
			event_count: data.event_count,
			device_count: eventDeviceCount,
			user_count: eventUserCount,
			dimension: this.fillType,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}
		this.fillData.push(insertParams)
		return insertParams
	}
}
