const provider = "qiniu";
module.exports = {
	_before: function() {

	},
	getUploadFileOptions(data = {}) {
		let {
			cloudPath,
			domain,
		} = data;
		// 可以在此先判断下此路径是否允许上传等逻辑
		// ...

		// 然后获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider, // 扩展存储供应商
			domain, // 自定义域名
		});
		// 最后调用 extStorageManager.getUploadFileOptions
		let uploadFileOptionsRes = extStorageManager.getUploadFileOptions({
			cloudPath: `public/${cloudPath}`, // 强制在public目录下
			allowUpdate: false, // 是否允许覆盖更新，如果返回前端，建议设置false，代表仅新增，不可覆盖
		});
		return uploadFileOptionsRes;
	},
	// // 下载文件
	// async downloadFile(data = {}) {
	// 	let {
	// 		fileID,
	// 		domain,
	// 	} = data;
	// 	const extStorageManager = uniCloud.getExtStorageManager({
	// 		provider, // 扩展存储供应商
	// 		domain, // 自定义域名
	// 	});
	// 	let res = extStorageManager.downloadFile({
	// 		fileID
	// 	});
	// 	return res;
	// },
	// // 删除文件
	// async deleteFile(data = {}) {
	// 	let {
	// 		fileList,
	// 		domain
	// 	} = data;
	// 	const extStorageManager = uniCloud.getExtStorageManager({
	// 		provider, // 扩展存储供应商
	// 		domain, // 自定义域名
	// 	});
	// 	let res = await extStorageManager.deleteFile({
	// 		fileList
	// 	});
	// 	console.log('deleteFile: ', res);
	// 	return res;
	// },

}
