/**
 * @class StatEvent 事件统计模型
 */
const BaseMod = require('./base')
const {
	DateTime
} = require('../lib')
module.exports = class StatEvent extends BaseMod {
	constructor() {
		super()
		this.tableName = 'events'
		this.defaultEvent = this.getConfig('event') || {
			login: '登录',
			register: '注册',
			click: '点击',
			share: '分享',
			pay_success: '支付成功',
			pay_fail: '支付失败'
		}
	}

	/**
	 * 获取事件信息
	 * @param {String} appid: DCloud appid
	 * @param {String} eventKey 事件键值
	 */
	async getEvent(appid, eventKey) {
		const cacheKey = 'uni-stat-event-' + appid + '-' + eventKey
		let eventData = await this.getCache(cacheKey)
		if (!eventData) {
			const eventInfo = await this.getCollection(this.tableName).where({
				appid: appid,
				event_key: eventKey
			}).get()
			eventData = []
			if (eventInfo.data.length > 0) {
				eventData = eventInfo.data[0]
				await this.setCache(cacheKey, eventData)
			}
		}
		return eventData
	}


	/**
	 * 获取事件信息不存在则创建
	 * @param {String} appid: DCloud appid
	 * @param {String} eventKey 事件键值
	 */
	async getEventAndCreate(appid, eventKey) {
		const eventInfo = await this.getEvent(appid, eventKey)
		if (eventInfo.length === 0) {
			const thisTime = new DateTime().getTime()
			const insertParam = {
				appid: appid,
				event_key: eventKey,
				event_name: this.defaultEvent[eventKey] ? this.defaultEvent[eventKey] : '',
				create_time: thisTime,
				update_time: thisTime
			}
			const res = await this.insert(this.tableName, insertParam)

			if (res && res.id) {
				return Object.assign(insertParam, {
					_id: res.id
				})
			}
		}

		return eventInfo
	}
}
