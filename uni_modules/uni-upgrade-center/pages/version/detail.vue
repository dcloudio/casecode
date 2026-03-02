<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">包类型</view>
				<view class="uni-sub-title" style="display: flex;justify-content: center;align-items: center;">
					{{type_valuetotext[formData.type]}}
				</view>
			</view>
			<view v-if="!isStable" class="uni-group">
				<button class="uni-button" type="warn" size="mini" @click="deletePackage">删除</button>
			</view>
		</view>
		<uni-forms ref="form" :value="formData" validateTrigger="bind" :labelWidth="labelWidth">
			<!-- region 基础信息 -->
			<uni-forms-item name="appid" label="AppID" required>
				<uni-easyinput :disabled="true" v-model="formData.appid" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="name" label="应用名称">
				<uni-easyinput :disabled="true" v-model="formData.name" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="title" label="更新标题">
				<uni-easyinput :disabled="detailsState" placeholder="更新标题" v-model="formData.title" />
			</uni-forms-item>
			<uni-forms-item name="contents" label="更新内容" required>
				<textarea auto-height style="box-sizing: content-box;" :disabled="detailsState"
					@input="binddata('contents', $event.detail.value)" class="uni-textarea-border" placeholder="更新内容 (可换行)"
					:value="formData.contents" @update:value="val => formData.contents = val"></textarea>
			</uni-forms-item>
			<uni-forms-item name="platform" label="平台" required>
				<!-- multiple 为 true 时才会反显 -->
				<uni-data-checkbox :disabled="true" :multiple="isWGT" v-model="formData.platform"
					:localdata="platformLocaldata" />
			</uni-forms-item>
			<uni-forms-item name="version" label="版本号" required>
				<uni-easyinput :disabled="true" v-model="formData.version" placeholder="当前包版本号，必须大于当前已上线版本号" />
			</uni-forms-item>
			<!-- endregion -->

			<uni-forms-item v-if="isWGT" key="min_uni_version" name="min_uni_version" label="原生App最低版本"
				:required="isWGT">
				<uni-easyinput :disabled="detailsState" placeholder="原生App最低版本" v-model="formData.min_uni_version" />
				<show-info :content="minUniVersionContent"></show-info>
			</uni-forms-item>

			<template v-if="enableUploadPackage && !detailsState">
				<uni-forms-item label="存储选择">
					<view class="flex">
						<radio-group @change="e => uniFilePickerProvider = e.detail.value" style="width: 100%;">
							<view class="flex" style="flex-wrap: nowrap;">
						上传至：
								<label>
									<radio value="unicloud" :checked="uniFilePickerProvider === 'unicloud'"/><text>内置存储</text>
								</label>
								<label style="margin-left: 20rpx;">
									<radio value="extStorage" :checked="uniFilePickerProvider === 'extStorage'"/><text>扩展存储</text>
								</label>
							</view>
						</radio-group>
						<text class="uni-sub-title" style="margin-top: 10px;font-size: 12px;color: #666;width: 100%;">内置存储是服务空间开通后自带的云存储，不支持自定义域名，不支持阶梯计费</text>
						<text class="uni-sub-title" style="margin-top: 10px;font-size: 12px;color: #666;">扩展存储支持自定义域名、阶梯计费，越用越便宜、功能更强大</text>
						<text class="uni-sub-title" style="margin-top: 10px;font-size: 12px;color: #2979ff;cursor: pointer;text-decoration: underline; margin-left: 10px;" @click="toUrl('https://doc.dcloud.net.cn/uniCloud/ext-storage/service.html')">扩展存储开通文档</text>
					</view>
				</uni-forms-item>

				<uni-forms-item label="自定义域名" v-if="uniFilePickerProvider === 'extStorage'">
					<view class="flex" style="flex-direction: column;align-items:flex-start;">
						<uni-easyinput placeholder="请输入扩展存储自定义域名" v-model="domain" :maxlength="-1" style="width: 550px;"/>
						<text class="uni-sub-title" style="margin-top: 10px;font-size: 12px;color: #666;">输入扩展存储绑定的域名，在服务空间-云存储-扩展存储页面可查看，如：cdn.example.com</text>
					</view>
				</uni-forms-item>

				<uni-forms-item :label="'上传'+fileExtname[0]+'包'">
					<uni-file-picker v-model="appFileList" :file-extname="fileExtname" :disabled="hasPackage"
						returnType="object" file-mediatype="all" limit="1" @success="packageUploadSuccess" :provider="uniFilePickerProvider"
						@delete="packageDelete">
						<view class="flex">
							<button type="primary" size="mini" @click="selectFile" style="margin: 0px;">选择文件</button>
						</view>
					</uni-file-picker>
					<text v-if="hasPackage"
						style="padding-left: 20px;color: #a8a8a8;">{{Number(appFileList.size / 1024 / 1024).toFixed(2)}}M</text>
				</uni-forms-item>
			</template>

			<uni-forms-item key="url" name="url" :label="urlLabel" required>
				<view class="flex" style="flex-direction: column;align-items:flex-start;flex: 1;">
					<view class="flex" style="width: 100%;">
						<uni-easyinput :disabled="detailsState" placeholder="下载链接" v-model="formData.url" :maxlength="-1" />
						<text style="margin-left: 10px;color: #2979ff;cursor: pointer;text-decoration: underline;" v-if="formData.url" @click="toUrl(formData.url)">测试下载</text>
					</view>
					<text style="margin-top: 10px;font-size: 12px;color: #666;" v-if="formData.url && !detailsState">建议点击【测试下载】能正常下载后，再进行发布</text>
				</view>
			</uni-forms-item>

			<uni-forms-item v-if="isAndroid && !isWGT && formData.store_list.length" label="Android应用市场" key="store_list"
				name="store_list" labelWidth="120">
				<view style="flex: 1;">
					<view v-for="(item,index) in formData.store_list" :key="item.id">
						<uni-card style="margin: 0px 0px 20px 0px;">
							<view style="display: flex;">
								<checkbox-group style="user-select: none;"
									@change="({detail:{value}}) => {item.enable = !!value.length}">
									<label class="title_padding">
										<checkbox :disabled="detailsState" value="scheme" :checked="item.enable" />
										<text>是否启用</text>
									</label>
								</checkbox-group>
							</view>
							<uni-forms-item label="商店名称">
								<uni-easyinput disabled v-model="item.name" trim="both"></uni-easyinput>
							</uni-forms-item>
							<uni-forms-item label="Scheme">
								<uni-easyinput disabled v-model="item.scheme" trim="both"></uni-easyinput>
							</uni-forms-item>
							<uni-forms-item label="优先级">
								<uni-easyinput :disabled="detailsState" v-model="item.priority" type="number">
								</uni-easyinput>
								<show-info :top="-100" :left="-180" :content="priorityContent"></show-info>
							</uni-forms-item>
						</uni-card>
					</view>
				</view>
			</uni-forms-item>

			<uni-forms-item v-if="isWGT" key="is_silently" name="is_silently" label="静默更新">
				<switch :disabled="detailsState"
					@change="binddata('is_silently', $event.detail.value),formData.is_silently=$event.detail.value"
					:checked="formData.is_silently" />
				<show-info :top="-80" :content="silentlyContent"></show-info>
			</uni-forms-item>
			<uni-forms-item key="is_mandatory" name="is_mandatory" label="强制更新">
				<switch :disabled="detailsState"
					@change="binddata('is_mandatory', $event.detail.value),formData.is_mandatory=$event.detail.value"
					:checked="formData.is_mandatory" />
				<show-info width="230" :top="-30" :content="mandatoryContent"></show-info>
			</uni-forms-item>
			<uni-forms-item name="stable_publish" label="上线发行">
				<switch :disabled="detailsState || isStable"
					@change="binddata('stable_publish', $event.detail.value),formData.stable_publish=$event.detail.value"
					:checked="formData.stable_publish" />
				<show-info v-if="isStable" :top="-50" width="350" :content="stablePublishContent"></show-info>
				<show-info v-else :top="-40" :content="stablePublishContent2"></show-info>
			</uni-forms-item>
			<uni-forms-item name="create_date" label="上传时间">
				<uni-dateformat format="yyyy-MM-dd hh:mm:ss" :date="formData.create_date" :threshold="[0, 0]" />
			</uni-forms-item>
			<uni-forms-item v-show="false" name="type" label="安装包类型">
				<uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata" />
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="detailsState = false"
					v-if="detailsState">修改</button>
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit"
					v-if="!detailsState">提交</button>
				<button type="warn" class="uni-button" style="width: 100px;" @click="cancelEdit"
					v-if="!detailsState">取消</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;">
					<button class="uni-button" style="width: 100px;">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	import {
		validator,
		enumConverter
	} from '@/js_sdk/validator/opendb-app-versions.js';
	import addAndDetail, {
		fields, platform_iOS, platform_Android, platform_Harmony
	} from '../mixin/version_add_detail_mixin.js'
	import {
		deepClone,
		appVersionListDbName
	} from '../utils.js'

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = appVersionListDbName;

	function getValidator(fields) {
		let reuslt = {}
		for (let key in validator) {
			if (fields.includes(key)) {
				reuslt[key] = validator[key]
			}
		}
		return reuslt
	}

	export default {
		mixins: [addAndDetail],
		data() {
			return {
				showStableInfo: false,
				isStable: true, // 是否是线上发行版
				originalData: {}, // 原始数据，用于恢复状态
				detailsState: true, // 查看状态,
				uniFilePickerProvider: 'unicloud',
				domain: ""
			}
		},
		async onLoad(e) {
			let { domain, provider } = this.getCloudStorageConfig();
			if (domain) this.domain = domain;
			if (provider) this.uniFilePickerProvider = provider;

			const id = e.id
			this.formDataId = id
			await this.getDetail(id)
			this.isStable = this.formData.stable_publish;
			this.latestStableData = await this.getLatestVersion();
			if (this.isWGT) {
				this.rules.min_uni_version.rules.push({
					"required": true
				})
			}
		},
		onUnload() {
			// 临时处理，后面会再优化
			this.setCloudStorage({
				provider: null
			});
		},
		watch: {
			domain(val) {
				this.setCloudStorage({
					domain: val
				});
				if (this.formData.url) {
					// 替换 this.formData.url 内的域名
					if (!val) val = "请输入自定义域名"
					this.formData.url = this.formData.url.replace(/^(https?:\/\/)[^\/]+/, `$1${val}`);
				}
			},
			uniFilePickerProvider(val){
				this.setCloudStorage({
					provider: val
				});
			}
		},
		methods: {
			/**
			 * 触发表单提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.validate(['store_list']).then((res) => {
					if (res.store_list) {
						res.store_list.forEach(item => {
							item.priority = parseFloat(item.priority)
						})
					}
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},
			async submitForm(value) {
				const collectionDB = db.collection(dbCollectionName)
				// 使用 clientDB 提交数据
				collectionDB.doc(this.formDataId).update(value).then(async (res) => {
					// 如果不是线上发行版，则在设置为上线发行时，需将之前的已上线版设为下线
					if (!this.isStable && value.stable_publish === true && this.latestStableData) {
						await collectionDB.doc(this.latestStableData._id).update({
							stable_publish: false
						})
					}

					uni.showToast({
						title: '修改成功'
					})

					this.getOpenerEventChannel().emit('refreshData')
					setTimeout(() => uni.navigateBack(), 500)
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
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
				return db.collection(dbCollectionName)
					.doc(id)
					.field(fields)
					.get()
					.then((res) => {
						const data = res.result.data[0]
						if (data) {
							if (!data.store_list) data.store_list = []
							this.formData = data
							this.originalData = deepClone(this.formData)
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
			deletePackage() {
				uni.showModal({
					title: '提示',
					content: '是否删除该版本',
					success: res => {
						if (res.confirm) {
							uni.showLoading({
								mask: true
							})
							db.collection(dbCollectionName).doc(this.formDataId).remove()
								.then(() => {
									uni.showToast({
										title: '删除成功'
									})
									this.getOpenerEventChannel().emit('refreshData')
									setTimeout(() => uni.navigateBack(), 500)
								}).catch((err) => {
									uni.showModal({
										content: err.message || '请求服务失败',
										showCancel: false
									})
								}).finally(() => {
									uni.hideLoading()
								})
						}
					}
				});
			},
			async getLatestVersion() {
				const where = {
					appid: this.formData.appid,
					type: this.formData.type,
					stable_publish: true
				};
				if (!this.isWGT) {
					where.platform = this.formData.platform[0]
				}
				const latestStableData = await db.collection(dbCollectionName).where(where).get()
				return latestStableData.result.data.find(item => item.platform.toString() === this.formData.platform
					.toString());
			},
			cancelEdit() {
				let content = '';
				!this.isiOS && this.hasPackage ? content += '\n将会删除已上传的包' : '';
				uni.showModal({
					title: '取消修改',
					content,
					success: res => {
						if (res.confirm) {
							this.formData = deepClone(this.originalData)
							this.detailsState = true

							if (this.hasPackage) {
								this.deleteFile([this.appFileList.url])
							}
						}
					}
				});
			}
		}
	}
</script>
<style lang="scss">
	.show-stable-info {
		position: absolute;
		left: 165px;
		padding: 5px 10px;
		background-color: #f4f4f5;
		color: #909399;
		border-radius: 4px;
		border: 1px solid #e9e9eb;
	}

	::v-deep .uni-forms-item__content {
		display: flex;
		align-items: center;
	}

	.uni-button-group {
		& button {
			margin-left: 15px;
		}

		& button:first-child {
			margin-left: 0px;
		}
	}
</style>
