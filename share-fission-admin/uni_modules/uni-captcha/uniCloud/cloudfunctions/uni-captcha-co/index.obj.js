// 开发文档: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
//导入验证码公共模块
const uniCaptcha = require('uni-captcha')
//获取数据库对象
const db = uniCloud.database();
//获取数据表opendb-verify-codes对象
const verifyCodes = db.collection('opendb-verify-codes')
module.exports = {
	async getImageCaptcha({
		scene,isUniAppX
	}) {
		//获取设备id
		let {
			deviceId,
			platform
		} = this.getClientInfo();
		//根据：设备id、场景值、状态，查找记录是否存在
		let res = await verifyCodes.where({
			scene,
			deviceId,
			state: 0
		}).limit(1).get()
		//如果已存在则调用刷新接口，反之调用插件接口
		let action = res.data.length ? 'refresh' : 'create'
		//执行并返回结果
    let option = {
			scene, //来源客户端传递，表示：使用场景值，用于防止不同功能的验证码混用
			uniPlatform: platform
		}
    if(isUniAppX){
      option.mode = "bmp"
    }
		return await uniCaptcha[action](option)
	}
}