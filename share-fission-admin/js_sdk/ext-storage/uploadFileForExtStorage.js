/**
 * 设置 uniCloud.uploadFile 默认上传到扩展存储
 * @param {String} provider 云储存供应商
 * 	@value unicloud				内置存储
 * 	@value extStorage 		扩展存储
 * @param {String} domain 自定义域名，仅扩展存储有效
 * @param {Boolean} fileID2fileURL 是否将fileID转为fileURL
 * @param {Function} uploadFileOptions 获取上传参数的函数，仅扩展存储有效
 */
function init(options = {}) {
	let {
		provider: defaultProvider,
	} = options;
	let originalDefaultProvider = defaultProvider;
	let extStorage = new ExtStorage(options);

	const uploadFile = uniCloud.uploadFile;
	uniCloud.uploadFile = (...e) => {
		let options = e[0] || {};
		let {
			provider = defaultProvider
		} = options;
		if (provider === "extStorage") {
			return extStorage.uploadFile(...e);
		} else {
			return uploadFile(...e);
		}
	}

	const getTempFileURL = uniCloud.getTempFileURL;
	uniCloud.getTempFileURL = (...e) => {
		let options = e[0] || {};
		let {
			provider = defaultProvider
		} = options;
		if (provider === "extStorage") {
			return extStorage.getTempFileURL(...e);
		} else {
			return getTempFileURL(...e);
		}
	}

	const deleteFile = uniCloud.deleteFile;
	uniCloud.deleteFile = (...e) => {
		let options = e[0] || {};
		let {
			provider = defaultProvider
		} = options;
		if (provider === "extStorage") {
			return extStorage.deleteFile(...e);
		} else {
			return deleteFile(...e);
		}
	}

	uniCloud.setCloudStorage = (data={}) => {
		let {
			provider,
			domain,
			fileID2fileURL,
		} = data;
		if (provider === null) {
			defaultProvider = originalDefaultProvider;
		} else if (provider) {
			defaultProvider = provider;
		}
		if (domain) extStorage.domain = domain;
		if (fileID2fileURL) extStorage.fileID2fileURL = fileID2fileURL;
	}

}

export default {
	init
}

class ExtStorage {
	constructor(data = {}) {
		let {
			uploadFileOptions,
			domain,
			fileID2fileURL
		} = data;
		this.uploadFileOptions = uploadFileOptions;
		this.domain = domain;
		this.fileID2fileURL = fileID2fileURL;
	}

	// 上传文件
	uploadFile(options) {
		let {
			filePath,
			cloudPath,
		} = options;
		const promiseRes = new Promise(async (resolve, reject) => {
			try {
				const uploadFileOptionsRes = await this.uploadFileOptions({
					cloudPath,
					domain: this.domain
				});
				const uploadTask = uni.uploadFile({
					...uploadFileOptionsRes.uploadFileOptions, // 上传文件所需参数
					filePath, // 本地文件路径
					success: (uploadFileRes) => {
						if (uploadFileRes.statusCode !== 200) {
							const err = uploadFileRes;
							if (typeof options.fail === "function") options.fail(err);
							reject(err);
						} else {
							const res = {
								cloudPath: uploadFileOptionsRes.cloudPath, // 文件云端路径
								fileID: uploadFileOptionsRes.fileID, // 文件ID
								fileURL: uploadFileOptionsRes.fileURL, // 文件URL（如果是私有权限，则此URL是无法直接访问的）
							};
							if (this.fileID2fileURL) {
								res.fileID = `https://${this.domain}/${res.cloudPath}`;
							}
							if (typeof options.success === "function") options.success(res);
							resolve(res);
						}
					},
					fail: (err) => {
						if (typeof options.fail === "function") options.fail(err);
						reject(err);
					},
					complete: () => {
						if (typeof options.complete === "function") options.complete();
					}
				});
				// 监听上传进度
				uploadTask.onProgressUpdate((progressEvent) => {
					if (typeof options.onUploadProgress === "function") {
						const total = progressEvent.totalBytesExpectedToSend;
						const loaded = progressEvent.totalBytesSent;
						const progress = Math.round(loaded * 100 / total);
						options.onUploadProgress({
							total,
							loaded,
							progress
						});
					}
				});
			} catch (err) {
				if (typeof options.fail === "function") options.fail(err);
				reject(err);
				if (typeof options.complete === "function") options.complete();
			}
		});
		promiseRes.catch(() => {

		});
		return promiseRes;
	}

	// 获取临时文件下载地址
	getTempFileURL(options = {}) {
		let {
			fileList
		} = options;

		return new Promise((resolve, reject) => {
			let res = {
				fileList: fileList.map((item, index) => {
					let cloudPath = getCloudPath(item);
					return {
						fileID: item,
						tempFileURL: `https://${this.domain}/${cloudPath}`
					}
				})
			}
			if (typeof options.success === "function") options.success(res);
			resolve(res);
			if (typeof options.complete === "function") options.complete();
		});
	}

	// 删除文件
	deleteFile(options = {}) {
		// 扩展存储不允许前端删除文件（故此处直接返回）
		return new Promise((resolve, reject) => {
			let res = {
				fileList: []
			};
			if (typeof options.success === "function") options.success(res);
			resolve(res);
			if (typeof options.complete === "function") options.complete();
		});
	}

}

function getCloudPath(cloudPath) {
	const qiniuPrefix = 'qiniu://';
	if (cloudPath.indexOf(qiniuPrefix) === 0) {
		cloudPath = cloudPath.substring(qiniuPrefix.length);
	} else if (cloudPath.indexOf('http://') === 0 || cloudPath.indexOf('https://') === 0) {
		let startIndex = cloudPath.indexOf('://') + 3;
		startIndex = cloudPath.indexOf('/', startIndex);
		let endIndex = cloudPath.indexOf('?') === -1 ? cloudPath.length : cloudPath.indexOf('?');
		endIndex = cloudPath.indexOf('#') !== -1 && cloudPath.indexOf('#') < endIndex ? cloudPath.indexOf('#') : endIndex;
		cloudPath = cloudPath.substring(startIndex + 1, endIndex);
	}
	return cloudPath
}
