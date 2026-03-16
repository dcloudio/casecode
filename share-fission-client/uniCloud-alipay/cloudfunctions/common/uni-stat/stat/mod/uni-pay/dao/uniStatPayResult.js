/**
 * 数据库操作
 */
const BaseMod = require('../../base');
const dbName = require("./config");

class Dao extends BaseMod {

	constructor() {
		super();
		this.tablePrefix = false; // 不使用表前缀
	}

	// 获取符合条件的文档列表
	async list(data) {
		let {
			whereJson,
		} = data;
		const dbRes = await this.getCollection(dbName.uniStatPayResult).where(whereJson).get();
		return dbRes.data;
	}

	// 删除符合条件的文档
	async del(data) {
		let {
			whereJson
		} = data;
		const dbRes = await this.delete(dbName.uniStatPayResult, whereJson);
		return dbRes.deleted;
	}

	// 批量插入文档
	async adds(saveList) {
		return await this.batchInsert(dbName.uniStatPayResult, saveList);
	}
}

module.exports = new Dao();
