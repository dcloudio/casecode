'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)

	let res = {};
	let params = event.data || event.params;

	switch (event.action) {
		case 'deleteFile':
			res = await uniCloud.deleteFile({
				fileList: params.fileList
			})
			break;
	}

	//返回数据给客户端
	return res
};
