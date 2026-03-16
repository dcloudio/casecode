<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">包类型</view>
				<view class="uni-sub-title">{{type_valuetotext[formData.type]}}</view>
			</view>
		</view>
		<uni-forms ref="form" :value="formData" validateTrigger="bind" :labelWidth="labelWidth">
			<uni-forms-item name="appid" label="AppID" required>
				<uni-easyinput :disabled="true" v-model="formData.appid" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="name" label="应用名称">
				<uni-easyinput :disabled="true" v-model="formData.name" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="title" label="更新标题">
				<uni-easyinput placeholder="更新标题" v-model="formData.title" />
			</uni-forms-item>
			<uni-forms-item name="contents" label="更新内容" required>
				<textarea auto-height style="box-sizing: content-box;"
					@input="binddata('contents', $event.detail.value)" class="uni-textarea-border"
					:value="formData.contents" @update:value="val => formData.contents = val"></textarea>
			</uni-forms-item>
			<uni-forms-item name="platform" label="平台" required>
				<uni-data-checkbox :multiple="isWGT" v-model="formData.platform" :localdata="platformLocaldata" />
			</uni-forms-item>
			<uni-forms-item name="version" label="版本号" required>
				<uni-easyinput v-model="formData.version" placeholder="当前包版本号，必须大于当前线上发行版本号" />
			</uni-forms-item>
			<uni-forms-item v-if="isWGT" key="min_uni_version" name="min_uni_version" label="原生App最低版本"
				:required="isWGT">
				<uni-easyinput placeholder="原生App最低版本" v-model="formData.min_uni_version" />
				<show-info :content="minUniVersionContent"></show-info>
			</uni-forms-item>
			<uni-forms-item v-if="!isiOS" label="上传apk包">
				<uni-file-picker v-model="appFileList" :file-extname="fileExtname" :disabled="hasPackage"
					returnType="object" file-mediatype="all" limit="1" @success="packageUploadSuccess"
					@delete="packageDelete">
					<view class="flex">
						<button type="primary" size="mini" @click="selectFile" style="margin: 0;">选择文件</button>
						<text
							style="padding: 10px;font-size: 12px;color: #666;">上传apk到当前服务空间的云存储中，上传成功后，会自动使用云存储地址填充下载链接</text>
					</view>
				</uni-file-picker>
				<text v-if="hasPackage"
					style="padding-left: 20px;color: #a8a8a8;">{{Number(appFileList.size / 1024 / 1024).toFixed(2)}}M</text>
			</uni-forms-item>
			<uni-forms-item key="url" name="url" :label="isiOS ? 'AppStore' : '下载链接'" required>
				<uni-easyinput placeholder="链接" v-model="formData.url" :maxlength="-1" />
				<!-- <show-info :top="-80" :content="uploadFileContent"></show-info> -->
			</uni-forms-item>

			<uni-forms-item v-if="!isiOS && !isWGT && formData.store_list.length" label="Android应用市场" labelWidth="125px"
				key="store_list" name="store_list">
				<view style="flex: 1;">
					<view v-for="(item) in formData.store_list" :key="item.id">
						<uni-card style="margin: 0px 0px 20px 0px;">
							<view style="display: flex;">
								<checkbox-group style="user-select: none;"
									@change="({detail:{value}}) => {item.enable = !!value.length}">
									<label class="title_padding">
										<checkbox value="scheme" :checked="item.enable" />
										<text>是否启用</text>
									</label>
								</checkbox-group>
								<!-- <view style="padding-left: 10px;">
									<button type="warn" size="mini"
										@click="formData.store_list.splice(index,1)">删除</button>
								</view> -->
							</view>
							<uni-forms-item label="商店名称">
								<uni-easyinput disabled v-model="item.name" trim="both"></uni-easyinput>
							</uni-forms-item>
							<uni-forms-item label="Scheme">
								<uni-easyinput disabled v-model="item.scheme" trim="both"></uni-easyinput>
							</uni-forms-item>
							<uni-forms-item label="优先级">
								<uni-easyinput v-model="item.priority" type="number"></uni-easyinput>
								<show-info :top="-100" :left="-180" :content="priorityContent"></show-info>
							</uni-forms-item>
						</uni-card>
					</view>
				</view>
			</uni-forms-item>
			<uni-forms-item v-if="isWGT" key="is_silently" name="is_silently" label="静默更新">
				<switch @change="binddata('is_silently', $event.detail.value)" :checked="formData.is_silently" />
				<show-info :top="-80" :content="silentlyContent"></show-info>
			</uni-forms-item>
			<uni-forms-item v-if="!isiOS" key="is_mandatory" name="is_mandatory" label="强制更新">
				<switch @change="binddata('is_mandatory', $event.detail.value)" :checked="formData.is_mandatory" />
				<show-info :content="mandatoryContent"></show-info>
			</uni-forms-item>
			<uni-forms-item name="stable_publish" label="上线发行">
				<switch @change="binddata('stable_publish', $event.detail.value)" :checked="formData.stable_publish" />
				<show-info :top="-40" :content="stablePublishContent2"></show-info>
			</uni-forms-item>
			<uni-forms-item v-show="false" name="type" label="安装包类型">
				<uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata" />
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">发布</button>
				<button type="warn" class="uni-button" style="width: 100px;margin-left: 15px;" @click="back">取消</button>
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
		fields
	} from '../mixin/version_add_detail_mixin.js';
	import {
		appVersionListDbName
	} from '../utils.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = appVersionListDbName;

	const platform_iOS = 'iOS';
	const platform_Android = 'Android';

	/**
	 * 对比版本号，如需要，请自行修改判断规则
	 * 支持比对	("3.0.0.0.0.1.0.1", "3.0.0.0.0.1")	("3.0.0.1", "3.0")	("3.1.1", "3.1.1.1") 之类的
	 * @param {Object} v1
	 * @param {Object} v2
	 * v1 > v2 return 1
	 * v1 < v2 return -1
	 * v1 == v2 return 0
	 */
	function compare(v1 = '0', v2 = '0') {
		v1 = String(v1).split('.')
		v2 = String(v2).split('.')
		const minVersionLens = Math.min(v1.length, v2.length);

		let result = 0;
		for (let i = 0; i < minVersionLens; i++) {
			const curV1 = Number(v1[i])
			const curV2 = Number(v2[i])

			if (curV1 > curV2) {
				result = 1
				break;
			} else if (curV1 < curV2) {
				result = -1
				break;
			}
		}

		if (result === 0 && (v1.length !== v2.length)) {
			const v1BiggerThenv2 = v1.length > v2.length;
			const maxLensVersion = v1BiggerThenv2 ? v1 : v2;
			for (let i = minVersionLens; i < maxLensVersion.length; i++) {
				const curVersion = Number(maxLensVersion[i])
				if (curVersion > 0) {
					v1BiggerThenv2 ? result = 1 : result = -1
					break;
				}
			}
		}

		return result;
	}

	export default {
		mixins: [addAndDetail],
		data() {
			return {
				latestVersion: '0.0.0',
				lastVersionId: ''
			}
		},
		async onLoad({
			appid,
			name,
			type
		}) {
			if (appid && type && name) {
				const store_list = await this.getStoreList(appid)
				this.formData = {
					...this.formData,
					...{
						appid,
						name,
						type,
						store_list
					}
				}

				this.latestStableData = await this.getDetail(appid, type)
				// 如果有数据，否则为发布第一版，默认为Android
				if (!this.isWGT && this.latestStableData.length) {
					this.setFormData(platform_Android)
				}
				// 如果是wgt ，则需要将 min_uni_version 设为必填
				if (this.isWGT) {
					this.rules.min_uni_version.rules.push({
						"required": true
					})
				}
			}
		},
		watch: {
			isiOS(val) {
				if (!val && this.hasPackage) {
					this.formData.url = this.appFileList.url
					return;
				}
				this.formData.url = ''
			},
			"formData.platform"(val) {
				this.setFormData(val)
			}
		},
		methods: {
			setFormData(os) {
				uni.showLoading({
					mask: true
				})
				// 每次需初始化 版本 与 id ，因为可能是新增第一版
				this.latestVersion = '0.0.0';
				this.lastVersionId = ''

				const data = this.getData(this.latestStableData, os)[0]

				if (data) {
					const {
						_id,
						version,
						name,
						platform,
						min_uni_version,
						url
					} = data

					this.lastVersionId = _id
					this.latestVersion = version;

					this.formData.name = name

					// 如果不是wgt，则需要删除 min_uni_version 字段
					if (!this.isWGT) {
						delete this.formData.min_uni_version;
						this.formData.platform = platform[0]

						// iOS需要带出上一版本的AppStore链接
						if (this.isiOS) {
							this.formData.url = url;
						}
					} else {
						this.formData.min_uni_version = min_uni_version
						// this.formData.platform = [os]
					}
				} else if (this.isWGT) {
					this.formData.min_uni_version = ''
				}
				uni.hideLoading()
			},
			/**
			 * 触发表单提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.validate(['store_list']).then((res) => {
					if (compare(this.latestVersion, res.version) >= 0) {
						uni.showModal({
							content: `版本号必须大于当前已上线版本（${this.latestVersion}）`,
							showCancel: false
						})
						throw new Error('版本号必须大于已上线版本（${this.latestVersion}）');
					}
					// 如果不是 wgt 更新，则需将 platform 字段还原为 array
					if (!this.isWGT) {
						res.platform = [res.platform]
					}
					if (this.isiOS || this.isWGT) delete res.store_list;
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
				value = this.createCenterRecord(value)
				const collectionDB = db.collection(dbCollectionName)
				// uni-stat 会创建这些字段 appid
				let recordCreateByUniStat = []
				if (!this.isWGT) {
					recordCreateByUniStat = await this.getDetail(value.appid, value.type, this.createStatQuery(value))
				}

				let dbOperate
				if (!recordCreateByUniStat.length) {
					dbOperate = collectionDB.add(value)
				} else {
					value.create_date = Date.now()
					dbOperate = collectionDB.doc(recordCreateByUniStat[0]._id).update(value)
				}

				// 使用 clientDB 提交数据
				dbOperate.then(async (res) => {
					// 如果新增版本为上线发行，且之前有该平台的上线发行，则自动将上一版设为下线
					if (value.stable_publish && this.lastVersionId) {
						await collectionDB.doc(this.lastVersionId).update({
							stable_publish: false
						})
					}
					uni.showToast({
						title: '新增成功'
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
			getDetail(appid, type, args = {}) {
				uni.showLoading({
					mask: true
				})
				return db.collection(dbCollectionName)
					.where(
						Object.assign({
							appid,
							type,
							stable_publish: true
						}, args)
					)
					.field(fields)
					.get()
					.then((res) => res.result.data)
					.catch((err) => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getData(data = [], platform) {
				if (typeof platform === 'string') {
					return data.filter(item => item.platform.includes(platform))
				} else {
					return data.filter(item => item.platform.toString() === platform.toString())
				}
			},
			back() {
				uni.showModal({
					title: '取消发布',
					content: this.hasPackage ? '将会删除已上传的包' : undefined,
					success: res => {
						if (res.confirm) {
							// 若已上传包但取消发布，则自动将包删除
							if (this.hasPackage) {
								this.deleteFile([this.appFileList.url])
							}

							uni.navigateBack()
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss">
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

	.title_padding {
		padding-bottom: 15px;
		display: block;
	}

	::v-deep .uni-file-picker__files {
		max-width: 100%;
	}
</style>
