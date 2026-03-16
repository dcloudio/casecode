// 引入uniCloud的数据库操作
const db = uniCloud.database()

module.exports = async function () {
	try {
		// 查询批量短信模板的文档数
		const count = await db.collection('batch-sms-template').count()

		// 如果文档数大于0，则设置表名
		if (count.total > 0) {
			this.tableNames = {
				template: 'batch-sms-template', // 模板表名
				task: 'batch-sms-task', // 任务表名
				log: 'batch-sms-result' // 日志表名
			}
		}
	} catch (e) {}
}
