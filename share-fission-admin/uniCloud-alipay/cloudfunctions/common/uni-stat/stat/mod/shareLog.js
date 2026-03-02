/**
 * @class ShareLog 分享日志模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const SessionLog = require('./sessionLog')
const PageDetail = require('./pageDetail')
const {
	DateTime
} = require('../lib')
module.exports = class ShareLog extends BaseMod {
	constructor() {
		super()
		this.tableName = 'share-logs'
	}

	/**
	 * 分析日志填充
	 * @param {Object} reportParams 上报参数
	 * @param {Object} sessionLogData 会话日志数据，此参数传递可减少数据库查询
	 */
	async fill(reportParams, sessionLogData) {
		let params, sessionLogInfo, sessionKey;
		const fillParams = []
		const sessionLog = new SessionLog()
		const platform = new Platform()
		const dateTime = new DateTime()
		const channel = new Channel()
		const pageDetail = new PageDetail()
		for (const rk in reportParams) {
			params = reportParams[rk]

			//暂存下会话数据，减少读库
			sessionKey = params.ak + params.did + params.p
			if (!sessionLogData[sessionKey]) {
				// 会话日志
				sessionLogInfo = await sessionLog.getSession(params)
				if (sessionLogInfo.code) {
					return sessionLogInfo
				}
				if (this.debug) {
					console.log('sessionLogInfo', JSON.stringify(sessionLogInfo))
				}
				sessionLogData[sessionKey] = sessionLogInfo
			} else {
				sessionLogInfo = sessionLogData[sessionKey]
			}

			let pageDetailInfo
			if(this.getConfig('pageDetailStat')) {
				pageDetailInfo = await pageDetail.getPageDetailByPageRules({
					appid: params.ak,
					pageUrl: params.url,
					pageTitle: params.ttpj,
					pageId: sessionLogInfo.data.pageId,
					pageRules: sessionLogInfo.data.pageRules
				})
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
				page_detail_id: (pageDetailInfo && pageDetailInfo._id) || undefined,
				create_time: dateTime.getTime()
			})
		}

		if (fillParams.length === 0) {
			return {
				code: 200,
				msg: 'Invild param'
			}
		}

		const res = await this.insert(this.tableName, fillParams)
		if (res && res.inserted) {
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
	 * 分享日志清理
	 * @param {Number} days 保留天数
	 */
	async clean(days) {
		if(days === 0) {
			return false;
		}
		days = Math.max(parseInt(days), 1)
		console.log('clean share logs - day:', days)
		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})
		if (!res.code) {
			console.log('clean share log:', res)
		}
		return res
	}
}
