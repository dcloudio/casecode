// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event,result) => {
		state.changeState = false
		console.log(state);
		if(
			!state.auth.role.includes('AUDITOR')
		){
			//1.首先是非用户名审核员操作
			let {data:[{username}]} = await uniCloud.database()
						.collection('permission-test')
						.where({"uid":state.auth.uid})
						.get()
					let [{username:nowUsername}] = state.command.getParam({name:"update",index:0});
		
			//2.更新了用户姓名
			if(nowUsername != username){
				let res = await uniCloud.database()
					.collection('permission-test')
					.where({"uid":state.auth.uid})
					.update({
						"state":0
					})
					console.log(res);
					console.log('result',result);
					state.changeState = true
			}
		}
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}else{
			result.changeState = state.changeState
		}
		return result
	}
}
