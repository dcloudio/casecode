/**
 * @class SessionLog 基础会话日志模型
 */
const BaseMod = require('./base')
const Page = require('./page')
const Platform = require('./platform')
const Channel = require('./channel')
const UserSessionLog = require('./userSessionLog')
const Device = require('./device')
const {
	DateTime
} = require('../lib')
module.exports = class SessionLog extends BaseMod {
	constructor() {
		super()
		this.tableName = 'session-logs'
	}


	/**
	 * 会话日志批量填充
	 * @param {Object} reportParams 上报参数
	 */
	async batchFill(reportParams) {
		let params, pageInfo, nowTime, firstVistTime, lastVistTime;
		const fillParams = []

		const page = new Page()
		const platform = new Platform()
		const dateTime = new DateTime()
		const channel = new Channel()
		const device = new Device()
		let res
		for (const pk in reportParams) {
			params = reportParams[pk]
			res = await this.fill(params)
			if (res.code) {
				console.error(res.msg)
			} else {
				//添加设备信息
				await device.setDevice(params)
			}
		}
		return res
	}

	/**
	 * 会话日志填充
	 * @param {Object} params 上报参数
	 */
	async fill(params) {
		// 应用信息
		if (!params.ak) {
			return {
				code: 200,
				msg: 'Parameter "ak" not found'
			}
		}

		// 平台信息
		if (!params.ut) {
			return {
				code: 200,
				msg: 'Parameter "ut" not found'
			}
		}

		// 设备信息
		if (!params.did) {
			return {
				code: 200,
				msg: 'Parameter "did" not found'
			}
		}

		// 页面信息
		const page = new Page()
		const pageInfo = await page.getPageAndCreate(params.ak, params.url, page.getPageTitle(params))
		if (!pageInfo || pageInfo.length === 0) {
			return {
				code: 300,
				msg: 'Not found this entry page'
			}
		}
		if (this.debug) {
			console.log('pageInfo', JSON.stringify(pageInfo))
		}
		const platform = new Platform()
		const dateTime = new DateTime()
		const channel = new Channel()
		const nowTime = dateTime.getTime()
		const firstVistTime = params.fvts ? dateTime.strToTime(params.fvts) : nowTime
		const lastVistTime = (params.lvts && params.lvts !== '0') ? dateTime.strToTime(params.lvts) : 0

		const fillParams = {
			appid: params.ak,
			version: params.v ? params.v : '',
			platform: platform.getPlatformCode(params.ut, params.p),
			channel: channel.getChannelCode(params),
			type: params.cst ? parseInt(params.cst) : 0,
			// 访问设备
			device_id: params.did,
			//是否为首次访问，判断标准：最后一次访问时间为0
			is_first_visit: (params.lt === '1' && !lastVistTime) ? 1 : 0,
			first_visit_time: firstVistTime,
			last_visit_time: nowTime,
			visit_count: params.tvc ? parseInt(params.tvc) : 1,
			// 用户相关
			last_visit_user_id: params.uid ? params.uid : '',
			// 页面相关
			entry_page_id: pageInfo._id,
			exit_page_id: pageInfo._id,
			page_count: 0,
			event_count: 0,
			duration: 1,
			// 版本
			sdk_version: params.mpsdk ? params.mpsdk : '',
			platform_version: params.mpv ? params.mpv : '',
			// 设备相关
			device_os_name: params.on ? params.on : platform.getOsName(params.p),
			device_os_version: params.sv ? params.sv : '',
			device_vendor: params.brand ? params.brand : '',
			device_model: params.md ? params.md : '',
			device_language: params.lang ? params.lang : '',
			device_pixel_ratio: params.pr ? params.pr : '',
			device_window_width: params.ww ? params.ww : '',
			device_window_height: params.wh ? params.wh : '',
			device_screen_width: params.sw ? params.sw : '',
			device_screen_height: params.sh ? params.sh : '',
			// 地区相关
			location_ip: params.ip ? params.ip : '',
			location_latitude: params.lat ? parseFloat(params.lat) : -1,
			location_longitude: params.lng ? parseFloat(params.lng) : -1,
			location_country: params.cn ? params.cn : '',
			location_province: params.pn ? params.pn : '',
			location_city: params.ct ? params.ct : '',
			is_finish: 0,
			create_time: nowTime
		}

		if(this.isHaveOldDeviceId(params)) {
			fillParams.old_device_id = params.odid
		}

		const res = await this.insert(this.tableName, fillParams)

		if (res && res.id) {

			//填充用户的会话日志
			if (params.uid) {
				await new UserSessionLog().fill({
					...params,
					page_id: pageInfo._id,
					sid: res.id
				})
			}

			return {
				code: 0,
				msg: 'success',
				data: {
					pageId: pageInfo._id,
					pageRules: pageInfo.page_rules,
					sessionLogId: res.id,
					entryPageId: fillParams.entry_page_id,
					eventCount: fillParams.event_count,
					startTime: fillParams.first_visit_time,
					createTime: fillParams.create_time,
					pageCount: fillParams.page_count,
					uid: fillParams.last_visit_user_id
				}
			}
		} else {
			return {
				code: 500,
				msg: 'Session log filled error'
			}
		}
	}

	/**
	 * 判断是否包含老版本sdk生成的device_id, 此功能用于处理前端sdk升级后 device_id 发生变化导致日活、留存数据不准确的问题
	 * @param {Object} params
	 */
	isHaveOldDeviceId(params) {
		if(params.odid && params.odid !== params.did && params.odid !== 'YluY92BA6nJ6NfixI77sFQ%3D%3D&ie=1') {
			console.log('params.odid', params.odid)
			return true
		}
		return false
	}


	/**
	 * 获取会话
	 * @param {Object} params 上报参数
	 */
	async getSession(params) {
		// 页面信息
		const page = new Page()
		const pageInfo = await page.getPageAndCreate(params.ak, params.url, page.getPageTitle(params))
		if (!pageInfo || pageInfo.length === 0) {
			return {
				code: 300,
				msg: 'Not found this entry page'
			}
		}

		const platformObj = new Platform()
		const platform = platformObj.getPlatformCode(params.ut, params.p)
		// 查询日志
		const sessionLogInfo = await this.getCollection(this.tableName).where({
			appid: params.ak,
			platform: platform,
			device_id: params.did,
			is_finish: 0
		}).orderBy('create_time', 'desc').limit(1).get()

		if (sessionLogInfo.data.length > 0) {
			const userSessionLog = new UserSessionLog()
			const sessionLogInfoData = sessionLogInfo.data[0]
			// 最后一次访问时间距现在超过半小时算上次会话已结束并生成一次新的会话
			let sessionExpireTime = this.getConfig('sessionExpireTime')
			sessionExpireTime = sessionExpireTime ? sessionExpireTime : 1800
			const sessionTime = new DateTime().getTime() - sessionLogInfoData.last_visit_time
			if (sessionTime >= sessionExpireTime * 1000) {
				if (this.debug) {
					console.log('session log time expired', sessionTime)
				}
				await this.update(this.tableName, {
					is_finish: 1
				}, {
					appid: params.ak,
					platform: platform,
					device_id: params.did,
					is_finish: 0
				})
				//关闭用户会话
				await userSessionLog.closeUserSession()

				return await this.fill(params)
			} else {
				//如果当前会话切换了用户则生成新的用户会话
				if (params.uid != sessionLogInfoData.last_visit_user_id) {
					await userSessionLog.checkUserSession({
						...params,
						page_id: pageInfo._id,
						sid: sessionLogInfoData._id,
						last_visit_user_id: sessionLogInfoData.last_visit_user_id
					})

					await this.update(this.tableName, {
						last_visit_user_id: params.uid ? params.uid : ''
					}, {
						_id: sessionLogInfoData._id
					})
				}

				return {
					code: 0,
					msg: 'success',
					data: {
						pageId: pageInfo._id,
						pageRules: pageInfo.page_rules,
						sessionLogId: sessionLogInfoData._id,
						entryPageId: sessionLogInfoData.entry_page_id,
						eventCount: sessionLogInfoData.event_count,
						startTime: sessionLogInfoData.first_visit_time,
						createTime: sessionLogInfoData.create_time,
						pageCount: sessionLogInfoData.page_count,
						uid: sessionLogInfoData.last_visit_user_id
					}
				}
			}
		} else {
			return await this.fill(params)
		}
	}

	/**
	 * 更新会话信息
	 * @param {String} sid 会话编号
	 * @param {Object} data 更新数据
	 */
	async updateSession(sid, data) {
		const nowTime = new DateTime().getTime()
		const accessTime = nowTime - data.createTime
		const accessSenconds = accessTime > 1000 ? parseInt(accessTime / 1000) : 1

		const updateData = {
			last_visit_time: nowTime,
			duration: accessSenconds,
		}
		//访问页面数量
		if (data.addPageCount) {
			updateData.page_count = data.pageCount
		}
		//最终访问的页面编号
		if (data.pageId) {
			updateData.exit_page_id = data.pageId
		}
		//产生事件次数
		if (data.eventCount) {
			updateData.event_count = data.eventCount
		}

		if (this.debug) {
			console.log('update session log by sid-' + sid, updateData)
		}

		//更新会话
		await this.update(this.tableName, updateData, {
			_id: sid
		})

		//更新用户会话
		if (data.uid) {
			data.nowTime = nowTime
			await new UserSessionLog().updateUserSession(sid, data)
		}

		return true
	}

	/**
	 * 清理日志数据
	 * @param {Number} days 保留天数, 留存统计需要计算30天后留存率，因此至少应保留31天的日志数据
	 */
	async clean(days) {
		if(days === 0) {
			return false;
		}
		days = Math.max(parseInt(days), 1)
		console.log('clean session logs - day:', days)
		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})
		if (!res.code) {
			console.log('clean session log:', res)
		}
		return res
	}
}
