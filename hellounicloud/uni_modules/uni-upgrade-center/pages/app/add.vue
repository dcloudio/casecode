<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="appid" label="AppID" required>
				<uni-easyinput v-model="formData.appid" />
			</uni-forms-item>
			<uni-forms-item name="name" label="应用名称" required>
				<uni-easyinput v-model="formData.name" />
			</uni-forms-item>
			<uni-forms-item name="description" label="应用描述" required>
				<textarea auto-height style="box-sizing: content-box;" @input="binddata('description', $event.detail.value)" class="uni-textarea-border"
					:value.sync="formData.description"></textarea>
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
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
		appListDbName
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
				formData: {
					"appid": "",
					"name": "",
					"description": ""
				},
				formOptions: {},
				rules: {
					...getValidator(["appid", "name", "description"])
				}
			}
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
				db.collection(dbCollectionName).add(value).then((res) => {
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
			}
		}
	}
</script>
