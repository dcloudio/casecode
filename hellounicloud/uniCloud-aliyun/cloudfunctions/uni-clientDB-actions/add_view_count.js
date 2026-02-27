// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database()
const $cmd = db.command
module.exports = {
	before: async (state, event) => {
		
	},
	after: async (state, event, error, result) => {
		await db.collection('opendb-notice').update({
			view_count:$cmd.inc(1)
		})
		if (error) {
			throw error
		}
		return result
	}
}
