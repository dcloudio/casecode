<template>
	<view class="content">
		<view class="title">直接上传文件到扩展存储-七牛云</view>
		<view class="tips">
			<text>
				各个小程序平台运行时，网络相关的 API 在使用前需要配置域名白名单。
			</text>
			<j-link text="参考" url="https://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"></j-link>
		</view>
		<view class="btn-list">
			<button type="primary" plain @click="chooseImage(false)">选择文件“后”上传</button>
			<text class="tips">先调用uni.chooseImage选完文件/图片/视频后用uni.uploadFile方法上传</text>
			<button type="primary" plain @click="chooseImage(true)">上传并设为私有文件</button>
			<text class="tips">上传完成后设置为私有文件</text>
			<button type="primary" plain @click="getTempFileURL()" v-if="privateFileID">获取私有文件临时下载链接</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				privateFileID: ""
			}
		},
		mounted() {},
		methods: {
			chooseImage(isPrivate) {
				new Promise((resolve, reject) => {
					uni.chooseImage({
						count: 1,
						success: res => {
							const path = res.tempFilePaths[0]
							let ext
							// #ifdef H5
							ext = res.tempFiles[0].name.split('.').pop()
							const options = {
								filePath: path,
								cloudPath: Date.now() + '.' + ext,
								isPrivate
							}
							resolve(options)
							// #endif
							// #ifndef H5
							uni.getImageInfo({
								src: path,
								success(info) {
									const options = {
										filePath: path,
										cloudPath: Date.now() + '.' + info.type.toLowerCase()
									}
									resolve(options)
								},
								fail(err) {
									reject(new Error(err.errMsg || '未能获取图片类型'))
								}
							})
							// #endif
						},
						fail: () => {
							reject(new Error('Fail_Cancel'))
						}
					})
				}).then((options) => {
					this.uploadFile(options);
				}).catch((err) => {
					uni.hideLoading()
					console.log(err);
					if (err.message !== 'Fail_Cancel') {
						uni.showModal({
							content: `图片上传失败，错误信息为：${err.message}`,
							showCancel: false
						})
					}
				})
			},
			async uploadFile(options) {
				uni.showLoading({
					title: '文件上传中...'
				})
				const uniCloudStorageExtCo = uniCloud.importObject("ext-storage-co", {
					customUI: true
				});
				const uploadFileOptionsRes = await uniCloudStorageExtCo.getUploadFileOptions({
					cloudPath: `test/${Date.now()}.jpg`, // 支持自定义目录
				});
				console.log('uploadFileOptionsRes: ', uploadFileOptionsRes)
				const uploadTask = uni.uploadFile({
					...uploadFileOptionsRes.uploadFileOptions, // 上传文件所需参数
					filePath: options.filePath, // 本地文件路径
					success: async () => {
						const res = {
							cloudPath: uploadFileOptionsRes.cloudPath, // 文件云端路径
							fileID: uploadFileOptionsRes.fileID, // 文件ID
							fileURL: uploadFileOptionsRes.fileURL, // 文件URL（如果是私有权限，则此URL是无法直接访问的）
						};
						// 上传成功后的逻辑
						console.log(res);
						if (options.isPrivate) {
							// 设为私有文件
							const uniCloudStorageExtCo = uniCloud.importObject("ext-storage-co", {
								customUI: true
							});
							await uniCloudStorageExtCo.setFilePrivate({
								fileID: res.fileID
							});
							this.privateFileID = res.fileID;
						}
						uni.showModal({
							content: '图片上传成功，fileID为：' + res.fileID,
							showCancel: false
						})
					},
					fail: (err) => {
						// 上传失败后的逻辑
						console.log(err);
						if (err.message !== 'Fail_Cancel') {
							uni.showModal({
								content: `图片上传失败，错误信息为：${err.message}`,
								showCancel: false
							})
						}
					},
					complete: () => {
						uni.hideLoading()
					}
				});
				// 监听上传进度
				uploadTask.onProgressUpdate((res) => {
					console.log("监听上传进度", res);
				});
			},
			async getTempFileURL() {
				const uniCloudStorageExtCo = uniCloud.importObject("ext-storage-co");
				let res = await uniCloudStorageExtCo.getTempFileURL({
					fileList: [this.privateFileID]
				});
				let tempFileURL = res.fileList[0].tempFileURL;
				uni.showModal({
					content: '图片临时下载链接为：' + tempFileURL,
					showCancel: false
				})
			}
		}
	}
</script>

<style>
	.content {
		padding-bottom: 30px;
	}

	.title {
		font-weight: bold;
		text-align: center;
		padding: 20px 0px;
		font-size: 20px;
	}

	.tips {
		color: #999999;
		font-size: 14px;
		padding: 20px 30px;
	}

	.btn-list {
		padding: 0px 30px;
	}

	.btn-list button {
		margin-top: 20px;
	}

	.upload-preview {
		width: 100%;
	}
</style>