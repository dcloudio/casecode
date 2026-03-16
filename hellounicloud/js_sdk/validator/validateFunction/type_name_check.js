// 文档教程: https://uniapp.dcloud.net.cn/uniCloud/schema?id=validatefunction
// 扩展校验函数示例
module.exports = function (rule, value, data, callback) {
	console.log('vvvvv',data);
	if(data.type===0&&data.type_name.length>5){
		callback('姓名不能超过5位数')
	}
	if(data.type===1&&data.type_name.length<4){
		callback('企业名称不能低于4位数')
	}
}
