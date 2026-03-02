/**
 * @class UserSessionLog 用户会话日志模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const {
	DateTime
} = require('../lib')
module.exports = class UserSessionLog extends BaseMod {
	constructor() {
		super()
		this.tableName = 'user-session-logs'
	}

	/**
	 * 用户会话日志数据填充
	 * @param {Object} params 上报参数
	 */
	async fill(params) {

		if (!params.sid) {
			return {
				code: 200,
				msg: 'Not found session log'
			}
		}

		if (!params.uid) {
			return {
				code: 200,
				msg: 'Parameter "uid" not found'
			}
		}

		const dateTime = new DateTime()
		const platform = new Platform()
		const channel = new Channel()

		//获取当前页面信息
		if (!params.page_id) {
			const pageInfo = await page.getPageAndCreate(params.ak, params.url, params.ttpj)
			if (!pageInfo || pageInfo.length === 0) {
				return {
					code: 300,
					msg: 'Not found this entry page'
				}
			}
			params.page_id = pageInfo._id
		}

		const nowTime = dateTime.getTime()

		const fillParams = {
			appid: params.ak,
			version: params.v ? params.v : '',
			platform: platform.getPlatformCode(params.ut, params.p),
			channel: channel.getChannelCode(params),
			session_id: params.sid,
			uid: params.uid,
			last_visit_time: nowTime,
			entry_page_id: params.page_id,
			exit_page_id: params.page_id,
			page_count: 0,
			event_count: 0,
			duration: 1,
			is_finish: 0,
			create_time: nowTime,
		}

		const res = await this.insert(this.tableName, fillParams)

		if (res && res.id) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'User session log filled error'
			}
		}
	}

	/**
	 * 检测用户会话是否有变化，并更新
	 * @param {Object} params 校验参数 - sid:基础会话编号 uid:用户编号 last_visit_user_id:基础会话中最近一个访问用户的编号
	 */
	async checkUserSession(params) {
		if (!params.sid) {
			return {
				code: 200,
				msg: 'Not found session log'
			}
		}

		if (!params.uid) {
			//用户已退出会话
			if (params.last_visit_user_id) {
				if (this.debug) {
					console.log('user "' + params.last_visit_user_id + '" is exit session :', params.sid)
				}
				await this.closeUserSession(params.sid)
			}
		} else {
			//添加用户日志
			if (!params.last_visit_user_id) {
				await this.fill(params)
			}
			//用户已切换
			else if (params.uid != params.last_visit_user_id) {
				if (this.debug) {
					console.log('user "' + params.last_visit_user_id + '" change to "' + params.uid +
						'" in the session :', params.sid)
				}
				//关闭原会话生成新用户对话
				await this.closeUserSession(params.sid)
				await this.fill(params)
			}
		}
		return {
			code: 0,
			msg: 'success'
		}
	}



	/**
	 * 关闭用户会话
	 * @param {String} sid 基础会话编号
	 */
	async closeUserSession(sid) {
		if (this.debug) {
			console.log('close user session log by sid:', sid)
		}
		return await this.update(this.tableName, {
			is_finish: 1
		}, {
			session_id: sid,
			is_finish: 0
		})
	}


	/**
	 * 更新会话信息
	 * @param {String} sid 基础会话编号
	 * @param {Object} data 更新数据
	 */
	async updateUserSession(sid, data) {

		const userSession = await this.getCollection(this.tableName).where({
			session_id: sid,
			uid: data.uid,
			is_finish: 0
		}).orderBy('create_time', 'desc').limit(1).get()

		if (userSession.data.length === 0) {
			console.log('Not found the user session', {
				session_id: sid,
				uid: data.uid,
				is_finish: 0
			})
			return {
				code: 300,
				msg: 'Not found the user session'
			}
		}

		let nowTime = data.nowTime ? data.nowTime : new DateTime().getTime()
		const accessTime = nowTime - userSession.data[0].create_time
		const accessSenconds = accessTime > 1000 ? parseInt(accessTime / 1000) : 1

		const updateData = {
			last_visit_time: nowTime,
			duration: accessSenconds,
		}

		//访问页面数量
		if (data.addPageCount) {
			updateData.page_count = userSession.data[0].page_count + data.addPageCount
		}
		//最终访问的页面编号
		if (data.pageId) {
			updateData.exit_page_id = data.pageId
		}
		//产生事件次数
		if (data.eventCount) {
			updateData.event_count = userSession.data[0].event_count + data.addEventCount
		}

		if (this.debug) {
			console.log('update user session log by sid-' + sid, updateData)
		}

		await this.update(this.tableName, updateData, {
			_id: userSession.data[0]._id
		})

		return {
			code: 0,
			msg: 'success'
		}
	}

	/**
	 * 清理用户会话日志数据
	 * @param {Object} days 保留天数, 留存统计需要计算30天后留存率，因此至少应保留31天的日志数据
	 */
	async clean(days = 31) {
		if(days === 0) {
			return false;
		}
		days = Math.max(parseInt(days), 1)
		console.log('clean user session logs - day:', days)
		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})
		if (!res.code) {
			console.log('clean user session log:', res)
		}
		return res
	}

}
