/**
 * @class Version 应用版本模型
 */
const BaseMod = require('./base')
const {
	DateTime
} = require('../lib')
module.exports = class Setting extends BaseMod {
	constructor() {
		super()
		this.tableName = 'opendb-tempdata'
		this.tablePrefix = false
		this.settingKey = "uni-stat-setting"
	}

	/**
	 * 获取统计云端配置
	 */
	async getSetting() {
		const res = await this.getCollection(this.tableName).doc(this.settingKey).get();
		if (res.data && res.data[0] && res.data[0].value) {
			return res.data[0].value;
		} else {
			return {
				mode: "open",
				day: 7
			};
		}
	}
	/**
	 * 检测N天内是否有设备访问记录，如果有，则返回true，否则返回false
	 */
	async checkAutoRun(obj = {}) {
		let {
			day = 7
		} = obj;
		const _ = this.dbCmd;
		let nowTime = Date.now();
		const res = await this.getCollection("uni-stat-session-logs").where({
			create_time: _.gte(nowTime - 1000 * 3600 * 24 * day)
		}).count();
		return res.total > 0 ? true : false;
	}
}
