/**
 * @class ActiveUsers 活跃用户模型 - 每日跑批合并，仅添加本周/本月首次访问的用户。
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const UserSessionLog = require('./userSessionLog')
const {
	DateTime,
	UniCrypto
} = require('../lib')
module.exports = class ActiveUsers extends BaseMod {
	constructor() {
		super()
		this.tableName = 'active-users'
		this.platforms = []
		this.channels = []
		this.versions = []
	}

	async stat(date, reset) {
		const dateTime = new DateTime()
		const dateDimension = dateTime.getTimeDimensionByType('day', -1, date)
		this.startTime = dateDimension.startTime
		// 查看当前时间段数据是否已存在,防止重复生成
		if (!reset) {
			const checkRes = await this.getCollection(this.tableName).where({
				create_time: {
					$gte: dateDimension.startTime,
					$lte: dateDimension.endTime
				}
			}).get()
			if (checkRes.data.length > 0) {
				console.log('data have exists')
				return {
					code: 1003,
					msg: 'Users data in this time have already existed'
				}
			}
		} else {
			const delRes = await this.delete(this.tableName, {
				create_time: {
					$gte: dateDimension.startTime,
					$lte: dateDimension.endTime
				}
			})
			console.log('Delete old data result:', JSON.stringify(delRes))
		}

		const userSessionLog = new UserSessionLog()
		const statRes = await this.aggregate(userSessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				create_time: 1,
				uid: 1
			},
			match: {
				create_time: {
					$gte: dateDimension.startTime,
					$lte: dateDimension.endTime
				}
			},
			group: {
				_id: {
					appid: '$appid',
					version: '$version',
					platform: '$platform',
					channel: '$channel',
					uid: '$uid'
				},
				create_time: {
					$min: '$create_time'
				}
			},
			sort: {
				create_time: 1
			},
			getAll: true
		})

		let res = {
			code: 0,
			msg: 'success'
		}
		// if (this.debug) {
		//   console.log('statRes', JSON.stringify(statRes))
		// }
		if (statRes.data.length > 0) {
			const uniCrypto = new UniCrypto()
			// 同应用、平台、渠道、版本的数据合并
			const statData = [];
			let statKey;
			let data

			for (const sti in statRes.data) {
				data = statRes.data[sti]
				statKey = uniCrypto.md5(data._id.appid + data._id.platform + data._id.version + data._id
					.channel)
				if (!statData[statKey]) {
					statData[statKey] = {
						appid: data._id.appid,
						platform: data._id.platform,
						version: data._id.version,
						channel: data._id.channel,
						uids: [],
						info: []
					}
					statData[statKey].uids.push(data._id.uid)
					statData[statKey].info[data._id.uid] = {
						create_time: data.create_time
					}
				} else {
					statData[statKey].uids.push(data._id.uid)
					statData[statKey].info[data._id.uid] = {
						create_time: data.create_time
					}
				}
			}

			this.fillData = []
			for (const sk in statData) {
				await this.getFillData(statData[sk])
			}

			if (this.fillData.length > 0) {
				res = await this.batchInsert(this.tableName, this.fillData)
			}
		}
		return res
	}

	async getFillData(data) {
		// 平台信息
		let platformInfo = null
		if (this.platforms && this.platforms[data.platform]) {
			platformInfo = this.platforms[data.platform]
		} else {
			const platform = new Platform()
			platformInfo = await platform.getPlatformAndCreate(data.platform, null)
			if (!platformInfo || platformInfo.length === 0) {
				platformInfo._id = ''
			}
			this.platforms[data.platform] = platformInfo
			if (this.debug) {
				console.log('platformInfo', JSON.stringify(platformInfo))
			}
		}

		// 渠道信息
		let channelInfo = null
		const channelKey = data.appid + '_' + platformInfo._id + '_' + data.channel
		if (this.channels && this.channels[channelKey]) {
			channelInfo = this.channels[channelKey]
		} else {
			const channel = new Channel()
			channelInfo = await channel.getChannelAndCreate(data.appid, platformInfo._id, data.channel)
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
		const versionKey = data.appid + '_' + data.platform + '_' + data.version
		if (this.versions && this.versions[versionKey]) {
			versionInfo = this.versions[versionKey]
		} else {
			const version = new Version()
			versionInfo = await version.getVersionAndCreate(data.appid, data.platform, data.version)
			if (!versionInfo || versionInfo.length === 0) {
				versionInfo._id = ''
			}
			this.versions[versionKey] = versionInfo
			if (this.debug) {
				console.log('versionInfo', JSON.stringify(versionInfo))
			}
		}

		// 是否在本周内已存在
		const datetime = new DateTime()
		const dateDimension = datetime.getTimeDimensionByType('week', 0, this.startTime)

		// 取出本周已经存储的uid
		const weekHaveUserList = []
		const haveWeekList = await this.selectAll(this.tableName, {
			appid: data.appid,
			version_id: versionInfo._id,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			uid: {
				$in: data.uids
			},
			dimension: 'week',
			create_time: {
				$gte: dateDimension.startTime,
				$lte: dateDimension.endTime
			}
		}, {
			uid: 1
		})

		if (this.debug) {
			console.log('haveWeekList', JSON.stringify(haveWeekList))
		}

		if (haveWeekList.data.length > 0) {
			for (const hui in haveWeekList.data) {
				weekHaveUserList.push(haveWeekList.data[hui].uid)
			}
		}

		// 取出本月已经存储的uid
		const dateMonthDimension = datetime.getTimeDimensionByType('month', 0, this.startTime)
		const monthHaveUserList = []
		const haveMonthList = await this.selectAll(this.tableName, {
			appid: data.appid,
			version_id: versionInfo._id,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			uid: {
				$in: data.uids
			},
			dimension: 'month',
			create_time: {
				$gte: dateMonthDimension.startTime,
				$lte: dateMonthDimension.endTime
			}
		}, {
			uid: 1
		})

		if (this.debug) {
			console.log('haveMonthList', JSON.stringify(haveMonthList))
		}

		if (haveMonthList.data.length > 0) {
			for (const hui in haveMonthList.data) {
				monthHaveUserList.push(haveMonthList.data[hui].uid)
			}
		}

		for (const ui in data.uids) {
			if (!weekHaveUserList.includes(data.uids[ui])) {
				this.fillData.push({
					appid: data.appid,
					platform_id: platformInfo._id,
					channel_id: channelInfo._id,
					version_id: versionInfo._id,
					uid: data.uids[ui],
					dimension: 'week',
					create_time: data.info[data.uids[ui]].create_time
				})
			}

			if (!monthHaveUserList.includes(data.uids[ui])) {
				this.fillData.push({
					appid: data.appid,
					platform_id: platformInfo._id,
					channel_id: channelInfo._id,
					version_id: versionInfo._id,
					uid: data.uids[ui],
					dimension: 'month',
					create_time: data.info[data.uids[ui]].create_time
				})
			}
		}

		return true
	}

	/**
	 * 日志清理，此处日志为临时数据并不需要自定义清理，默认为固定值即可
	 */
	async clean() {
		// 清除周数据，周留存统计最高需要10周数据，多余的为无用数据
		const weeks = 10
		console.log('Clean user\'s weekly logs - week:', weeks)

		const dateTime = new DateTime()

		const res = await this.delete(this.tableName, {
			dimension: 'week',
			create_time: {
				$lt: dateTime.getTimeBySetWeek(0 - weeks)
			}
		})

		if (!res.code) {
			console.log('Clean user\'s weekly logs - res:', res)
		}

		// 清除月数据，月留存统计最高需要10个月数据，多余的为无用数据
		const monthes = 10
		console.log('Clean user\'s monthly logs - month:', monthes)
		const monthRes = await this.delete(this.tableName, {
			dimension: 'month',
			create_time: {
				$lt: dateTime.getTimeBySetMonth(0 - monthes)
			}
		})
		if (!monthRes.code) {
			console.log('Clean user\'s monthly logs - res:', res)
		}
		return monthRes
	}
}
