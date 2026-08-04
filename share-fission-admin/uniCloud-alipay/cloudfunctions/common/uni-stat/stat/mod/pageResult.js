/**
 * @class PageResult 页面结果统计模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const SessionLog = require('./sessionLog')
const PageLog = require('./pageLog')
const ShareLog = require('./shareLog')
const {
	DateTime
} = require('../lib')
module.exports = class PageResult extends BaseMod {
	constructor() {
		super()
		this.tableName = 'page-result'
		this.platforms = []
		this.channels = []
		this.versions = []
	}

	/**
	 * 数据统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async stat(type, date, reset) {
		//允许的类型
		const allowedType = ['day']
		if (!allowedType.includes(type)) {
			return {
				code: 1002,
				msg: 'This type is not allowed'
			}
		}
		this.fillType = type
		//获取当前统计的时间范围
		const dateTime = new DateTime()
		const dateDimension = dateTime.getTimeDimensionByType(type, -1, date)
		this.startTime = dateDimension.startTime
		this.endTime = dateDimension.endTime
		if (this.debug) {
			console.log('dimension time', this.startTime + '--' + this.endTime)
		}

		// 查看当前时间段日志是否已存在,防止重复执行
		if (!reset) {
			const checkRes = await this.getCollection(this.tableName).where({
				start_time: this.startTime,
				end_time: this.endTime
			}).get()
			if (checkRes.data.length > 0) {
				console.error('This page stat log have exists')
				return {
					code: 1003,
					msg: 'This page stat log have existed'
				}
			}
		} else {
			const delRes = await this.delete(this.tableName, {
				start_time: this.startTime,
				end_time: this.endTime
			})
			console.log('Delete old data result:', JSON.stringify(delRes))
		}

		// 数据获取
		this.pageLog = new PageLog()
		const countRes = await this.getCollection(this.pageLog.tableName).where({
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		}).count()
		let pageLogData = []
		//临时处理-数据量过大按小时分片组合
		if (countRes.total > 500000) {
			const list = {}
			for (let start = 0; start < 24; start++) {
				const getRes = await this.aggregate(this.pageLog.tableName, {
					project: {
						appid: 1,
						version: 1,
						platform: 1,
						channel: 1,
						page_id: 1,
						create_time: 1
					},
					match: {
						create_time: {
							$gte: this.startTime + start * 3600000,
							$lte: this.startTime + (start + 1) * 3600000 - 1
						}
					},
					group: {
						_id: {
							appid: '$appid',
							version: '$version',
							platform: '$platform',
							channel: '$channel',
							page_id: '$page_id'
						},
						visit_times: {
							$sum: 1
						}
					},
					sort: {
						visit_times: 1
					},
					getAll: true
				})

				if (getRes.data.length) {
					for (let resData of getRes.data) {
						const resKey = Object.values(resData._id).join('_')
						if (!list[resKey]) {
							list[resKey] = resData
						} else {
							list[resKey].visit_times += resData.visit_times
						}
					}
				}
			}
			pageLogData = Object.values(list)
		} else {
			const statRes = await this.aggregate(this.pageLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					page_id: 1,
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
						page_id: '$page_id'
					},
					visit_times: {
						$sum: 1
					}
				},
				sort: {
					visit_times: 1
				},
				getAll: true
			})
			pageLogData = statRes.data
		}


		let res = {
			code: 0,
			msg: 'success'
		}
		if (this.debug) {
			console.log('Page statRes', JSON.stringify(pageLogData))
		}
		if (pageLogData.length > 0) {
			this.fillData = []
			//获取填充数据
			for (const i in pageLogData) {
				try{
					await this.fill(pageLogData[i])
				}catch(e){
					console.error('page result data filled error', e)
				}
			}

			//数据批量入库
			if (this.fillData.length > 0) {
				res = await this.batchInsert(this.tableName, this.fillData)
			}
		}
		return res
	}

	/**
	 * 页面统计数据填充
	 * @param {Object} data 统计数据
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

		// 当前页面访问设备数
		const statPageDeviceRes = await this.aggregate(this.pageLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				device_id: 1,
				page_id: 1,
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

		let pageVisitDevices = 0
		if (statPageDeviceRes.data.length > 0) {
			pageVisitDevices = statPageDeviceRes.data[0].total_devices
		}

		//当前页面访问人数
		const statPageUserRes = await this.aggregate(this.pageLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				uid: 1,
				page_id: 1,
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

		let pageVisitUsers = 0
		if (statPageUserRes.data.length > 0) {
			pageVisitUsers = statPageUserRes.data[0].total_users
		}

		// 退出次数
		const sessionLog = new SessionLog()
		let existTimes = 0
		const existRes = await this.getCollection(sessionLog.tableName).where({
			appid: data._id.appid,
			version: data._id.version,
			platform: data._id.platform,
			channel: data._id.channel,
			exit_page_id: data._id.page_id,
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		}).count()
		if (existRes && existRes.total > 0) {
			existTimes = existRes.total
		}

		// 访问时长
		const statPageDurationRes = await this.aggregate(this.pageLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				previous_page_id: 1,
				previous_page_duration: 1,
				create_time: 1
			},
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				previous_page_id: data._id.page_id,
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: {
				_id: {},
				total_duration: {
					$sum: '$previous_page_duration'
				}
			}
		})

		let totalDuration = 0
		if (statPageDurationRes.data.length > 0) {
			totalDuration = statPageDurationRes.data[0].total_duration
		}

		// 分享次数
		const shareLog = new ShareLog()
		const statShareRes = await this.aggregate(shareLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				page_id: 1,
				create_time: 1
			},
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				page_id: data._id.page_id,
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: {
				_id: {},
				share_count: {
					$sum: 1
				}
			}
		})

		let shareCount = 0
		if (statShareRes.data.length > 0) {
			shareCount = statShareRes.data[0].share_count
		}

		// 作为入口页的总次数和总访问时长
		const statPageEntryCountRes = await this.aggregate(this.pageLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				previous_page_id: 1,
				previous_page_duration: 1,
				previous_page_is_entry: 1,
				create_time: 1
			},
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				previous_page_id: data._id.page_id,
				previous_page_is_entry: 1,
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: {
				_id: {},
				entry_count: {
					$sum: 1
				},
				entry_duration: {
					$sum: '$previous_page_duration'
				}
			}
		})

		let entryCount = 0
		let entryDuration = 0
		if (statPageEntryCountRes.data.length > 0) {
			entryCount = statPageEntryCountRes.data[0].entry_count
			entryDuration = statPageEntryCountRes.data[0].entry_duration
		}

		// 作为入口页的总设备数
		const statPageEntryDevicesRes = await this.aggregate(this.pageLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				device_id: 1,
				previous_page_id: 1,
				previous_page_is_entry: 1,
				create_time: 1
			},
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				previous_page_id: data._id.page_id,
				previous_page_is_entry: 1,
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: [{
				_id: {
					device_id: '$device_id'
				}
			}, {
				_id: {},
				entry_devices: {
					$sum: 1
				}
			}]
		})

		let entryDevices = 0
		if (statPageEntryDevicesRes.data.length > 0) {
			entryDevices = statPageEntryDevicesRes.data[0].entry_devices
		}

		// 作为入口页的总人数
		const statPageEntryUsersRes = await this.aggregate(this.pageLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				uid: 1,
				previous_page_id: 1,
				previous_page_is_entry: 1,
				create_time: 1
			},
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				previous_page_id: data._id.page_id,
				previous_page_is_entry: 1,
				uid: {
					$ne: ''
				},
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: [{
				_id: {
					uid: '$uid'
				}
			}, {
				_id: {},
				entry_users: {
					$sum: 1
				}
			}]
		})

		let entryUsers = 0
		if (statPageEntryUsersRes.data.length > 0) {
			entryUsers = statPageEntryUsersRes.data[0].entry_users
		}

		// 跳出率
		let bounceTimes = 0
		const bounceRes = await this.getCollection(sessionLog.tableName).where({
			appid: data._id.appid,
			version: data._id.version,
			platform: data._id.platform,
			channel: data._id.channel,
			entry_page_id: data._id.page_id,
			page_count: 1,
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		}).count()
		if (bounceRes && bounceRes.total > 0) {
			bounceTimes = bounceRes.total
		}
		let bounceRate = 0
		if (bounceTimes > 0 && data.visit_times > 0) {
			bounceRate = bounceTimes * 100 / data.visit_times
			bounceRate = parseFloat(bounceRate.toFixed(2))
		}

		// 数据填充
		const datetime = new DateTime()
		const insertParams = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			page_id: data._id.page_id,
			visit_times: data.visit_times,
			visit_devices: pageVisitDevices,
			visit_users: pageVisitUsers,
			exit_times: existTimes,
			duration: totalDuration > 0 ? totalDuration : 1,
			share_count: shareCount,
			entry_users: entryUsers,
			entry_devices: entryDevices,
			entry_count: entryCount,
			entry_duration: entryDuration,
			bounce_rate: bounceRate,
			dimension: this.fillType,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}
		this.fillData.push(insertParams)
		return insertParams
	}
}
