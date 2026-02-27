<template>
	<view class="uni-container">
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">应用详情</view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="warn" size="mini" @click="deleteApp">删除</button>
			</view>
		</view>
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="appid" label="AppID" required>
				<uni-easyinput :disabled="true" v-model="formData.appid" />
			</uni-forms-item>
			<uni-forms-item name="name" label="应用名称" required>
				<uni-easyinput :disabled="true" v-model="formData.name" />
			</uni-forms-item>
			<uni-forms-item name="description" label="应用描述" required>
				<view v-if="detailsState">
					<rich-text :nodes="formData.description"></rich-text>
					<text></text>
				</view>
				<textarea v-else auto-height style="box-sizing: content-box;" :disabled="detailsState"
					@input="binddata('description', $event.detail.value)" class="uni-textarea-border"
					:value.sync="formData.description"></textarea>
			</uni-forms-item>
			<uni-forms-item name="create_date" label="创建时间">
				<uni-dateformat format="yyyy-MM-dd hh:mm:ss" :date="formData.create_date" :threshold="[0, 0]" />
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
		validator
	} from '@/uni_modules/uni-upgrade-center/js_sdk/validator/opendb-app-list.js';
	import {
		deepClone,
		appListDbName,
		appVersionListDbName
	} from '../utils.js'

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = appListDbName;

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
		data() {
			return {
				originalData: {},
				detailsState: true, // 查看状态
				formData: {
					"appid": "",
					"name": "",
					"description": "",
					"create_date": null
				},
				formOptions: {},
				rules: {
					...getValidator(["appid", "name", "description", "create_date"])
				}
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			this.getDetail(id)
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		methods: {
			/**
			 * 触发表单提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.submit().then((res) => {
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},
			submitForm(value) {
				// 使用 clientDB 提交数据
				db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
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
				db.collection(dbCollectionName).doc(id).field('appid,name,description').get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.originalData = deepClone(data)
						this.formData = data
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
			deleteApp() {
				uni.showModal({
					title: '提示',
					content: '是否删除该应用，包括版本记录\n注意：此操作不可逆',
					success: res => {
						if (res.confirm) {
							uni.showLoading({
								title: '删除应用...',
								mask: true
							})
							db.collection(dbCollectionName).doc(this.formDataId).remove()
								.then(async () => {
									uni.showLoading({
										title: '删除版本记录...',
										mask: true
									})
									await this.deleteAppVersion();
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
			cancelEdit() {
				uni.showModal({
					title: '取消修改',
					content: '',
					success: res => {
						if (res.confirm) {
							this.formData = deepClone(this.originalData)
							this.detailsState = true
						}
					}
				});
			},
			async deleteAppVersion() {
				return db.collection(appVersionListDbName).where({
					appid: this.formData.appid
				}).remove();
			}
		}
	}
</script>
