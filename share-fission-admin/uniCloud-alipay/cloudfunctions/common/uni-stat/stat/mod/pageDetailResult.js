/**
 * @class PageResult 页面详情结果统计模型，既页面内容统计模型
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
module.exports = class PageDetailResult extends BaseMod {
	constructor() {
		super()
		this.tableName = 'page-detail-result'
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
		if(!this.getConfig('pageDetailStat')) {
			return {
				code: 1001,
				msg: 'The page detail module not opened'
			}
		}
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
				console.error('This page detail stat log have exists')
				return {
					code: 1003,
					msg: 'This page detail stat log have existed'
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
		const statRes = await this.aggregate(this.pageLog.tableName, {
			match: {
				create_time: {
					$gte: this.startTime,
					$lte: this.endTime
				},
				page_detail_id: {
					$exists: true
				}
			},
			group: {
				_id: {
					appid: '$appid',
					version: '$version',
					platform: '$platform',
					channel: '$channel',
					page_detail_id: '$page_detail_id'
				},
				page_id: {
					$first: '$page_id'
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


		let res = {
			code: 0,
			msg: 'success'
		}
		if (this.debug) {
			console.log('Page detail statRes', JSON.stringify(statRes.data))
		}
		if (statRes.data.length > 0) {
			this.fillData = []
			//获取填充数据
			for (const pdd of statRes.data) {
				try {
					await this.fill(pdd)
				} catch (e) {
					console.error('Page detail result data filled error', e, pdd)
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
	 * 页面详情(内容)统计数据填充
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

		// 当前页面详情访问设备数
		const statPageDetailDeviceRes = await this.aggregate(this.pageLog.tableName, {
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

		let pageDetailVisitDevices = 0
		if (statPageDetailDeviceRes.data.length > 0) {
			pageDetailVisitDevices = statPageDetailDeviceRes.data[0].total_devices
		}

		//当前页面详情访问人数
		const statPageDetailUserRes = await this.aggregate(this.pageLog.tableName, {
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

		let pageDetailVisitUsers = 0
		if (statPageDetailUserRes.data.length > 0) {
			pageDetailVisitUsers = statPageDetailUserRes.data[0].total_users
		}

		// 访问时长
		const statPageDetailDurationRes = await this.aggregate(this.pageLog.tableName, {
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				previous_page_detail_id: data._id.page_detail_id,
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
		if (statPageDetailDurationRes.data.length > 0) {
			totalDuration = statPageDetailDurationRes.data[0].total_duration
		}

		// 分享次数
		const shareLog = new ShareLog()
		const statShareRes = await this.aggregate(shareLog.tableName, {
			match: {
				appid: data._id.appid,
				version: data._id.version,
				platform: data._id.platform,
				channel: data._id.channel,
				page_detail_id: data._id.page_detail_id,
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

		// 数据填充
		const datetime = new DateTime()
		const insertParams = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			page_id: data.page_id,
			page_detail_id: data._id.page_detail_id,
			visit_times: data.visit_times,
			visit_devices: pageDetailVisitDevices,
			visit_users: pageDetailVisitUsers,
			duration: totalDuration > 0 ? totalDuration : 1,
			share_count: shareCount,
			dimension: this.fillType,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}
		this.fillData.push(insertParams)
		return insertParams
	}
}
