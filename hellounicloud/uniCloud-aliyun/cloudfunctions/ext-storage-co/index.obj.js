// 扩展存储自定义域名

var domain; // 如果只有一个域名，域名可以直接写在这里
module.exports = {
	_before() {
		if (!domain) {
			const provider = uniCloud.getCloudInfos()[0].provider;
			domain = `hello-ext-storage-${provider}.dcloud.net.cn`;
		}
	},
	getUploadFileOptions(data = {}) {
		let {
			cloudPath, // 前端传过来的文件路径
		} = data;
		// 可以在此先判断下此路径是否允许上传等逻辑
		// ...

		// 然后获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu", // 扩展存储供应商
			domain: domain, // 带http协议头的域名地址
		});
		// 最后调用 extStorageManager.getUploadFileOptions
		let uploadFileOptionsRes = extStorageManager.getUploadFileOptions({
			cloudPath: cloudPath,
			allowUpdate: false, // 是否允许覆盖更新，如果返回前端，建议设置false，代表仅新增，不可覆盖
		});
		return uploadFileOptionsRes;
	},
	// 设置文件为私有权限
	async setFilePrivate(data = {}) {
		let {
			fileID
		} = data;
		// 可以在此先判断下此路径是否允许设置为私有权限
		// ...

		// 然后获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu", // 扩展存储供应商
			domain: domain, // 带http协议头的域名地址
		});
		let res = await extStorageManager.updateFileStatus({
			fileID, // 私有文件id
			isPrivate: true, // true 私有 false 公共
		});
		console.log('updateFileStatus: ', res);
		return res;
	},
	// 获取临时下载链接
	async getTempFileURL(data = {}) {
		let {
			fileList
		} = data;
		// 可以在此先判断下是否有权限访问这些私有文件
		// ...

		// 然后获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu", // 扩展存储供应商
			domain: domain, // 带http协议头的域名地址
		});
		let res = extStorageManager.getTempFileURL({
			fileList
		});
		console.log('getTempFileURL: ', res);
		return res;
	},

}