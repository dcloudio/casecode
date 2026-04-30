// 文档教程: https://uniapp.dcloud.net.cn/uniCloud/schema?id=validatefunction
// 扩展校验函数示例
module.exports = function (rule, value, data, callback) {
	// rule  当前规则
	// value 当前规则校验数据
	// data  全部校验数据
	// callback 可选，一般用于自定义 errorMessage，如果执行了callback return 值无效，callback 传入的 message 将替换 errorMessage
	// callback(new Error('message')) 传入 Error 类型时校验不通过
	// callback('message') 传入 String 类型时通过
	//if(uniCloud.httpclient){
		/* 你可以在此连接某个文字过滤api实现文字舆情管理 */
		/* let apiUrl = "https://xxx"
		const res = await uniCloud.httpclient.request(apiUrl, {
		    method: 'GET',
		    data: {},
			dataType: 'text' // 指定返回值为json格式，自动进行parse
		  })
		console.log(res); */
		if (value.indexOf('test') != -1) {
			return '拒绝，内容含有：test'
		}
	//}
}
