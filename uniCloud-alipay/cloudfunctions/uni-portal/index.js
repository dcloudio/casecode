'use strict';

// 定义一个对象success, 成功时使用
const success = {
	success: true
};

// 定义一个对象fail, 失败时使用
const fail = {
	success: false
};

// 引入createPublishHtml函数
const createPublishHtml = require('./createPublishHtml');

// 导出一个main函数
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event);

	// 初始化res对象
	let res = {};

	// 获取event对象中data或params的值, 并初始化为params
	let params = event.data || event.params;

	// 根据不同的action, 执行不同的操作
	switch (event.action) {
		case 'createPublishHtml': // 如果action是createPublishHtml
			// 执行createPublishHtml函数并将结果赋值给res
			res = createPublishHtml(params.id);
			break;
	}

	//返回数据给客户端
	return res;
};
