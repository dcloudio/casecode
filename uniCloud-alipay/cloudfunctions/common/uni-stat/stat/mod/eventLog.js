/**
 * @class EventLog 事件日志模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const StatEvent = require('./event')
const SessionLog = require('./sessionLog')
const ShareLog = require('./shareLog')
const {
	DateTime
} = require('../lib')
module.exports = class EventLog extends BaseMod {
	constructor() {
		super()
		this.tableName = 'event-logs'
		this.sessionLogInfo = []
	}

	/**
	 * 事件日志填充
	 * @param {Object} reportParams 上报参数
	 */
	async fill(reportParams) {
		let params;
		let sessionKey, sessionLogKey;
		let sessionLogInfo;
		const sessionData = []
		const fillParams = []
		const shareParams = []
		const sessionLog = new SessionLog()
		const event = new StatEvent()
		const platform = new Platform()
		const dateTime = new DateTime()
		const channel = new Channel()
		for (const rk in reportParams) {
			params = reportParams[rk]

			//暂存下会话数据，减少读库
			sessionKey = params.ak + params.did + params.p
			if (!this.sessionLogInfo[sessionKey]) {
				// 会话日志
				sessionLogInfo = await sessionLog.getSession(params)
				if (sessionLogInfo.code) {
					return sessionLogInfo
				}
				if (this.debug) {
					console.log('sessionLogInfo', JSON.stringify(sessionLogInfo))
				}
				this.sessionLogInfo[sessionKey] = sessionLogInfo
			} else {
				sessionLogInfo = this.sessionLogInfo[sessionKey]
			}

			// 会话数据
			sessionLogKey = sessionLogInfo.data.sessionLogId.toString()
			if (!sessionData[sessionLogKey]) {
				sessionData[sessionLogKey] = {
					eventCount: sessionLogInfo.data.eventCount + 1,
					addEventCount: 1,
					uid: sessionLogInfo.data.uid,
					createTime: sessionLogInfo.data.createTime
				}
			} else {
				sessionData[sessionLogKey].eventCount++
				sessionData[sessionLogKey].addEventCount++
			}

			// 事件
			const eventInfo = await event.getEventAndCreate(params.ak, params.e_n)

			//事件参数，尝试转为object类型
			let eventParam = ''
			if(params.e_v) {
				try {
					eventParam = JSON.parse(params.e_v)
				} catch(e) {
					eventParam = params.e_v
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
				session_id: sessionLogInfo.data.sessionLogId,
				page_id: sessionLogInfo.data.pageId,
				event_key: eventInfo.event_key,
				param: eventParam,
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
				create_time: dateTime.getTime()
			})
			// 分享数据
			if (eventInfo.event_key === 'share') {
				shareParams.push(params)
			}
		}

		if (fillParams.length === 0) {
			return {
				code: 200,
				msg: 'Invild param'
			}
		}

		if (shareParams.length > 0) {
			const shareLog = new ShareLog()
			await shareLog.fill(shareParams, this.sessionLogInfo)
		}

		const res = await this.insert(this.tableName, fillParams)
		if (res && res.inserted) {
			for (const sid in sessionData) {
				await sessionLog.updateSession(sid, sessionData[sid])
			}
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
	 * 事件日志清理
	 * @param {Number} days 保留天数
	 */
	async clean(days) {
		if(days === 0) {
			return false;
		}

		days = Math.max(parseInt(days), 1)

		console.log('clean event logs - day:', days)

		const dateTime = new DateTime()
		//删除过期数据
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})

		if (!res.code) {
			console.log('clean event log:', res)
		}
		return res
	}
}
