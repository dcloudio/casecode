/**
 * 设备/用户忠诚度（粘性）统计模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const SessionLog = require('./sessionLog')
const UserSessionLog = require('./userSessionLog')
const {
	DateTime
} = require('../lib')
module.exports = class Loyalty extends BaseMod {
	constructor() {
		super()
		this.tableName = 'loyalty-result'
		this.platforms = []
		this.channels = []
		this.versions = []
	}

	/**
	 * 设备/用户忠诚度（粘性）统计
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
			console.log('this time', dateTime.getTime())
			console.log('dimension time', this.startTime + '--' + this.endTime)
		}

		// 查看当前时间段日志是否已存在,防止重复生成
		if (!reset) {
			const checkRes = await this.getCollection(this.tableName).where({
				start_time: this.startTime,
				end_time: this.endTime
			}).get()
			if (checkRes.data.length > 0) {
				console.log('loyalty log have existed')
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
		this.sessionLog = new SessionLog()
		const statRes = await this.aggregate(this.sessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				page_count: 1,
				duration: 1,
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
				page_count_sum: {
					$sum: '$page_count'
				},
				duration_sum: {
					$sum: '$duration'
				}
			},
			sort: {
				page_count_sum: 1,
				duration_sum: 1
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
	 * 设备/用户忠诚度（粘性）数据填充
	 * @param {Object} data 数据集合
	 */
	async fill(data) {
		// 平台信息
		let platformInfo = null
		if (this.platforms && this.platforms[data._id.platform]) {
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

		// 访问深度-用户数统计和访问次数
		const pageMark = [1, 2, 3, 4, [5, 10], [10]]

		const matchCondition = Object.assign(data._id, {
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		})

		const visitDepthData = {
			visit_devices: {},
			visit_users: {},
			visit_times: {}
		}
		
		const userSessionLog = new UserSessionLog()
		//根据各访问页面数区间统计
		for (const pi in pageMark) {
			let pageMarkCondition = {
				page_count: pageMark[pi]
			}

			if (Array.isArray(pageMark[pi])) {
				if (pageMark[pi].length === 2) {
					pageMarkCondition = {
						page_count: {
							$gte: pageMark[pi][0],
							$lte: pageMark[pi][1]
						}
					}
				} else {
					pageMarkCondition = {
						page_count: {
							$gt: pageMark[pi][0]
						}
					}
				}
			}

			// 访问次数(会话次数)统计
			const searchCondition = {
				...matchCondition,
				...pageMarkCondition
			}
			const vistRes = await this.aggregate(this.sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					page_count: 1,
					create_time: 1
				},
				match: searchCondition,
				group: {
					_id: {},
					total_visits: {
						$sum: 1
					}
				}
			})

			if (this.debug) {
				console.log('vistResCondtion', JSON.stringify(searchCondition))
				console.log('vistRes', JSON.stringify(vistRes))
			}
			let vistCount = 0
			if (vistRes.data.length > 0) {
				vistCount = vistRes.data[0].total_visits
			}
			
			// 设备数统计
			const deviceRes = await this.aggregate(this.sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					page_count: 1,
					create_time: 1,
					device_id: 1
				},
				match: searchCondition,
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
			
			if (this.debug) {
				console.log('searchCondition', JSON.stringify(searchCondition))
				console.log('deviceRes', JSON.stringify(deviceRes))
			}
			
			let deviceCount = 0
			if (deviceRes.data.length > 0) {
				deviceCount = deviceRes.data[0].total_devices
			}

			// 用户数统计
			const userRes = await this.aggregate(userSessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					page_count: 1,
					create_time: 1,
					uid: 1
				},
				match: searchCondition,
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

			if (this.debug) {
				console.log('userResCondtion', JSON.stringify(searchCondition))
				console.log('userRes', JSON.stringify(userRes))
			}

			let userCount = 0
			if (userRes.data.length > 0) {
				userCount = userRes.data[0].total_users
			}

			const pageKey = 'p_' + (Array.isArray(pageMark[pi]) ? pageMark[pi][0] : pageMark[pi])
			visitDepthData.visit_devices[pageKey] = deviceCount
			visitDepthData.visit_users[pageKey] = userCount
			visitDepthData.visit_times[pageKey] = vistCount
		}

		// 访问时长-用户数统计和访问次数
		const durationMark = [
			[0, 2],
			[3, 5],
			[6, 10],
			[11, 20],
			[21, 30],
			[31, 50],
			[51, 100],
			[100]
		]
		const durationData = {
			visit_devices: {},
			visit_users: {},
			visit_times: {}
		}
		//根据各访问时长区间统计
		for (const di in durationMark) {
			let durationMarkCondition = {
				duration: durationMark[di]
			}

			if (Array.isArray(durationMark[di])) {
				if (durationMark[di].length === 2) {
					durationMarkCondition = {
						duration: {
							$gte: durationMark[di][0],
							$lte: durationMark[di][1]
						}
					}
				} else {
					durationMarkCondition = {
						duration: {
							$gt: durationMark[di][0]
						}
					}
				}
			}

			// 访问次数(会话次数)统计
			const searchCondition = {
				...matchCondition,
				...durationMarkCondition
			}
			if (this.debug) {
				console.log('searchCondition', JSON.stringify(searchCondition))
			}
			const vistRes = await this.aggregate(this.sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					duration: 1,
					create_time: 1
				},
				match: searchCondition,
				group: {
					_id: {},
					total_visits: {
						$sum: 1
					}
				}
			})

			if (this.debug) {
				console.log('vistRes', JSON.stringify(vistRes))
			}
			let vistCount = 0
			if (vistRes.data.length > 0) {
				vistCount = vistRes.data[0].total_visits
			}
			
			// 设备数统计
			const deviceRes = await this.aggregate(this.sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					device_id: 1,
					duration: 1,
					create_time: 1
				},
				match: searchCondition,
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
			
			if (this.debug) {
				console.log('userRes', JSON.stringify(deviceRes))
			}
			
			let deviceCount = 0
			if (deviceRes.data.length > 0) {
				deviceCount = deviceRes.data[0].total_devices
			}
			
			// 用户数统计
			const userRes = await this.aggregate(userSessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					uid: 1,
					duration: 1,
					create_time: 1
				},
				match: searchCondition,
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

			if (this.debug) {
				console.log('userRes', JSON.stringify(userRes))
			}

			let userCount = 0
			if (userRes.data.length > 0) {
				userCount = userRes.data[0].total_users
			}

			const pageKey = 's_' + (Array.isArray(durationMark[di]) ? durationMark[di][0] : durationMark[di])
			durationData.visit_devices[pageKey] = deviceCount
			durationData.visit_users[pageKey] = userCount
			durationData.visit_times[pageKey] = vistCount
		}

		// 数据填充
		const datetime = new DateTime()
		const insertParams = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			visit_depth_data: visitDepthData,
			duration_data: durationData,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}

		this.fillData.push(insertParams)
		return insertParams
	}
}
