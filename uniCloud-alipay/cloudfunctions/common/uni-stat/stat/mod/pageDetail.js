/**
 * @class Page 页面模型
 */
const BaseMod = require('./base')
const {
	parseUrl
} = require('../../shared')
const {
	DateTime
} = require('../lib')
module.exports = class PageDetail extends BaseMod {
	constructor() {
		super()
		this.tableName = 'page-details'
	}

	/**
	 * 获取页面详情信息
	 * @param {String} appid Dcloud-appid
	 * @param {String} pageId 页面id
	 * @param {String} url 页面地址
	 * @return {Object} pageDetailInfo 页面详情信息
	 */
	async getPageDetail({
		appid,
		pageId,
		url
	} = {}) {
		const cacheKey = this.getCacheKeyByParams({
			module: 'pageDetail',
			appid,
			pageId,
			url
		})
		let pageDetailData = await this.getCache(cacheKey)
		if (!pageDetailData) {
			const pageDetailInfo = await this.getCollection(this.tableName).where({
				appid,
				page_id: pageId,
				page_link: url
			}).limit(1).get()
			pageDetailData = []
			if (pageDetailInfo.data.length > 0) {
				pageDetailData = pageDetailInfo.data[0]
				await this.setCache(cacheKey, pageDetailData)
			}
		}
		return pageDetailData
	}

	/**
	 * 获取页面详情信息不存在则创建
	 * @param {String} appid Dcloud-appid
	 * @param {String} pageId 页面id
	 * @param {String} url 页面详情匹配地址
	 * @param {String} title 页面标题
	 * @return {Object} pageDetailInfo 页面详情信息
	 */
	async getPageDetailAndCreate({
		appid,
		pageId,
		url,
		title
	} = {}) {
		const pageDetailInfo = await this.getPageDetail({
			appid,
			pageId,
			url
		})
		//页面不存在则创建
		if (pageDetailInfo.length === 0) {
			const thisTime = new DateTime().getTime()
			const insertParam = {
				appid: appid,
				page_id: pageId,
				page_link: url,
				page_title: title,
				create_time: thisTime,
				update_time: thisTime
			}
			const res = await this.insert(this.tableName, insertParam)
			if (res && res.id) {
				return Object.assign(insertParam, {
					_id: res.id
				})
			}
		} else if (!pageDetailInfo.page_title && title) {
			const cacheKey = this.getCacheKeyByParams({
				module: 'pageDetail',
				appid,
				pageId,
				url
			})
			await this.clearCache(cacheKey)
			await this.update(this.tableName, {
				page_title: title
			}, {
				_id: pageDetailInfo._id
			})
		}
		return pageDetailInfo
	}


	/**
	 * 通过页面规则获取页面详情信息
	 * @param {String} appid DCloud appid
	 * @param {String} pageUrl 页面链接
	 * @param {String} pageTitle 页面标题
	 * @param {String} pageId 页面编号
	 * @param {Array} pageRules 页面规则
	 * @return {Object} pageDetailInfo 页面详情信息
	 */
	async getPageDetailByPageRules({
		appid,
		pageUrl,
		pageTitle,
		pageId,
		pageRules
	} = {}) {
		const pageDetailUrl = this.getPageDetailUrlByRules(pageUrl, pageRules)
		if(this.debug) {
			console.log('pageDetailUrl', pageDetailUrl, pageUrl)
		}
		if (!pageDetailUrl) {
			return false
		}
		return await this.getPageDetailAndCreate({
			appid,
			pageId,
			url: pageDetailUrl,
			title: pageTitle
		})
	}

	/**
	 * 通过页面规则获取页面详情链接
	 * @param {Object} url 原始页面地址
	 * @param {Object} pageRules 页面规则
	 * @return {String} pageDetailUrl 页面详情链接
	 */
	getPageDetailUrlByRules(url, pageRules) {
		if (!url || !pageRules) {
			return false
		}
		let urlInfo = parseUrl(url)
		if (!urlInfo.query) {
			return false
		}
		const urlParams = urlInfo.query.split('&').reduce((res, cur) => {
			const arr = cur.split('=')
			return Object.assign({
				[arr[0]]: arr[1]
			}, res)
		}, {})
		let isMatch
		let matchParams
		let matchRulePrams
		pageRules.forEach((item) => {
			isMatch = true
			matchParams = {}
			for (let rule of item) {
				if (Object.keys(urlParams).indexOf(rule) < 0) {
					isMatch = false
					break
				}
				matchParams[rule] = urlParams[rule]
			}
			if (isMatch) {
				const matchRuleKeys = Object.keys(matchParams)
				matchRuleKeys.sort()
				matchRulePrams = {}
				for(let key of matchRuleKeys) {
					matchRulePrams[key] = matchParams[key]
				}
			}
		})
		if (!matchRulePrams) {
			return false
		}
		const matchQuery = Object.keys(matchRulePrams).map((key) => key + '=' + matchRulePrams[key]).join('&')
		return urlInfo.path + '?' + matchQuery
	}
}
