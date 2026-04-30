/**
 * @class StatResult 基础数据结果统计模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const Version = require('./version')
const SessionLog = require('./sessionLog')
const UserSessionLog = require('./userSessionLog')
const ErrorLog = require('./errorLog')
const ActiveDevices = require('./activeDevices')
const ActiveUsers = require('./activeUsers')
const UniIDUsers = require('./uniIDUsers')
const {
	DateTime
} = require('../lib')
module.exports = class StatResult extends BaseMod {
	constructor() {
		super()
		this.tableName = 'result'
		this.platforms = []
		this.channels = []
		this.versions = []
	}

	/**
	 * 基础数据统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async stat(type, date, reset) {
		const allowedType = ['hour', 'day', 'week', 'month']
		if (!allowedType.includes(type)) {
			return {
				code: 1002,
				msg: 'This type is not allowed'
			}
		}

		if (this.debug) {
			console.log('result --type:' + type + ', date:' + date + ', reset:' + reset)
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
				dimension: this.fillType,
				start_time: this.startTime,
				end_time: this.endTime
			}).get()
			if (checkRes.data.length > 0) {
				console.log('log have existed')
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

		// 周月数据单独统计
		if (['week', 'month'].includes(this.fillType)) {
			return await this.statWeekOrMonth()
		}

		// 数据获取
		this.sessionLog = new SessionLog()
		const statRes = await this.aggregate(this.sessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				is_first_visit: 1,
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
				new_device_count: {
					$sum: '$is_first_visit'
				},
				page_view_count: {
					$sum: '$page_count'
				},
				total_duration: {
					$sum: '$duration'
				},
				session_times: {
					$sum: 1
				}
			},
			sort: {
				new_device_count: 1,
				page_view_count: 1,
				session_times: 1
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

		this.fillData = []
		this.composes = []
		if (statRes.data.length > 0) {
			for (const i in statRes.data) {
				await this.fill(statRes.data[i])
			}
		}
		//补充数据
		await this.replenishStat()
		if (this.fillData.length > 0) {
			res = await this.batchInsert(this.tableName, this.fillData)
		}
		return res
	}

	/**
	 * 按周/月统计
	 */
	async statWeekOrMonth() {
		const statRes = await this.aggregate(this.tableName, {
			project: {
				appid: 1,
				version_id: 1,
				platform_id: 1,
				channel_id: 1,
				new_device_count: 1,
				new_user_count: 1,
				page_visit_count: 1,
				user_visit_times: 1,
				app_launch_count: 1,
				error_count: 1,
				bounce_times: 1,
				duration: 1,
				user_duration: 1,
				dimension: 1,
				start_time: 1
			},
			match: {
				dimension: 'day',
				start_time: {
					$gte: this.startTime,
					$lte: this.endTime
				}
			},
			group: {
				_id: {
					appid: '$appid',
					version_id: '$version_id',
					platform_id: '$platform_id',
					channel_id: '$channel_id'
				},
				new_device_count: {
					$sum: '$new_device_count'
				},
				new_user_count: {
					$sum: '$new_user_count'
				},
				error_count: {
					$sum: '$error_count'
				},
				page_count: {
					$sum: '$page_visit_count'
				},
				total_duration: {
					$sum: '$duration'
				},
				total_user_duration: {
					$sum: '$user_duration'
				},
				total_user_session_times: {
					$sum: '$user_session_times'
				},
				session_times: {
					$sum: '$app_launch_count'
				},
				total_bounce_times: {
					$sum: '$bounce_times'
				}
			},
			sort: {
				new_device_count: 1,
				error_count: 1,
				page_count: 1
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

		this.activeDevices = new ActiveDevices()
		this.activeUsers = new ActiveUsers()
		this.fillData = []
		this.composes = []
		if (statRes.data.length > 0) {
			for (const i in statRes.data) {
				await this.getWeekOrMonthData(statRes.data[i])
			}
		}
		//补充数据
		await this.replenishStat()
		if (this.fillData.length > 0) {
			res = await this.batchInsert(this.tableName, this.fillData)
		}
		return res
	}

	/**
	 * 获取周/月维度的填充数据
	 * @param {Object} data 统计数据
	 */
	async getWeekOrMonthData(data) {

		const matchCondition = {
			...data._id,
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		}

		// 查询活跃设备数
		const statVisitDeviceRes = await this.getCollection(this.activeDevices.tableName).where({
			...matchCondition,
			dimension: this.fillType
		}).count()

		let activeDeviceCount = 0
		if (statVisitDeviceRes && statVisitDeviceRes.total > 0) {
			activeDeviceCount = statVisitDeviceRes.total
		}

		// 设备次均停留时长
		let avgSessionTime = 0
		if (data.total_duration > 0 && data.session_times > 0) {
			avgSessionTime = Math.round(data.total_duration / data.session_times)
		}

		// 设均停留时长
		let avgDeviceTime = 0
		if (data.total_duration > 0 && activeDeviceCount > 0) {
			avgDeviceTime = Math.round(data.total_duration / activeDeviceCount)
		}

		// 跳出率
		let bounceRate = 0
		if (data.total_bounce_times > 0 && data.session_times > 0) {
			bounceRate = data.total_bounce_times * 100 / data.session_times
			bounceRate = parseFloat(bounceRate.toFixed(2))
		}

		// 累计设备数
		let totalDevices = data.new_device_count
		const totalDeviceRes = await this.getCollection(this.tableName).where({
			...matchCondition,
			dimension: this.fillType,
			start_time: {
				$lt: this.startTime
			}
		}).orderBy('start_time', 'desc').limit(1).get()
		if (totalDeviceRes && totalDeviceRes.data.length > 0) {
			totalDevices += totalDeviceRes.data[0].total_devices
		}

		//活跃用户数
		const statVisitUserRes = await this.getCollection(this.activeUsers.tableName).where({
			...matchCondition,
			dimension: this.fillType
		}).count()
		let activeUserCount = 0
		if (statVisitUserRes && statVisitUserRes.total > 0) {
			activeUserCount = statVisitUserRes.total
		}

		// 平台信息
		let platformInfo = null
		if (this.platforms && this.platforms[data._id.platform_id]) {
			platformInfo = this.platforms[data._id.platform_id]
		} else {
			const platform = new Platform()
			platformInfo = await this.getById(platform.tableName, data._id.platform_id)
			if (!platformInfo || platformInfo.length === 0) {
				platformInfo.code = ''
			}
			this.platforms[data._id.platform_id] = platformInfo
		}

		// 渠道信息
		let channelInfo = null
		if (this.channels && this.channels[data._id.channel_id]) {
			channelInfo = this.channels[data._id.channel_id]
		} else {
			const channel = new Channel()
			channelInfo = await this.getById(channel.tableName, data._id.channel_id)
			if (!channelInfo || channelInfo.length === 0) {
				channelInfo.channel_code = ''
			}
			this.channels[data._id.channel_id] = channelInfo
		}

		// 版本信息
		let versionInfo = null
		if (this.versions && this.versions[data._id.version_id]) {
			versionInfo = this.versions[data._id.version_id]
		} else {
			const version = new Version()
			versionInfo = await this.getById(version.tableName, data._id.version_id, false)
			if (!versionInfo || versionInfo.length === 0) {
				versionInfo.version = ''
			}
			this.versions[data._id.version_id] = versionInfo
		}

		//总用户数
		const uniIDUsers = new UniIDUsers()
		let totalUserCount = await uniIDUsers.getUserCount(data._id.appid, platformInfo.code, channelInfo.channel_code, versionInfo.version, {
			$lte: this.endTime
		})

		//人均停留时长
		let avgUserTime = 0
		if (data.total_user_duration > 0 && activeUserCount > 0) {
			avgUserTime = Math.round(data.total_user_duration / activeUserCount)
		}

		//用户次均访问时长
		let avgUserSessionTime = 0
		if (data.total_user_duration > 0 && data.total_user_session_times > 0) {
			avgUserSessionTime = Math.round(data.total_user_duration / data.total_user_session_times)
		}

		//安卓平台活跃设备数需要减去sdk更新后device_id发生变更的设备数
		if(platformInfo.code === 'android') {
			try{
				const statVisitOldDeviceRes = await this.getCollection(this.activeDevices.tableName).where({
					...data._id,
					create_time: {
						$gte: this.startTime,
						$lte: this.endTime
					},
					dimension: this.fillType + '-old'
				}).count()
				if (statVisitOldDeviceRes && statVisitOldDeviceRes.total > 0) {
					// 活跃设备留存数
					activeDeviceCount -= statVisitOldDeviceRes.total
					//平均设备停留时长
					avgDeviceTime = Math.round(data.total_duration / activeDeviceCount)
				}
			}  catch (e) {
				console.log('server error: ' + e)
			}
		}

		const insertParam = {
			appid: data._id.appid,
			platform_id: data._id.platform_id,
			channel_id: data._id.channel_id,
			version_id: data._id.version_id,
			//总设备数
			total_devices: totalDevices,
			//本时间段新增设备数
			new_device_count: data.new_device_count,
			//登录用户会话次数
			user_session_times: data.total_user_session_times,
			//活跃设备数
			active_device_count: activeDeviceCount,
			//总用户数
			total_users: totalUserCount,
			//新增用户数
			new_user_count: data.new_user_count,
			//活跃用户数
			active_user_count: activeUserCount,
			//应用启动次数 = 设备会话次数
			app_launch_count: data.session_times,
			//页面访问次数
			page_visit_count: data.page_view_count,
			//错误次数
			error_count: data.error_count,
			//会话总访问时长
			duration: data.total_duration,
			//用户会话总访问时长
			user_duration: data.total_user_duration,
			avg_device_session_time: avgSessionTime,
			avg_user_session_time: avgUserSessionTime,
			avg_device_time: avgDeviceTime,
			avg_user_time: avgUserTime,
			bounce_times: data.total_bounce_times,
			bounce_rate: bounceRate,
			retention: {},
			dimension: this.fillType,
			stat_date: new DateTime().getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}

		this.fillData.push(insertParam)
		this.composes.push(data._id.appid + '_' + data._id.platform_id + '_' + data._id.channel_id + '_' + data
			._id.version_id)

		return insertParam
	}

	/**
	 * 基础填充数据-目前只有小时和天维度的数据
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

		// 访问设备数统计
		const matchCondition = data._id
		Object.assign(matchCondition, {
			create_time: {
				$gte: this.startTime,
				$lte: this.endTime
			}
		})
		const statVisitDeviceRes = await this.aggregate(this.sessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
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
		let activeDeviceCount = 0
		if (statVisitDeviceRes.data.length > 0) {
			activeDeviceCount = statVisitDeviceRes.data[0].total_devices
		}

		//安卓平台活跃设备数需要减去sdk更新后device_id发生变更的设备数
		if(platformInfo.code === 'android') {
			const oldDeviceRes = await this.aggregate(this.sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					old_device_id: 1,
					create_time: 1
				},
				match: matchCondition,
				group: {
					_id: {
						device_id: '$old_device_id'
					},
					create_time: {
						$min: '$create_time'
					},
					sessionCount: {
						$sum: 1
					}
				},
				sort: {
					create_time: 1,
					sessionCount: 1
				},
				getAll: true
			})

			if(oldDeviceRes.data.length) {
				const thisOldDeviceIds = []
				for (const tau in oldDeviceRes.data) {
					if(oldDeviceRes.data[tau]._id.device_id) {
						thisOldDeviceIds.push(oldDeviceRes.data[tau]._id.device_id)
					}
				}
				const statVisitOldDeviceRes = await this.aggregate(this.sessionLog.tableName, {
					project: {
						appid: 1,
						version: 1,
						platform: 1,
						channel: 1,
						device_id: 1,
						create_time: 1
					},
					match: {
						...matchCondition,
						device_id: {
							$in: thisOldDeviceIds
						}
					},
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
					console.log('statVisitOldDeviceRes', JSON.stringify(statVisitOldDeviceRes))
				}
				if (statVisitOldDeviceRes && statVisitOldDeviceRes.data.length > 0) {
					// 活跃设备留存数
					activeDeviceCount -= statVisitOldDeviceRes.data[0].total_devices
				}
			}
		}

		// 错误数量统计
		const errorLog = new ErrorLog()
		const statErrorRes = await this.getCollection(errorLog.tableName).where(matchCondition).count()
		let errorCount = 0
		if (statErrorRes && statErrorRes.total > 0) {
			errorCount = statErrorRes.total
		}

		// 设备的次均停留时长，设备访问总时长/设备会话次数
		let avgSessionTime = 0
		if (data.total_duration > 0 && data.session_times > 0) {
			avgSessionTime = Math.round(data.total_duration / data.session_times)
		}

		// 设均停留时长
		let avgDeviceTime = 0
		if (data.total_duration > 0 && activeDeviceCount > 0) {
			avgDeviceTime = Math.round(data.total_duration / activeDeviceCount)
		}

		// 跳出率
		let bounceTimes = 0
		const bounceRes = await this.getCollection(this.sessionLog.tableName).where({
			...matchCondition,
			page_count: 1
		}).count()
		if (bounceRes && bounceRes.total > 0) {
			bounceTimes = bounceRes.total
		}
		let bounceRate = 0
		if (bounceTimes > 0 && data.session_times > 0) {
			bounceRate = bounceTimes * 100 / data.session_times
			bounceRate = parseFloat(bounceRate.toFixed(2))
		}

		// 应用启动次数 = 会话次数
		const launchCount = data.session_times

		// 累计设备数
		let totalDevices = data.new_device_count
		const totalDeviceRes = await this.getCollection(this.tableName).where({
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			dimension: this.fillType,
			start_time: {
				$lt: this.startTime
			}
		}).orderBy('start_time', 'desc').limit(1).get()

		if (totalDeviceRes && totalDeviceRes.data.length > 0) {
			totalDevices += totalDeviceRes.data[0].total_devices
		}

		//活跃用户数
		const userSessionLog = new UserSessionLog()
		let activeUserCount = 0
		const activeUserCountRes = await this.aggregate(userSessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				uid: 1,
				create_time: 1
			},
			match: matchCondition,
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

		if (activeUserCountRes && activeUserCountRes.data.length > 0) {
			activeUserCount = activeUserCountRes.data[0].total_users
		}

		//新增用户数
		const uniIDUsers = new UniIDUsers()
		let newUserCount = await uniIDUsers.getUserCount(matchCondition.appid, matchCondition.platform,
			matchCondition.channel, matchCondition.version, {
				$gte: this.startTime,
				$lte: this.endTime
			})

		//总用户数
		let totalUserCount = await uniIDUsers.getUserCount(matchCondition.appid, matchCondition.platform,
			matchCondition.channel, matchCondition.version, {
				$lte: this.endTime
			})


		//用户停留总时长及总会话次数
		let totalUserDuration = 0
		let totalUserSessionTimes = 0
		const totalUserDurationRes = await this.aggregate(userSessionLog.tableName, {
			project: {
				appid: 1,
				version: 1,
				platform: 1,
				channel: 1,
				duration: 1,
				create_time: 1
			},
			match: matchCondition,
			group: [{
				_id: {},
				total_duration: {
					$sum: "$duration"
				},
				total_session_times: {
					$sum: 1
				}
			}]
		})
		if (totalUserDurationRes && totalUserDurationRes.data.length > 0) {
			totalUserDuration = totalUserDurationRes.data[0].total_duration
			totalUserSessionTimes = totalUserDurationRes.data[0].total_session_times
		}

		//人均停留时长
		let avgUserTime = 0
		//用户次均访问时长
		let avgUserSessionTime = 0
		if (totalUserDuration > 0 && activeUserCount > 0) {
			avgUserTime = Math.round(totalUserDuration / activeUserCount)
			avgUserSessionTime = Math.round(totalUserDuration / totalUserSessionTimes)
		}

		//设置填充数据
		const datetime = new DateTime()
		const insertParam = {
			appid: data._id.appid,
			platform_id: platformInfo._id,
			channel_id: channelInfo._id,
			version_id: versionInfo._id,
			total_devices: totalDevices,
			new_device_count: data.new_device_count,
			active_device_count: activeDeviceCount,
			total_users: totalUserCount,
			new_user_count: newUserCount,
			active_user_count: activeUserCount,
			user_session_times: totalUserSessionTimes,
			app_launch_count: launchCount,
			page_visit_count: data.page_view_count,
			error_count: errorCount,
			duration: data.total_duration,
			user_duration: totalUserDuration,
			avg_device_session_time: avgSessionTime,
			avg_user_session_time: avgUserSessionTime,
			avg_device_time: avgDeviceTime,
			avg_user_time: avgUserTime,
			bounce_times: bounceTimes,
			bounce_rate: bounceRate,
			retention: {},
			dimension: this.fillType,
			stat_date: datetime.getDate('Ymd', this.startTime),
			start_time: this.startTime,
			end_time: this.endTime
		}

		//数据填充
		this.fillData.push(insertParam)
		this.composes.push(data._id.appid + '_' + platformInfo._id + '_' + channelInfo._id + '_' + versionInfo
			._id)
		return insertParam
	}

	/**
	 * 基础统计数据补充，防止累计数据丢失
	 */
	async replenishStat() {
		if (this.debug) {
			console.log('composes data', this.composes)
		}

		const datetime = new DateTime()
		// const {
		// 	startTime
		// } = datetime.getTimeDimensionByType(this.fillType, -1, this.startTime)

		//上一次统计时间
		let preStatRes = await this.getCollection(this.tableName).where({
			start_time: {$lt: this.startTime},
			dimension: this.fillType
		}).orderBy('start_time', 'desc').limit(1).get()
		let preStartTime = 0
		if(preStatRes && preStatRes.data.length > 0) {
			preStartTime = preStatRes.data[0].start_time
		}

		if (this.debug) {
			console.log('replenishStat-preStartTime', preStartTime)
		}

		if(!preStartTime) {
			return false
		}

		// 上一阶段数据
		const preStatData = await this.selectAll(this.tableName, {
			start_time: preStartTime,
			dimension: this.fillType
		}, {
			appid: 1,
			platform_id: 1,
			channel_id: 1,
			version_id: 1,
			total_devices: 1,
			total_users: 1
		})

		if (!preStatData || preStatData.data.length === 0) {
			return false
		}

		if (this.debug) {
			console.log('preStatData', JSON.stringify(preStatData))
		}

		let preKey
		const preKeyArr = []
		for (const pi in preStatData.data) {
			preKey = preStatData.data[pi].appid + '_' + preStatData.data[pi].platform_id + '_' + preStatData
				.data[pi].channel_id + '_' + preStatData.data[pi].version_id
			if (!this.composes.includes(preKey) && !preKeyArr.includes(preKey)) {
				preKeyArr.push(preKey)
				if (this.debug) {
					console.log('preKey -add', preKey)
				}
				this.fillData.push({
					appid: preStatData.data[pi].appid,
					platform_id: preStatData.data[pi].platform_id,
					channel_id: preStatData.data[pi].channel_id,
					version_id: preStatData.data[pi].version_id,
					total_devices: preStatData.data[pi].total_devices,
					new_device_count: 0,
					active_device_count: 0,
					total_users: preStatData.data[pi].total_users,
					new_user_count: 0,
					active_user_count: 0,
					user_session_times: 0,
					app_launch_count: 0,
					page_visit_count: 0,
					error_count: 0,
					duration: 0,
					user_duration: 0,
					avg_device_session_time: 0,
					avg_user_session_time: 0,
					avg_device_time: 0,
					avg_user_time: 0,
					bounce_times: 0,
					bounce_rate: 0,
					retention: {},
					dimension: this.fillType,
					stat_date: datetime.getDate('Ymd', this.startTime),
					start_time: this.startTime,
					end_time: this.endTime
				})
			} else if (this.debug) {
				console.log('preKey -have', preKey)
			}
		}

		return true
	}

	/**
	 * 留存数据统计
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {String} mod 统计模块 device:设备，user:用户
	 */
	async retentionStat(type, date, mod = 'device') {
		date = date ? date : new DateTime().getTimeBySetDays(-1, date)
		const allowedType = ['day', 'week', 'month']
		if (!allowedType.includes(type)) {
			return {
				code: 1002,
				msg: 'This type is not allowed'
			}
		}
		let days = []
		switch (type) {
			case 'week':
			case 'month':
				days = [1, 2, 3, 4, 5, 6, 7, 8, 9]
				break
			default:
				days = [1, 2, 3, 4, 5, 6, 7, 14, 30]
				break
		}

		let res = {
			code: 0,
			msg: 'success'
		}

		for (const day in days) {
			//留存统计数据库查询较为复杂，因此这里拆分为多个维度
			if (mod && mod === 'user') {
				//用户留存统计
				if (type === 'day') {
					res = await this.userRetentionFillDayly(type, days[day], date)
				} else {
					res = await this.userRetentionFillWeekOrMonth(type, days[day], date)
				}
			} else {
				//设备留存统计
				if (type === 'day') {
					res = await this.deviceRetentionFillDayly(type, days[day], date)
				} else {
					res = await this.deviceRetentionFillWeekOrMonth(type, days[day], date)
				}
			}
		}
		return res
	}

	/**
	 * 设备日留存统计数据填充
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async deviceRetentionFillDayly(type, day, date) {
		if (type !== 'day') {
			return {
				code: 301,
				msg: 'Type error:' + type
			}
		}
		const dateTime = new DateTime()
		const {
			startTime,
			endTime
		} = dateTime.getTimeDimensionByType(type, 0 - day, date)

		if (!startTime || !endTime) {
			return {
				code: 1001,
				msg: 'The statistic time get failed'
			}
		}

		// 截止时间范围
		const lastTimeInfo = dateTime.getTimeDimensionByType(type, 0, date)

		// 获取当时批次的统计日志
		const resultLogRes = await this.selectAll(this.tableName, {
			dimension: type,
			start_time: startTime,
			end_time: endTime
		})
		// const resultLogRes = await this.getCollection(this.tableName).where({
		//   dimension: type,
		//   start_time: startTime,
		//   end_time: endTime
		// }).get()

		if (this.debug) {
			console.log('resultLogRes', JSON.stringify(resultLogRes))
		}

		if (!resultLogRes || resultLogRes.data.length === 0) {
			if (this.debug) {
				console.log('Not found this log --' + type + ':' + day + ', start:' + startTime + ',endTime:' +
					endTime)
			}
			return {
				code: 1000,
				msg: 'Not found this log'
			}
		}

		const sessionLog = new SessionLog()
		const platform = new Platform()
		const channel = new Channel()
		const version = new Version()
		let res = null
		for (const resultIndex in resultLogRes.data) {
			const resultLog = resultLogRes.data[resultIndex]
			// 平台信息
			let platformInfo = null
			if (this.platforms && this.platforms[resultLog.platform_id]) {
				platformInfo = this.platforms[resultLog.platform_id]
			} else {
				platformInfo = await this.getById(platform.tableName, resultLog.platform_id)
				if (!platformInfo || platformInfo.length === 0) {
					platformInfo.code = ''
				}
				this.platforms[resultLog.platform_id] = platformInfo
				if (this.debug) {
					console.log('platformInfo', JSON.stringify(platformInfo))
				}
			}
			// 渠道信息
			let channelInfo = null
			if (this.channels && this.channels[resultLog.channel_id]) {
				channelInfo = this.channels[resultLog.channel_id]
			} else {
				channelInfo = await this.getById(channel.tableName, resultLog.channel_id)
				if (!channelInfo || channelInfo.length === 0) {
					channelInfo.channel_code = ''
				}
				this.channels[resultLog.channel_id] = channelInfo
				if (this.debug) {
					console.log('channelInfo', JSON.stringify(channelInfo))
				}
			}
			// 版本信息
			let versionInfo = null
			if (this.versions && this.versions[resultLog.version_id]) {
				versionInfo = this.versions[resultLog.version_id]
			} else {
				versionInfo = await this.getById(version.tableName, resultLog.version_id, false)
				if (!versionInfo || versionInfo.length === 0) {
					versionInfo.version = ''
				}
				this.versions[resultLog.version_id] = versionInfo
				if (this.debug) {
					console.log('versionInfo', JSON.stringify(versionInfo))
				}
			}

			// 获取该批次的活跃设备数
			const activeDeviceRes = await this.aggregate(sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					device_id: 1,
					create_time: 1
				},
				match: {
					appid: resultLog.appid,
					version: versionInfo.version,
					platform: platformInfo.code,
					channel: channelInfo.channel_code,
					create_time: {
						$gte: startTime,
						$lte: endTime
					}
				},
				group: {
					_id: {
						device_id: '$device_id'
					},
					create_time: {
						$min: '$create_time'
					},
					sessionCount: {
						$sum: 1
					}
				},
				sort: {
					create_time: 1,
					sessionCount: 1
				},
				getAll: true
			})

			if (this.debug) {
				console.log('activeDeviceRes', JSON.stringify(activeDeviceRes))
			}
			let activeDeviceRate = 0
			let activeDevices = 0
			if (activeDeviceRes && activeDeviceRes.data.length > 0) {
				const thisDayActiveDevices = activeDeviceRes.data.length
				const thisDayActiveDeviceIds = []
				for (const tau in activeDeviceRes.data) {
					thisDayActiveDeviceIds.push(activeDeviceRes.data[tau]._id.device_id)
				}
				if (this.debug) {
					console.log('thisDayActiveDeviceIds', JSON.stringify(thisDayActiveDeviceIds))
				}

				// 留存活跃设备查询
				const retentionActiveDeviceRes = await this.aggregate(sessionLog.tableName, {
					project: {
						appid: 1,
						version: 1,
						platform: 1,
						channel: 1,
						device_id: 1,
						create_time: 1
					},
					match: {
						appid: resultLog.appid,
						version: versionInfo.version,
						platform: platformInfo.code,
						channel: channelInfo.channel_code,
						device_id: {
							$in: thisDayActiveDeviceIds
						},
						create_time: {
							$gte: lastTimeInfo.startTime,
							$lte: lastTimeInfo.endTime
						}
					},
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
					console.log('retentionActiveDeviceRes', JSON.stringify(retentionActiveDeviceRes))
				}
				if (retentionActiveDeviceRes && retentionActiveDeviceRes.data.length > 0) {
					// 活跃设备留存数
					activeDevices = retentionActiveDeviceRes.data[0].total_devices
					// 活跃设备留存率
					activeDeviceRate = parseFloat((activeDevices * 100 / thisDayActiveDevices).toFixed(2))
				}

				//安卓平台留存需要增加sdk更新后device_id发生变更的设备数
				if(platformInfo.code === 'android') {
					const retentionActiveOldDeviceRes = await this.aggregate(sessionLog.tableName, {
						project: {
							appid: 1,
							version: 1,
							platform: 1,
							channel: 1,
							old_device_id: 1,
							create_time: 1
						},
						match: {
							appid: resultLog.appid,
							version: versionInfo.version,
							platform: platformInfo.code,
							channel: channelInfo.channel_code,
							old_device_id: {
								$in: thisDayActiveDeviceIds
							},
							create_time: {
								$gte: lastTimeInfo.startTime,
								$lte: lastTimeInfo.endTime
							}
						},
						group: [{
							_id: {
								device_id: '$old_device_id'
							}
						}, {
							_id: {},
							total_devices: {
								$sum: 1
							}
						}]
					})

					if (this.debug) {
						console.log('retentionActiveOldDeviceRes', JSON.stringify(retentionActiveOldDeviceRes))
					}
					if (retentionActiveOldDeviceRes && retentionActiveOldDeviceRes.data.length > 0) {
						// 活跃设备留存数
						activeDevices += retentionActiveOldDeviceRes.data[0].total_devices
						// 活跃设备留存率
						activeDeviceRate = parseFloat((activeDevices * 100 / thisDayActiveDevices).toFixed(2))
					}
				}
			}

			// 获取该批次新增设备数
			const newDeviceRes = await this.aggregate(sessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					is_first_visit: 1,
					device_id: 1,
					create_time: 1
				},
				match: {
					appid: resultLog.appid,
					version: versionInfo.version,
					platform: platformInfo.code,
					channel: channelInfo.channel_code,
					is_first_visit: 1,
					create_time: {
						$gte: startTime,
						$lte: endTime
					}
				},
				group: {
					_id: {
						device_id: '$device_id'
					},
					create_time: {
						$min: '$create_time'
					},
					sessionCount: {
						$sum: 1
					}
				},
				sort: {
					create_time: 1,
					sessionCount: 1
				},
				getAll: true
			})

			let newDeviceRate = 0
			let newDevices = 0
			if (newDeviceRes && newDeviceRes.data.length > 0) {
				const thisDayNewDevices = newDeviceRes.data.length
				const thisDayNewDeviceIds = []
				for (const tau in newDeviceRes.data) {
					thisDayNewDeviceIds.push(newDeviceRes.data[tau]._id.device_id)
				}

				if (this.debug) {
					console.log('thisDayNewDeviceIds', JSON.stringify(thisDayNewDeviceIds))
				}

				// 留存的设备查询
				const retentionNewDeviceRes = await this.aggregate(sessionLog.tableName, {
					project: {
						appid: 1,
						version: 1,
						platform: 1,
						channel: 1,
						device_id: 1,
						create_time: 1
					},
					match: {
						appid: resultLog.appid,
						version: versionInfo.version,
						platform: platformInfo.code,
						channel: channelInfo.channel_code,
						device_id: {
							$in: thisDayNewDeviceIds
						},
						create_time: {
							$gte: lastTimeInfo.startTime,
							$lte: lastTimeInfo.endTime
						}
					},
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

				if (retentionNewDeviceRes && retentionNewDeviceRes.data.length > 0) {
					// 新增设备留存数
					newDevices = retentionNewDeviceRes.data[0].total_devices
					// 新增设备留存率
					newDeviceRate = parseFloat((newDevices * 100 / thisDayNewDevices).toFixed(2))
				}

				//安卓平台留存需要增加sdk更新后device_id发生变更的设备数
				if(platformInfo.code === 'android') {
					const retentionNewOldDeviceRes = await this.aggregate(sessionLog.tableName, {
						project: {
							appid: 1,
							version: 1,
							platform: 1,
							channel: 1,
							old_device_id: 1,
							create_time: 1
						},
						match: {
							appid: resultLog.appid,
							version: versionInfo.version,
							platform: platformInfo.code,
							channel: channelInfo.channel_code,
							old_device_id: {
								$in: thisDayNewDeviceIds
							},
							create_time: {
								$gte: lastTimeInfo.startTime,
								$lte: lastTimeInfo.endTime
							}
						},
						group: [{
							_id: {
								device_id: '$old_device_id'
							}
						}, {
							_id: {},
							total_devices: {
								$sum: 1
							}
						}]
					})

					if (this.debug) {
						console.log('retentionNewOldDeviceRes', JSON.stringify(retentionNewOldDeviceRes))
					}

					if (retentionNewOldDeviceRes && retentionNewOldDeviceRes.data.length > 0) {
						// 新增设备留存数
						newDevices += retentionNewOldDeviceRes.data[0].total_devices
						// 新增设备留存率
						newDeviceRate = parseFloat((newDevices * 100 / thisDayNewDevices).toFixed(2))
					}
				}
			}

			// 数据更新
			const retentionData = resultLog.retention
			const dataKey = type.substr(0, 1) + '_' + day
			if (!retentionData.active_device) {
				retentionData.active_device = {}
			}
			retentionData.active_device[dataKey] = {
				device_count: activeDevices,
				device_rate: activeDeviceRate
			}
			if (!retentionData.new_device) {
				retentionData.new_device = {}
			}
			retentionData.new_device[dataKey] = {
				device_count: newDevices,
				device_rate: newDeviceRate
			}

			if (this.debug) {
				console.log('retentionData', JSON.stringify(retentionData))
			}

			res = await this.update(this.tableName, {
				retention: retentionData
			}, {
				_id: resultLog._id
			})
		}

		if (res && res.updated) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'retention data update failed'
			}
		}
	}

	/**
	 * 设备周/月留存数据填充
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async deviceRetentionFillWeekOrMonth(type, day, date) {
		if (!['week', 'month'].includes(type)) {
			return {
				code: 301,
				msg: 'Type error:' + type
			}
		}
		const dateTime = new DateTime()
		const {
			startTime,
			endTime
		} = dateTime.getTimeDimensionByType(type, 0 - day, date)

		if (!startTime || !endTime) {
			return {
				code: 1001,
				msg: 'The statistic time get failed'
			}
		}

		// 截止时间范围
		const lastTimeInfo = dateTime.getTimeDimensionByType(type, 0, date)

		// 获取当时批次的统计日志
		const resultLogRes = await this.selectAll(this.tableName, {
			dimension: type,
			start_time: startTime,
			end_time: endTime
		})

		if (this.debug) {
			console.log('resultLogRes', JSON.stringify(resultLogRes))
		}

		if (!resultLogRes || resultLogRes.data.length === 0) {
			if (this.debug) {
				console.log('Not found this session log --' + type + ':' + day + ', start:' + startTime +
					',endTime:' + endTime)
			}
			return {
				code: 1000,
				msg: 'Not found this session log'
			}
		}

		const activeDevicesObj = new ActiveDevices()
		let res = null;
		let activeDeviceRes;
		let activeDeviceRate;
		let activeDevices;
		let newDeviceRate;
		let newDevices
		for (const resultIndex in resultLogRes.data) {
			const resultLog = resultLogRes.data[resultIndex]
			// 获取该批次的活跃设备数
			activeDeviceRes = await this.selectAll(activeDevicesObj.tableName, {
				appid: resultLog.appid,
				platform_id: resultLog.platform_id,
				channel_id: resultLog.channel_id,
				version_id: resultLog.version_id,
				dimension: type,
				create_time: {
					$gte: startTime,
					$lte: endTime
				}
			}, {
				device_id: 1
			})

			if (this.debug) {
				console.log('activeDeviceRes', JSON.stringify(activeDeviceRes))
			}

			activeDeviceRate = 0
			activeDevices = 0
			if (activeDeviceRes && activeDeviceRes.data.length > 0) {
				const thisDayActiveDevices = activeDeviceRes.data.length
				const thisDayActiveDeviceIds = []
				for (const tau in activeDeviceRes.data) {
					thisDayActiveDeviceIds.push(activeDeviceRes.data[tau].device_id)
				}
				if (this.debug) {
					console.log('thisDayActiveDeviceIds', JSON.stringify(thisDayActiveDeviceIds))
				}
				// 留存活跃设备数
				const retentionActiveDeviceRes = await this.getCollection(activeDevicesObj.tableName).where({
					appid: resultLog.appid,
					platform_id: resultLog.platform_id,
					channel_id: resultLog.channel_id,
					version_id: resultLog.version_id,
					device_id: {
						$in: thisDayActiveDeviceIds
					},
					dimension: type,
					create_time: {
						$gte: lastTimeInfo.startTime,
						$lte: lastTimeInfo.endTime
					}
				}).count()

				if (this.debug) {
					console.log('retentionActiveDeviceRes', JSON.stringify(retentionActiveDeviceRes))
				}
				if (retentionActiveDeviceRes && retentionActiveDeviceRes.total > 0) {
					// 活跃设备留存数
					activeDevices = retentionActiveDeviceRes.total
					// 活跃设备留存率
					activeDeviceRate = parseFloat((activeDevices * 100 / thisDayActiveDevices).toFixed(2))
				}
			}

			// 获取该批次的新增设备数
			const newDeviceRes = await this.selectAll(activeDevicesObj.tableName, {
				appid: resultLog.appid,
				platform_id: resultLog.platform_id,
				channel_id: resultLog.channel_id,
				version_id: resultLog.version_id,
				is_new: 1,
				dimension: type,
				create_time: {
					$gte: startTime,
					$lte: endTime
				}
			}, {
				device_id: 1
			})

			newDeviceRate = 0
			newDevices = 0
			if (newDeviceRes && newDeviceRes.data.length > 0) {
				const thisDayNewDevices = newDeviceRes.data.length
				const thisDayNewDeviceIds = []
				for (const tau in newDeviceRes.data) {
					thisDayNewDeviceIds.push(newDeviceRes.data[tau].device_id)
				}

				// 新增设备留存数
				const retentionNewDeviceRes = await this.getCollection(activeDevicesObj.tableName).where({
					appid: resultLog.appid,
					platform_id: resultLog.platform_id,
					channel_id: resultLog.channel_id,
					version_id: resultLog.version_id,
					device_id: {
						$in: thisDayNewDeviceIds
					},
					dimension: type,
					create_time: {
						$gte: lastTimeInfo.startTime,
						$lte: lastTimeInfo.endTime
					}
				}).count()

				if (retentionNewDeviceRes && retentionNewDeviceRes.total > 0) {
					// 新增设备留存数
					newDevices = retentionNewDeviceRes.total
					// 新增设备留存率
					newDeviceRate = parseFloat((newDevices * 100 / thisDayNewDevices).toFixed(2))
				}
			}

			// 数据更新
			const retentionData = resultLog.retention
			const dataKey = type.substr(0, 1) + '_' + day
			if (!retentionData.active_device) {
				retentionData.active_device = {}
			}
			retentionData.active_device[dataKey] = {
				device_count: activeDevices,
				device_rate: activeDeviceRate
			}
			if (!retentionData.new_device) {
				retentionData.new_device = {}
			}
			retentionData.new_device[dataKey] = {
				device_count: newDevices,
				device_rate: newDeviceRate
			}

			if (this.debug) {
				console.log('retentionData', JSON.stringify(retentionData))
			}

			res = await this.update(this.tableName, {
				retention: retentionData
			}, {
				_id: resultLog._id
			})
		}

		if (res && res.updated) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'retention data update failed'
			}
		}
	}

	/**
	 * 用户日留存数据填充
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async userRetentionFillDayly(type, day, date) {
		if (type !== 'day') {
			return {
				code: 301,
				msg: 'Type error:' + type
			}
		}
		const dateTime = new DateTime()
		const {
			startTime,
			endTime
		} = dateTime.getTimeDimensionByType(type, 0 - day, date)

		if (!startTime || !endTime) {
			return {
				code: 1001,
				msg: 'The statistic time get failed'
			}
		}

		// 截止时间范围
		const lastTimeInfo = dateTime.getTimeDimensionByType(type, 0, date)

		// 获取当时批次的统计日志
		const resultLogRes = await this.selectAll(this.tableName, {
			dimension: type,
			start_time: startTime,
			end_time: endTime
		})

		if (this.debug) {
			console.log('resultLogRes', JSON.stringify(resultLogRes))
		}

		if (!resultLogRes || resultLogRes.data.length === 0) {
			if (this.debug) {
				console.log('Not found this log --' + type + ':' + day + ', start:' + startTime + ',endTime:' +
					endTime)
			}
			return {
				code: 1000,
				msg: 'Not found this log'
			}
		}

		const userSessionLog = new UserSessionLog()
		const uniIDUsers = new UniIDUsers()
		const platform = new Platform()
		const channel = new Channel()
		const version = new Version()
		let res = null
		for (const resultIndex in resultLogRes.data) {
			const resultLog = resultLogRes.data[resultIndex]
			// 平台信息
			let platformInfo = null
			if (this.platforms && this.platforms[resultLog.platform_id]) {
				platformInfo = this.platforms[resultLog.platform_id]
			} else {
				platformInfo = await this.getById(platform.tableName, resultLog.platform_id)
				if (!platformInfo || platformInfo.length === 0) {
					platformInfo.code = ''
				}
				this.platforms[resultLog.platform_id] = platformInfo
				if (this.debug) {
					console.log('platformInfo', JSON.stringify(platformInfo))
				}
			}
			// 渠道信息
			let channelInfo = null
			if (this.channels && this.channels[resultLog.channel_id]) {
				channelInfo = this.channels[resultLog.channel_id]
			} else {
				channelInfo = await this.getById(channel.tableName, resultLog.channel_id)
				if (!channelInfo || channelInfo.length === 0) {
					channelInfo.channel_code = ''
				}
				this.channels[resultLog.channel_id] = channelInfo
				if (this.debug) {
					console.log('channelInfo', JSON.stringify(channelInfo))
				}
			}
			// 版本信息
			let versionInfo = null
			if (this.versions && this.versions[resultLog.version_id]) {
				versionInfo = this.versions[resultLog.version_id]
			} else {
				versionInfo = await this.getById(version.tableName, resultLog.version_id, false)
				if (!versionInfo || versionInfo.length === 0) {
					versionInfo.version = ''
				}
				this.versions[resultLog.version_id] = versionInfo
				if (this.debug) {
					console.log('versionInfo', JSON.stringify(versionInfo))
				}
			}

			// 获取该时间段内的活跃用户
			const activeUserRes = await this.aggregate(userSessionLog.tableName, {
				project: {
					appid: 1,
					version: 1,
					platform: 1,
					channel: 1,
					uid: 1,
					create_time: 1
				},
				match: {
					appid: resultLog.appid,
					version: versionInfo.version,
					platform: platformInfo.code,
					channel: channelInfo.channel_code,
					create_time: {
						$gte: startTime,
						$lte: endTime
					}
				},
				group: {
					_id: {
						uid: '$uid'
					},
					create_time: {
						$min: '$create_time'
					},
					sessionCount: {
						$sum: 1
					}
				},
				sort: {
					create_time: 1,
					sessionCount: 1
				},
				getAll: true
			})

			if (this.debug) {
				console.log('activeUserRes', JSON.stringify(activeUserRes))
			}

			//活跃用户留存率
			let activeUserRate = 0
			//活跃用户留存数
			let activeUsers = 0
			if (activeUserRes && activeUserRes.data.length > 0) {
				const thisDayActiveUsers = activeUserRes.data.length
				//获取该时间段内的活跃用户编号，这里没用lookup联查是因为数据量较大时lookup效率很低
				const thisDayActiveUids = []
				for (let tau in activeUserRes.data) {
					thisDayActiveUids.push(activeUserRes.data[tau]._id.uid)
				}

				if (this.debug) {
					console.log('thisDayActiveUids', JSON.stringify(thisDayActiveUids))
				}

				// 留存活跃用户数
				const retentionActiveUserRes = await this.aggregate(userSessionLog.tableName, {
					project: {
						appid: 1,
						version: 1,
						platform: 1,
						channel: 1,
						uid: 1,
						create_time: 1
					},
					match: {
						appid: resultLog.appid,
						version: versionInfo.version,
						platform: platformInfo.code,
						channel: channelInfo.channel_code,
						uid: {
							$in: thisDayActiveUids
						},
						create_time: {
							$gte: lastTimeInfo.startTime,
							$lte: lastTimeInfo.endTime
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

				if (this.debug) {
					console.log('retentionActiveUserRes', JSON.stringify(retentionActiveUserRes))
				}
				if (retentionActiveUserRes && retentionActiveUserRes.data.length > 0) {
					// 活跃用户留存数
					activeUsers = retentionActiveUserRes.data[0].total_users
					// 活跃用户留存率
					activeUserRate = parseFloat((activeUsers * 100 / thisDayActiveUsers).toFixed(2))
				}
			}



			//新增用户编号
			const thisDayNewUids = await uniIDUsers.getUserIds(resultLog.appid, platformInfo.code, channelInfo.channel_code, versionInfo.version, {
				$gte: startTime,
				$lte: endTime
			})
			//新增用户留存率
			let newUserRate = 0
			//新增用户留存数
			let newUsers = 0
			if (thisDayNewUids.length > 0) {
				// 现在依然活跃的用户数
				const retentionNewUserRes = await this.aggregate(userSessionLog.tableName, {
					project: {
						appid: 1,
						version: 1,
						platform: 1,
						channel: 1,
						uid: 1,
						create_time: 1
					},
					match: {
						appid: resultLog.appid,
						version: versionInfo.version,
						platform: platformInfo.code,
						channel: channelInfo.channel_code,
						uid: {
							$in: thisDayNewUids
						},
						create_time: {
							$gte: lastTimeInfo.startTime,
							$lte: lastTimeInfo.endTime
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

				if (retentionNewUserRes && retentionNewUserRes.data.length > 0) {
					// 新增用户留存数
					newUsers = retentionNewUserRes.data[0].total_users
					// 新增用户留存率
					newUserRate = parseFloat((newUsers * 100 / thisDayNewUids.length).toFixed(2))
				}
			}

			// 数据更新
			const retentionData = resultLog.retention
			const dataKey = type.substr(0, 1) + '_' + day
			if (!retentionData.active_user) {
				retentionData.active_user = {}
			}
			retentionData.active_user[dataKey] = {
				user_count: activeUsers,
				user_rate: activeUserRate
			}
			if (!retentionData.new_user) {
				retentionData.new_user = {}
			}
			retentionData.new_user[dataKey] = {
				user_count: newUsers,
				user_rate: newUserRate
			}

			if (this.debug) {
				console.log('retentionData', JSON.stringify(retentionData))
			}

			res = await this.update(this.tableName, {
				retention: retentionData
			}, {
				_id: resultLog._id
			})
		}

		if (res && res.updated) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'retention data update failed'
			}
		}
	}


	/**
	 * 用户周/月留存数据填充
	 * @param {String} type 统计类型 hour：实时统计 day：按天统计，week：按周统计 month：按月统计
	 * @param {Date|Time} date 指定日期或时间戳
	 * @param {Boolean} reset 是否重置，为ture时会重置该批次数据
	 */
	async userRetentionFillWeekOrMonth(type, day, date) {
		if (!['week', 'month'].includes(type)) {
			return {
				code: 301,
				msg: 'Type error:' + type
			}
		}
		const dateTime = new DateTime()
		const {
			startTime,
			endTime
		} = dateTime.getTimeDimensionByType(type, 0 - day, date)

		if (!startTime || !endTime) {
			return {
				code: 1001,
				msg: 'The statistic time get failed'
			}
		}

		// 截止时间范围
		const lastTimeInfo = dateTime.getTimeDimensionByType(type, 0, date)

		// 获取当时批次的统计日志
		const resultLogRes = await this.selectAll(this.tableName, {
			dimension: type,
			start_time: startTime,
			end_time: endTime
		})

		if (this.debug) {
			console.log('resultLogRes', JSON.stringify(resultLogRes))
		}

		if (!resultLogRes || resultLogRes.data.length === 0) {
			if (this.debug) {
				console.log('Not found this session log --' + type + ':' + day + ', start:' + startTime +
					',endTime:' + endTime)
			}
			return {
				code: 1000,
				msg: 'Not found this session log'
			}
		}

		const activeUserObj = new ActiveUsers()
		const uniIDUsers = new UniIDUsers()
		const platform = new Platform()
		const channel = new Channel()
		const version = new Version()
		let res = null
		//活跃用户留存率
		let activeUserRate
		//活跃用户留存数
		let activeUsers
		//新增用户留存率
		let newUserRate
		//新增用户留存数
		let newUsers
		for (const resultIndex in resultLogRes.data) {
			const resultLog = resultLogRes.data[resultIndex]

			// 平台信息
			let platformInfo = null
			if (this.platforms && this.platforms[resultLog.platform_id]) {
				platformInfo = this.platforms[resultLog.platform_id]
			} else {
				platformInfo = await this.getById(platform.tableName, resultLog.platform_id)
				if (!platformInfo || platformInfo.length === 0) {
					platformInfo.code = ''
				}
				this.platforms[resultLog.platform_id] = platformInfo
				if (this.debug) {
					console.log('platformInfo', JSON.stringify(platformInfo))
				}
			}
			// 渠道信息
			let channelInfo = null
			if (this.channels && this.channels[resultLog.channel_id]) {
				channelInfo = this.channels[resultLog.channel_id]
			} else {
				channelInfo = await this.getById(channel.tableName, resultLog.channel_id)
				if (!channelInfo || channelInfo.length === 0) {
					channelInfo.channel_code = ''
				}
				this.channels[resultLog.channel_id] = channelInfo
				if (this.debug) {
					console.log('channelInfo', JSON.stringify(channelInfo))
				}
			}
			// 版本信息
			let versionInfo = null
			if (this.versions && this.versions[resultLog.version_id]) {
				versionInfo = this.versions[resultLog.version_id]
			} else {
				versionInfo = await this.getById(version.tableName, resultLog.version_id, false)
				if (!versionInfo || versionInfo.length === 0) {
					versionInfo.version = ''
				}
				this.versions[resultLog.version_id] = versionInfo
				if (this.debug) {
					console.log('versionInfo', JSON.stringify(versionInfo))
				}
			}

			// 获取该批次的活跃用户数
			const activeUserRes = await this.selectAll(activeUserObj.tableName, {
				appid: resultLog.appid,
				platform_id: resultLog.platform_id,
				channel_id: resultLog.channel_id,
				version_id: resultLog.version_id,
				dimension: type,
				create_time: {
					$gte: startTime,
					$lte: endTime
				}
			}, {
				uid: 1
			})

			if (this.debug) {
				console.log('activeUserRes', JSON.stringify(activeUserRes))
			}

			activeUserRate = 0
			activeUsers = 0
			if (activeUserRes && activeUserRes.data.length > 0) {
				const thisDayactiveUsers = activeUserRes.data.length
				const thisDayActiveDeviceIds = []
				for (const tau in activeUserRes.data) {
					thisDayActiveDeviceIds.push(activeUserRes.data[tau].uid)
				}
				if (this.debug) {
					console.log('thisDayActiveDeviceIds', JSON.stringify(thisDayActiveDeviceIds))
				}
				// 留存活跃用户数
				const retentionactiveUserRes = await this.getCollection(activeUserObj.tableName).where({
					appid: resultLog.appid,
					platform_id: resultLog.platform_id,
					channel_id: resultLog.channel_id,
					version_id: resultLog.version_id,
					uid: {
						$in: thisDayActiveDeviceIds
					},
					dimension: type,
					create_time: {
						$gte: lastTimeInfo.startTime,
						$lte: lastTimeInfo.endTime
					}
				}).count()

				if (this.debug) {
					console.log('retentionactiveUserRes', JSON.stringify(retentionactiveUserRes))
				}
				if (retentionactiveUserRes && retentionactiveUserRes.total > 0) {
					// 活跃用户留存数
					activeUsers = retentionactiveUserRes.total
					// 活跃用户留存率
					activeUserRate = parseFloat((activeUsers * 100 / thisDayactiveUsers).toFixed(2))
				}
			}


			//新增用户编号
			const thisDayNewUids = await uniIDUsers.getUserIds(resultLog.appid, platformInfo.code, channelInfo.channel_code, versionInfo.version, {
				$gte: startTime,
				$lte: endTime
			})

			// 新增用户留存率
			newUserRate = 0
			// 新增用户留存数
			newUsers = 0
			if(thisDayNewUids && thisDayNewUids.length > 0) {
				// 新增用户留存数
				const retentionnewUserRes = await this.getCollection(activeUserObj.tableName).where({
					appid: resultLog.appid,
					platform_id: resultLog.platform_id,
					channel_id: resultLog.channel_id,
					version_id: resultLog.version_id,
					uid: {
						$in: thisDayNewUids
					},
					dimension: type,
					create_time: {
						$gte: lastTimeInfo.startTime,
						$lte: lastTimeInfo.endTime
					}
				}).count()

				if (retentionnewUserRes && retentionnewUserRes.total > 0) {
					// 新增用户留存数
					newUsers = retentionnewUserRes.total
					// 新增用户留存率
					newUserRate = parseFloat((newUsers * 100 / thisDayNewUids.length).toFixed(2))
				}
			}

			// 数据更新
			const retentionData = resultLog.retention
			const dataKey = type.substr(0, 1) + '_' + day
			if (!retentionData.active_user) {
				retentionData.active_user = {}
			}
			retentionData.active_user[dataKey] = {
				user_count: activeUsers,
				user_rate: activeUserRate
			}
			if (!retentionData.new_user) {
				retentionData.new_user = {}
			}
			retentionData.new_user[dataKey] = {
				user_count: newUsers,
				user_rate: newUserRate
			}

			if (this.debug) {
				console.log('retentionData', JSON.stringify(retentionData))
			}

			res = await this.update(this.tableName, {
				retention: retentionData
			}, {
				_id: resultLog._id
			})
		}

		if (res && res.updated) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'retention data update failed'
			}
		}
	}


	/**
	 * 清理实时统计的日志
	 * @param {Number} days 实时统计日志保留天数
	 */
	async cleanHourLog(days = 7) {
		if(days === 0) {
			return false;
		}

		days = Math.max(parseInt(days), 1)

		console.log('clean hour logs - day:', days)

		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			dimension: 'hour',
			start_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})

		if (!res.code) {
			console.log('clean hour logs - res:', res)
		}
	}
}
