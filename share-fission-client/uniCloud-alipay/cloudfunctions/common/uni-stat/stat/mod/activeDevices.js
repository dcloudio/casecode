/**
 * @class ActiveDevices 活跃设备模型 - 每日跑批合并，仅添加本周/本月首次访问的设备。
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const SessionLog = require('./sessionLog')
const {
	DateTime,
	UniCrypto
} = require('../lib')
module.exports = class ActiveDevices extends BaseMod {
	constructor() {
		super()
		this.tableName = 'active-devices'
		this.platforms = []
		this.channels = []
		this.versions = []
	}

	/**
	 * @desc 活跃设备统计 - 为周统计/月统计提供周活/月活数据
	 * @param {date|time} date
	 * @param {bool} reset
	 */
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
					msg: 'Devices data in this time have already existed'
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

		const sessionLog = new SessionLog()
		const statRes = await this.aggregate(sessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				is_first_visit: 1,
				create_time: 1,
				device_id: 1
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
					device_id: '$device_id'
				},
				is_new: {
					$max: '$is_first_visit'
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

			const statOldRes = await this.aggregate(sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					is_first_visit: 1,
					create_time: 1,
					old_device_id: 1
				},
				match: {
					create_time: {
						$gte: dateDimension.startTime,
						$lte: dateDimension.endTime
					},
					old_device_id: {$exists: true}
				},
				group: {
					_id: {
						appid: '$appid',
						version: '$version',
						platform: '$platform',
						channel: '$channel',
						old_device_id: '$old_device_id'
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
			if (this.debug) {
			  console.log('statOldRes', JSON.stringify(statOldRes))
			}
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
						device_ids: [],
						old_device_ids: [],
						info: [],
						old_info: []
					}
					statData[statKey].device_ids.push(data._id.device_id)
					statData[statKey].info[data._id.device_id] = {
						is_new: data.is_new,
						create_time: data.create_time
					}
				} else {
					statData[statKey].device_ids.push(data._id.device_id)
					statData[statKey].info[data._id.device_id] = {
						is_new: data.is_new,
						create_time: data.create_time
					}
				}
			}
			if(statOldRes.data.length) {
				const oldDeviceIds = []
				for(const osti in statOldRes.data) {
					if(!statOldRes.data[osti]._id.old_device_id) {
						continue
					}
					oldDeviceIds.push(statOldRes.data[osti]._id.old_device_id)
				}
				if(oldDeviceIds.length) {
					const statOldDidRes = await this.aggregate(sessionLog.tableName, {
						project: {
							appid: 1,
							version: 1,
							platform: 1,
							channel: 1,
							is_first_visit: 1,
							create_time: 1,
							device_id: 1
						},
						match: {
							create_time: {
								$gte: dateDimension.startTime,
								$lte: dateDimension.endTime
							},
							device_id: {$in: oldDeviceIds}
						},
						group: {
							_id: {
								appid: '$appid',
								version: '$version',
								platform: '$platform',
								channel: '$channel',
								old_device_id: '$device_id'
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

					if(statOldDidRes.data.length){
						for(const osti in statOldDidRes.data) {
							data = statOldDidRes.data[osti]
							statKey = uniCrypto.md5(data._id.appid + data._id.platform + data._id.version + data._id
								.channel)
							if(!data._id.old_device_id) {
								continue
							}

							if (!statData[statKey]) {
								statData[statKey] = {
									appid: data._id.appid,
									platform: data._id.platform,
									version: data._id.version,
									channel: data._id.channel,
									device_ids: [],
									old_device_ids: [],
									old_info: []
								}
								statData[statKey].old_device_ids.push(data._id.old_device_id)
							} else {
								statData[statKey].old_device_ids.push(data._id.old_device_id)
							}
							if(!statData[statKey].old_info[data._id.old_device_id]) {
								statData[statKey].old_info[data._id.old_device_id] = {
									create_time: data.create_time
								}
							}
						}
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

	/**
	 * 获取填充数据
	 * @param {Object} data
	 */
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

		const datetime = new DateTime()
		const dateDimension = datetime.getTimeDimensionByType('week', 0, this.startTime)
		const dateMonthDimension = datetime.getTimeDimensionByType('month', 0, this.startTime)

		if(data.device_ids) {
			// 取出本周已经存储的device_id
			const weekHaveDeviceList = []
			const haveWeekList = await this.selectAll(this.tableName, {
				appid: data.appid,
				version_id: versionInfo._id,
				platform_id: platformInfo._id,
				channel_id: channelInfo._id,
				device_id: {
					$in: data.device_ids
				},
				dimension: 'week',
				create_time: {
					$gte: dateDimension.startTime,
					$lte: dateDimension.endTime
				}
			}, {
				device_id: 1
			})
			if (haveWeekList.data.length > 0) {
				for (const hui in haveWeekList.data) {
					weekHaveDeviceList.push(haveWeekList.data[hui].device_id)
				}
			}
			if (this.debug) {
				console.log('weekHaveDeviceList', JSON.stringify(weekHaveDeviceList))
			}

			// 取出本月已经存储的device_id
			const monthHaveDeviceList = []
			const haveMonthList = await this.selectAll(this.tableName, {
				appid: data.appid,
				version_id: versionInfo._id,
				platform_id: platformInfo._id,
				channel_id: channelInfo._id,
				device_id: {
					$in: data.device_ids
				},
				dimension: 'month',
				create_time: {
					$gte: dateMonthDimension.startTime,
					$lte: dateMonthDimension.endTime
				}
			}, {
				device_id: 1
			})
			if (haveMonthList.data.length > 0) {
				for (const hui in haveMonthList.data) {
					monthHaveDeviceList.push(haveMonthList.data[hui].device_id)
				}
			}
			if (this.debug) {
				console.log('monthHaveDeviceList', JSON.stringify(monthHaveDeviceList))
			}
			//数据填充
			for (const ui in data.device_ids) {
				//周活跃数据填充
				if (!weekHaveDeviceList.includes(data.device_ids[ui])) {
					this.fillData.push({
						appid: data.appid,
						platform_id: platformInfo._id,
						channel_id: channelInfo._id,
						version_id: versionInfo._id,
						is_new: data.info[data.device_ids[ui]].is_new,
						device_id: data.device_ids[ui],
						dimension: 'week',
						create_time: data.info[data.device_ids[ui]].create_time
					})
				}
				//月活跃数据填充
				if (!monthHaveDeviceList.includes(data.device_ids[ui])) {
					this.fillData.push({
						appid: data.appid,
						platform_id: platformInfo._id,
						channel_id: channelInfo._id,
						version_id: versionInfo._id,
						is_new: data.info[data.device_ids[ui]].is_new,
						device_id: data.device_ids[ui],
						dimension: 'month',
						create_time: data.info[data.device_ids[ui]].create_time
					})
				}
			}
		}

		if(data.old_device_ids) {
			// 取出本周已经存储的old_device_id
			const weekHaveOldDeviceList = []
			const haveOldWeekList = await this.selectAll(this.tableName, {
				appid: data.appid,
				version_id: versionInfo._id,
				platform_id: platformInfo._id,
				channel_id: channelInfo._id,
				device_id: {
					$in: data.old_device_ids
				},
				dimension: 'week-old',
				create_time: {
					$gte: dateDimension.startTime,
					$lte: dateDimension.endTime
				}
			}, {
				device_id: 1
			})
			if (haveOldWeekList.data.length > 0) {
				for (const hui in haveOldWeekList.data) {
					weekHaveOldDeviceList.push(haveOldWeekList.data[hui].device_id)
				}
			}
			if (this.debug) {
				console.log('weekHaveOldDeviceList', JSON.stringify(weekHaveOldDeviceList))
			}

			// 取出本月已经存储的old_device_id
			const monthHaveOldDeviceList = []
			const haveOldMonthList = await this.selectAll(this.tableName, {
				appid: data.appid,
				version_id: versionInfo._id,
				platform_id: platformInfo._id,
				channel_id: channelInfo._id,
				device_id: {
					$in: data.old_device_ids
				},
				dimension: 'month-old',
				create_time: {
					$gte: dateMonthDimension.startTime,
					$lte: dateMonthDimension.endTime
				}
			}, {
				device_id: 1
			})
			if (haveOldMonthList.data.length > 0) {
				for (const hui in haveOldMonthList.data) {
					monthHaveOldDeviceList.push(haveOldMonthList.data[hui].device_id)
				}
			}
			if (this.debug) {
				console.log('monthHaveOldDeviceList', JSON.stringify(monthHaveOldDeviceList))
			}
			//数据填充
			for (const ui in data.old_device_ids) {
				//周活跃数据填充
				if (!weekHaveOldDeviceList.includes(data.old_device_ids[ui])) {
					this.fillData.push({
						appid: data.appid,
						platform_id: platformInfo._id,
						channel_id: channelInfo._id,
						version_id: versionInfo._id,
						is_new: 0,
						device_id: data.old_device_ids[ui],
						dimension: 'week-old',
						create_time: data.old_info[data.old_device_ids[ui]].create_time
					})
				}
				//月活跃数据填充
				if (!monthHaveOldDeviceList.includes(data.old_device_ids[ui])) {
					this.fillData.push({
						appid: data.appid,
						platform_id: platformInfo._id,
						channel_id: channelInfo._id,
						version_id: versionInfo._id,
						is_new: 0,
						device_id: data.old_device_ids[ui],
						dimension: 'month-old',
						create_time: data.old_info[data.old_device_ids[ui]].create_time
					})
				}
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
		console.log('Clean device\'s weekly logs - week:', weeks)

		const dateTime = new DateTime()

		const res = await this.delete(this.tableName, {
			dimension: 'week',
			create_time: {
				$lt: dateTime.getTimeBySetWeek(0 - weeks)
			}
		})

		if (!res.code) {
			console.log('Clean device\'s weekly logs - res:', res)
		}

		// 清除月数据，月留存统计最高需要10个月数据，多余的为无用数据
		const monthes = 10
		console.log('Clean device\'s monthly logs - month:', monthes)
		const monthRes = await this.delete(this.tableName, {
			dimension: 'month',
			create_time: {
				$lt: dateTime.getTimeBySetMonth(0 - monthes)
			}
		})
		if (!monthRes.code) {
			console.log('Clean device\'s monthly logs - res:', res)
		}
		return monthRes
	}
}
