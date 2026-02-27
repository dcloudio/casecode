// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database()
const commentDb = db.collection('opendb-notice-comment')
module.exports = {
	before: async (state, event) => {
		if(state.auth.role.includes('USER')){
			let commentId = state.command.getParam({name:"doc",index:0})[0];
			let res = await commentDb.doc(commentId).update({state:0})
			console.log('action执行了更新当前编辑记录的state',res);
		}else{
			// console.log('是审核员');
		}
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		return result
	}
}