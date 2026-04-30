const uniStat = require('uni-stat')
const uniID = require('uni-id-common')
module.exports = {
	report: async function (params = {}) {
		//客户端信息
		const clientInfo = this.getClientInfo()
		//云服务信息
		const cloudInfo = this.getCloudInfo()
		//token信息
		const token = this.getUniIdToken()
		//当前登录用户id
		let uid
		if(token) {
			const tokenRes  = await uniID.createInstance({
				clientInfo
			}).checkToken(token)
			
			if(tokenRes.uid) {
				uid = tokenRes.uid
			}
		}
		//数据上报
		return await uniStat.initReceiver().report(params, {
			...clientInfo,
			...cloudInfo,
			uid
		})
	}
}
