<template>
	<view class="uni-container">
		<uni-notice-bar style="margin: 0;" showIcon text="本页面信息，在应用发布、app升级模块中，都会关联使用，请认真填写" />
		<uni-forms ref="form" v-model="formData" validateTrigger="bind" style="max-width: 792px;"
			:labelWidth="labelWidth" :rules="rules">
			<uni-card title="基础信息">
				<uni-forms-item name="app_type" label="应用类型" required>
					<uni-data-select
						v-model="formData.app_type"
						:localdata="appTypeOptions"
						placeholder="请选择应用类型"
						:clear="false">
					</uni-data-select>
				</uni-forms-item>
				<uni-forms-item class="forn-item__flex" name="appid" label="AppID" required>
					<uni-easyinput :disabled="isEdit" placeholder="应用的AppID" v-model="formData.appid" trim="both">
					</uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="name" label="应用名称" required>
					<uni-easyinput :disabled="isEdit" placeholder="应用名称" v-model="formData.name" trim="both">
					</uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="introduction" label="应用简介">
					<uni-easyinput placeholder="应用简介" v-model="formData.introduction" trim="both"></uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="description" label="应用描述">
					<textarea :maxlength="-1" auto-height placeholder="应用描述"
						@input="binddata('description', $event.detail.value)" class="uni-textarea-border"
						v-model="formData.description"></textarea>
				</uni-forms-item>
				<uni-forms-item name="remark" label="应用备注">
					<textarea :maxlength="-1" auto-height placeholder="应用备注"
						@input="binddata('remark', $event.detail.value)" class="uni-textarea-border"
						v-model="formData.remark"></textarea>
				</uni-forms-item>
			</uni-card>

			<uni-card title="图标素材">
				<uni-forms-item label="应用图标">
					<uni-file-picker v-model="middleware_img.icon_url" :image-styles="{'width' : '200rpx'}"
						return-type="object" file-mediatype="image" limit="1" mode="grid"
						@success="(res) => iconUrlSuccess(res,'icon_url')"
						@delete="(res) => iconUrlDelete(res,'icon_url')">
					</uni-file-picker>
				</uni-forms-item>
				<uni-forms-item label="应用截图">
					<uni-file-picker v-model="screenshotList" file-mediatype="image" mode="grid"
						:image-styles="{'height': '500rpx','width' : '300rpx'}" @delete="iconUrlDelete">
					</uni-file-picker>
				</uni-forms-item>
			</uni-card>

			<uni-card class="app_platform" title="App 信息">
				<view v-if="isEdit" class="extra-button">
					<button type="primary" plain size="mini" @click="autoFillApp">自动填充</button>
					<show-info :left="-10" :top="-35" width="230" content="从App升级中心同步应用安装包信息" />
				</view>
				<view v-for="item in appPlatformKeys" :key="item">
					<checkbox-group @change="({detail:{value}}) => {setPlatformChcekbox(item,!!value.length)}">
						<label class="title_padding" :class="{'font_bold':getPlatformChcekbox(item)}">
							<checkbox :value="item" :checked="middleware_checkbox[item]" />
							<text>{{appPlatformValues[item]}}</text>
						</label>
					</checkbox-group>
					<template v-if="getPlatformChcekbox(item)">
						<uni-forms-item label="名称">
							<uni-easyinput v-model="formData[item].name" trim="both"></uni-easyinput>
						</uni-forms-item>
						<uni-forms-item class="forn-item__flex" v-if="item === 'app_android'" label="上传apk包">
							<uni-file-picker v-model="appPackageInfo" file-extname="apk" :disabled="hasPackage"  :provider="uniFilePickerProvider"
								returnType="object" file-mediatype="all" limit="1"
								@success="(res) => iconUrlSuccess(res, `${item}.url`)"
								@delete="(res) => iconUrlDelete(res,`${item}.url`)" style="flex:1;">
								<view class="flex">
									<radio-group @change="e => this.uniFilePickerProvider = e.detail.value">
										<view class="flex" style="flex-wrap: nowrap;">
									上传至：
											<label>
												<radio value="unicloud" checked/><text>内置存储</text>
											</label>
											<label style="margin-left: 20rpx;">
												<radio value="extStorage" /><text>扩展存储</text>
											</label>
										</view>
									</radio-group>
									<button type="primary" size="mini" @click="selectFile" style="margin: 0 0 0 20rpx;">选择文件</button>
									<text style="padding: 10px;font-size: 12px;color: #666;">
										上传apk到当前服务空间的云存储中，上传成功后，会自动使用云存储地址填充下载链接
									</text>
								</view>
							</uni-file-picker>
							<text v-if="hasPackage" style="padding-left: 20px;color: #a8a8a8;">
								{{appPackageInfo.size && Number(appPackageInfo.size / 1024 / 1024).toFixed(2) + 'M'}}
							</text>
						</uni-forms-item>
						<uni-forms-item :label="item === 'app_ios' ? 'AppStore 链接' : '下载链接'">
							<uni-easyinput :maxlength="-1" v-model="formData[item].url" trim="both"></uni-easyinput>
						</uni-forms-item>
						<uni-forms-item v-if="item === 'app_ios'" label="获取 ABM 应用登录链接">
							<uni-easyinput :maxlength="-1" v-model="formData[item].abm_url" trim="both"></uni-easyinput>
						</uni-forms-item>
					</template>
				</view>

				<uni-popup ref="scheme" background-color="#fff">
					<view class="popup-content">
						<text style="font-size: 15px;font-weight: bold;">
							常见的应用商店 scheme 地址
						</text>
						<view></view>
						<text>
							应用宝：tmast://appdetails?r=XXX&pname=xxx；
							小米：mimarket://details?id=com.xx.xx；
							三星：samsungapps://ProductDetail/com.xx.xx；
							华为：appmarket://details?id=com.xx.xx；
							oppo：oppomarket://details?packagename=com.xx.xx；
							vivo：vivomarket://details?id=com.xx.xx；
						</text>
					</view>
				</uni-popup>
				<uni-forms-item name="store_schemes" label="Android应用市场" labelWidth="120">
					<view style="height: 100%;">
						<view class="flex" style="justify-content: end;">
							<text class="pointer"
								style="text-decoration: underline;color: #666;font-size: 12px;padding-left: 10rpx;"
								@click="schemeDemo">常见应用商店schema汇总</text>
							<button type="primary" size="mini" @click="addStoreScheme"
								style="margin: 0 0 0 10px;">新增</button>
						</view>

						<view v-for="(item,index) in formData.store_list" :key="item.id">
							<uni-card title="" style="margin: 20px 0px 0px 0px;">
								<view style="display: flex;">
									<view style="padding-left: 10px;">
										<button type="warn" size="mini" @click="deleteStore(index, item)">删除</button>
									</view>
								</view>
								<uni-forms-item label="商店名称">
									<uni-easyinput v-model="item.name" trim="both"></uni-easyinput>
								</uni-forms-item>
								<uni-forms-item label="Scheme">
									<uni-easyinput :maxlength="-1" v-model="item.scheme" trim="both"></uni-easyinput>
								</uni-forms-item>
							</uni-card>
						</view>
					</view>
				</uni-forms-item>
			</uni-card>

			<uni-card class="mp_platform" title="小程序/快应用信息">
				<view v-for="item in mpPlatformKeys" :key="item">
					<checkbox-group @change="({detail:{value}}) => {setPlatformChcekbox(item,!!value.length)}">
						<label class="title_padding" :class="{'font_bold':getPlatformChcekbox(item)}">
							<checkbox :value="item" :checked="middleware_checkbox[item]" />
							<text>{{mpPlatform[item]}}</text>
						</label>
					</checkbox-group>
					<template v-if="mpAccordionStatus && getPlatformChcekbox(item)">
						<uni-forms-item label="名称">
							<uni-easyinput v-model="formData[item].name" trim="both"></uni-easyinput>
						</uni-forms-item>
						<uni-forms-item :label="mpPlatform[item].slice(-3) + '码'">
							<uni-file-picker v-model="middleware_img[item]" :image-styles="{'width' : '200rpx'}"
								return-type="object" file-mediatype="image" limit="1" mode="grid"
								@success="(res) => iconUrlSuccess(res, `${item}.qrcode_url`)"
								@delete="(res) => iconUrlDelete(res, `${item}.qrcode_url`)">
							</uni-file-picker>
						</uni-forms-item>
					</template>
				</view>
			</uni-card>

			<uni-card title="web信息">
				<uni-forms-item label="链接地址">
					<uni-easyinput :maxlength="-1" v-model="formData.h5.url" trim="both"></uni-easyinput>
					<span style="font-size: 13px; color: #999;">如需免费的前端网页托管，请开通 <a style="color: inherit;"
							href="https://unicloud.dcloud.net.cn">uniCloud</a> ，创建服务空间，并在 “前端网页托管”
						里上传你的网页</span>
				</uni-forms-item>
			</uni-card>

			<uni-card :isShadow="false" v-if="isEdit">
				<text><text style="font-weight: bold;">提示：</text>保存后需重新生成发布页</text>
			</uni-card>

			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">保存</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;">
					<button class="uni-button" style="width: 100px;">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	// 导入 mixin 文件
	import mixin from './mixin/publish_add_detail_mixin.js';
	// 获取数据库实例
	const db = uniCloud.database();
	// 获取数据库命令实例
	const dbCmd = db.command;
	// 定义数据库集合名称
	const dbCollectionName = 'opendb-app-list';

	/**
	 * 生成指定长度的随机字符串
	 * @param {number} len - 随机字符串的长度
	 * @returns {string} - 生成的随机字符串
	 */
	function randomString(len) {
		// 设定要生成的字符串包含的字符
		let array = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
			'U', 'V', 'W', 'X', 'Y', 'Z'
		];
		let result = '';
		for (let i = 0; i < len; i++) {
			result += array[Math.floor(Math.random() * 26)];
		}
		return result;
	}


	export default {
		// mixins 导入 mixin
		mixins: [mixin],
		// 组件的数据对象
		data() {
			return {
				// 额外数据，初始化为空字符串
				mpExtra: ' ',
				// 手风琴状态，默认为1
				mpAccordionStatus: 1,
				// 标签宽度，默认为'80px'
				labelWidth: '80px',
				uniFilePickerProvider: 'unicloud',
				// 应用类型选项
				appTypeOptions: [
					{ value: 0, text: 'uni-app' },
					{ value: 1, text: 'uni-app x' }
				]
			}
		},
		/**
		 * 页面加载时的处理函数
		 * @param {object} e - 传入的参数对象
		 */
		onLoad(e) {
			if (e.id) {
				// 标记为编辑状态
				this.isEdit = true;
				// 设置导航栏标题为'修改应用'
				uni.setNavigationBarTitle({
					title: '修改应用'
				});
				this.setFormData('appid', e.id);
				this.getDetail(e.id);
			} else {
				// 填写应用名称后，给各平台设置相同的名称
				this.$watch('formData.name', (name) => {
					this.platFormKeys.forEach(key => {
						this.setFormData(`${key}.name`, name);
					});
				});
			}
		},
		onReady() {
			this.mpExtra = '折叠'
		},
		methods: {
			// 更新线上版本的 store 记录
			resolvestableVersionStoreList() {
				const modifiedMap = {}
				const modifiedKeys = []
				this.formData.store_list.forEach((item, index) => {
					modifiedKeys.push(item.id)
					modifiedMap[item.id] = index
				})

				return this.fetchAppInfo(this.getFormData('appid'), 'Android')
					.then(res => {
						if (!res.success) return
						if (res.store_list) {
							const originalMap = {}
							const originalKeys = []
							res.store_list.forEach((item, index) => {
								originalKeys.push(item.id)
								originalMap[item.id] = index
							})

							modifiedKeys.forEach((key, index) => {
								const afterItem = this.formData.store_list[modifiedMap[key]]
								// 新增
								if (originalKeys.indexOf(key) === -1) {
									res.store_list.push(afterItem)
								} else {
									// 修改
									res.store_list[originalMap[key]].name = afterItem.name
									res.store_list[originalMap[key]].scheme = afterItem.scheme
								}
							})

							// 删除
							for (let i = 0; i < res.store_list.length; i++) {
								let id = res.store_list[i].id
								if (this.deletedStore.indexOf(id) !== -1 && modifiedKeys.indexOf(id) === -1) {
									res.store_list.splice(i, 1)
									i--
								}
							}
						} else {
							res.store_list = this.formData.store_list
						}

						return this.updateAppVersion(res._id, {
							store_list: res.store_list
						})
					})
			},
			updateAppVersion(id, value) {
				// 更新应用版本
				return db.collection('opendb-app-versions').doc(id).update(value)
			},
			/**
			 * 验证表单并提交
			 */
			submit() {
				// 显示遮罩
				uni.showLoading({
					mask: true
				})
				this.formatFormData()
				// 表单验证
				this.$refs.form.validate(this.keepItems).then((res) => {
					// 表单提交
					return this.submitForm(res)
				}).catch((err) => {
					console.error(err)
				}).finally(() => {
					// 关闭遮罩
					uni.hideLoading()
				})
			},
			/**
			 * 提交表单
			 */
			submitForm(value) {
				(
					this.isEdit ?
					this.requestCloudFunction('setNewAppData', {
						id: this.formDataId,
						value
					}) :
					db.collection(dbCollectionName).add(value)
				)
				.then((res) => {
						if (this.isEdit) return this.resolvestableVersionStoreList()
					})
					.then(() => {
						uni.showToast({
							title: `${this.isEdit ? '更新' : '新增'}成功`
						})
						this.getOpenerEventChannel().emit('refreshData')
						setTimeout(() => uni.navigateBack(), 500)
					})
					.catch((err) => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					})
			},
			/**
			 * 获取表单数据
			 * @param {Object} id
			 */
			getDetail(id) {
				uni.showLoading({
					mask: true
				})
				db.collection(dbCollectionName).where({
					appid: id
				}).get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.formDataId = data._id
						this.initFormData(data)
					} else {
						this.autoFill()
						this.autoFillApp()
					}
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			 // 切换手风琴状态
			mpAccordion() {
				if (this.mpAccordionStatus) {
					this.mpExtra = '展开'
					this.mpAccordionStatus = 0
				} else {
					this.mpExtra = '折叠'
					this.mpAccordionStatus = 1
				}
			},
			addStoreScheme() {
				this.formData.store_list.push({
					enable: false,
					priority: 0,
					id: randomString(5) + '_' + Date.now()
				})
			},
			deleteStore(index, item) {
				if (item.scheme && item.scheme.trim().length && this.isEdit) {
					uni.showModal({
						content: '是否同步删除线上版本此条商店记录？',
						success: (res) => {
							const storeItem = this.formData.store_list.splice(index, 1)[0]
							if (storeItem && res.confirm) {
								this.deletedStore.push(storeItem.id)
							}
						}
					})
				} else {
					this.formData.store_list.splice(index, 1)[0]
				}
			},
			schemeDemo() {
				// #ifndef H5
				$refs.scheme.open('center')
				// #endif
				// #ifdef H5
				window.open("https://ask.dcloud.net.cn/article/39960", '_blank')
				// #endif
			}
		}
	}
</script>

<style lang="scss">
	.title_padding {
		padding-bottom: 15px;
		display: block;
	}

	.font_bold {
		font-weight: bold;
	}

	.uni-button-group {
		& button {
			margin-left: 15px;
		}

		& button:first-child {
			margin-left: 0px;
		}
	}

	::v-deep {
		.forn-item__flex {
			.uni-forms-item__content {
				display: flex;
				align-items: center;

				.custom-button {
					height: 100%;
					margin-left: 10rpx;
					line-height: 36px;
				}
			}
		}

		.uni-card {
			padding: 0 !important;
			cursor: auto;
		}

		.uni-card__header {
			background-color: #eee;
		}

		.uni-card__header-title-text {
			font-weight: bold;
		}
	}

	.extra-button {
		display: flex;
		align-items: center;
		margin-bottom: 15px;

		button {
			margin: 0;
		}
	}

	.flex-center-r {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tip {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background-color: #f3f5f7;
		color: #2c3e50;
		padding: 10px;
		font-size: 32rpx;

		border: {
			color: #e96900;
			left-width: 8px;
			left-style: solid;
		}

		text {
			margin-right: 15px;
		}

		.custom-button {
			margin-left: 0px;
		}
	}

	.popup-content {
		padding: 30rpx;
	}

	::v-deep .uni-file-picker__files {
		max-width: 100%;
	}
</style>
