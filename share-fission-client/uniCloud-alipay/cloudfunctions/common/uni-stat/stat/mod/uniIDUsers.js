/**
 * @class UniIDUsers uni-id 用户模型
 */
const BaseMod = require('./base')
module.exports = class UniIDUsers extends BaseMod {

	constructor() {
		super()
		this.tableName = 'uni-id-users'
		this.tablePrefix = false
	}

	/**
	 * 获取用户数
	 * @param {String} appid DCloud-appid
	 * @param {String} platform 平台
	 * @param {String} channel 渠道
	 * @param {String} version 版本
	 * @param {Object} registerTime 注册时间范围 例：{$gte:开始日期时间戳, $lte:结束日期时间戳}
	 * @return {Number}
	 */
	async getUserCount(appid, platform, channel, version, registerTime) {
		if(!appid || !platform) {
			return false
		}
		const condition = this.getCondition(appid, platform, channel, version, registerTime)
		let userCount = 0
		const userCountRes = await this.getCollection(this.tableName).where(condition).count()
		if(userCountRes && userCountRes.total > 0) {
			userCount = userCountRes.total
		}
		return userCount
	}

	/**
	 * 获取用户编号列表
	 * @param {String} appid DCloud-appid
	 * @param {String} platform 平台
	 * @param {String} channel 渠道
	 * @param {String} version 版本
	 * @param {Object} registerTime 注册时间范围 例：{$gte:开始日期时间戳, $lte:结束日期时间戳}
	 * @return {Array}
	 */
	async getUserIds(appid, platform, channel, version, registerTime) {
		if(!appid || !platform) {
			return false
		}
		const condition = this.getCondition(appid, platform, channel, version, registerTime)
		let uids = []
		const uidsRes = await this.selectAll(this.tableName, condition, {
			_id: 1
		})

		for (const u in uidsRes.data) {
			uids.push(uidsRes.data[u]._id)
		}

		return uids
	}

	/**
	 * 获取查询条件
	 * @param {String} appid DCloud-appid
	 * @param {String} platform 平台
	 * @param {String} channel 渠道
	 * @param {String} version 版本
	 * @param {Object} registerTime 注册时间范围 例：{$gte:开始日期时间戳, $lte:结束日期时间戳}
	 */
	getCondition(appid, platform, channel, version, registerTime) {

		let condition = {
			'register_env.appid': appid,//DCloud appid
			'register_env.uni_platform': platform,//平台
			'register_env.channel': channel ? channel : '1001', //渠道或场景值
			'register_env.app_version' : version //应用版本区分
		}

		//原生应用平台
		if(['android', 'ios'].includes(platform)) {
			condition['register_env.uni_platform'] = 'app'//systemInfo中uniPlatform字段android和ios都用app表示，所以此处查询需要用osName区分一下
			condition['register_env.os_name'] = platform //系统
		}

		//兼容vue2
		if(channel === '1001') {
			condition['register_env.channel'] = {$in:['', '1001']}
		}

		//注册时间
		if(registerTime) {
			condition.register_date = registerTime
		}

		return condition
	}

}
