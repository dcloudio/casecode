/**
 * @class PageLog 页面日志模型
 */
const BaseMod = require('./base')
const Page = require('./page')
const Platform = require('./platform')
const Channel = require('./channel')
const SessionLog = require('./sessionLog')
const PageDetail = require('./pageDetail')
const {
	DateTime
} = require('../lib')
const {
	parseUrl
} = require('../../shared')
module.exports = class PageLog extends BaseMod {
	constructor() {
		super()
		this.tableName = 'page-logs'
		this.sessionLogInfo = []
	}

	/**
	 * 页面日志数据填充
	 * @param {Object} reportParams 上报参数
	 */
	async fill(reportParams) {
		let params;
		let sessionKey
		let sessionLogKey
		let sessionLogInfo
		let pageKey
		let pageInfo
		let referPageInfo
		const sessionData = []
		const pageData = []
		const fillParams = []
		const sessionLog = new SessionLog()
		const page = new Page()
		const platform = new Platform()
		const dateTime = new DateTime()
		const channel = new Channel()
		const pageDetail = new PageDetail()
		for (const pk in reportParams) {
			params = reportParams[pk]
			if (['3', '4'].includes(params.lt) && !params.url && params.urlref) {
				params.url = params.urlref
			}

			// 页面信息
			pageKey = params.ak + params.url
			if (pageData[pageKey]) {
				pageInfo = pageData[pageKey]
			} else {
				pageInfo = await page.getPageAndCreate(params.ak, params.url, page.getPageTitle(params))
				if (!pageInfo || pageInfo.length === 0) {
					console.log('Not found this page by param:', JSON.stringify(params))
					continue
				}
				pageData[pageKey] = pageInfo
			}

			// 会话日志，暂存下会话数据，减少读库
			sessionKey = params.ak + params.did + params.p
			if (!this.sessionLogInfo[sessionKey]) {
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
				//临时存储减少查询次数
				sessionData[sessionLogKey] = {
					pageCount: sessionLogInfo.data.pageCount + 1,
					addPageCount: 1,
					createTime: sessionLogInfo.data.createTime,
					pageId: pageInfo._id,
					uid: sessionLogInfo.data.uid
				}

				if (this.debug) {
					console.log('add sessionData - ' + sessionLogKey, sessionData)
				}

			} else {
				sessionData[sessionLogKey].pageCount += 1
				sessionData[sessionLogKey].addPageCount += 1
				sessionData[sessionLogKey].pageId = pageInfo._id

				if (this.debug) {
					console.log('update sessionData - ' + sessionLogKey, sessionData)
				}
			}

			// 上级页面信息
			pageKey = params.ak + params.urlref
			if (pageData[pageKey]) {
				referPageInfo = pageData[pageKey]
			} else {
				referPageInfo = await page.getPageAndCreate(params.ak, params.urlref, page.getPageTitle(params))
				if (!referPageInfo || referPageInfo.length === 0) {
					referPageInfo = {_id:''}
				}
				pageData[pageKey] = referPageInfo
			}

			//当前页面url信息
			const urlInfo = parseUrl(params.url)

			//记录页面内容统计数据
			let pageDetailInfo
			let referPageDetailInfo
			if(this.getConfig('pageDetailStat')) {
				pageDetailInfo = await pageDetail.getPageDetailByPageRules({
					appid: params.ak,
					pageUrl: params.url,
					pageTitle: page.getPageTitle(params),
					pageId: pageInfo._id,
					pageRules: pageInfo.page_rules
				})
				if(this.debug) {
					console.log('pageDetailInfo', pageDetailInfo)
				}
				if(params.urlref && referPageInfo) {
					referPageDetailInfo = await pageDetail.getPageDetailByPageRules({
						appid: params.ak,
						pageUrl: params.urlref,
						pageTitle: page.getPageTitle(params),
						pageId: referPageInfo._id,
						pageRules: referPageInfo.page_rules
					})
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
				page_id: pageInfo._id,
				query_string: urlInfo.query,
				//上级页面相关
				previous_page_id: referPageInfo._id,
				previous_page_duration: params.urlref_ts ? parseInt(params.urlref_ts) : 0,
				previous_page_is_entry: referPageInfo._id === sessionLogInfo.data.entryPageId ? 1 : 0,
				page_detail_id: (pageDetailInfo && pageDetailInfo._id) || undefined,
				previous_page_detail_id: (referPageDetailInfo && referPageDetailInfo._id) || undefined,
				create_time: dateTime.getTime()
			})
		}

		if (fillParams.length === 0) {
			console.log('No page params')
			return {
				code: 200,
				msg: 'Invild param'
			}
		}

		//日志数据入库
		const res = await this.insert(this.tableName, fillParams)
		if (res && res.inserted) {
			// 更新会话数据
			const nowTime = dateTime.getTime()
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
	 * 页面日志清理
	 * @param {Number} days 页面日志保留天数
	 */
	async clean(days) {
		if(days === 0) {
			return false;
		}
		days = Math.max(parseInt(days), 1)
		console.log('clean page logs - day:', days)
		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})
		if (!res.code) {
			console.log('clean page log:', res)
		}
		return res
	}
}
