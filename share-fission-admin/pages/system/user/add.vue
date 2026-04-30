<template>
	<view class="uni-container">
		<uni-forms ref="form" v-model="formData" :rules="rules" validateTrigger="bind" @submit="submit">
			<uni-forms-item name="username" label="用户名" required>
				<uni-easyinput v-model="formData.username" :clearable="false" placeholder="请输入用户名" />
			</uni-forms-item>
			<uni-forms-item name="nickname" label="用户昵称" required>
				<uni-easyinput v-model="formData.nickname" :clearable="false" placeholder="请输入用户昵称" />
			</uni-forms-item>
			<uni-forms-item name="password" label="初始密码" required>
				<uni-easyinput v-model="formData.password" :clearable="false" placeholder="请输入初始密码" />
			</uni-forms-item>
			<uni-forms-item name="role" label="角色列表" class="flex-center-x">
				<uni-data-checkbox multiple :localdata="roles" v-model="formData.role" />
			</uni-forms-item>
			<uni-forms-item name="tags" label="用户标签" labelWidth="100" class="flex-center-x">
				<uni-data-checkbox ref="checkbox" :multiple="true" v-model="formData.tags" collection="uni-id-tag"
					field="tagid as value, name as text"></uni-data-checkbox>
				<span class="link-btn" @click="gotoTagAdd">新增</span>
				<span class="link-btn" @click="gotoTagList" style="margin-left: 10px;">管理</span>
			</uni-forms-item>
			<uni-forms-item name="authorizedApp" label="可登录应用" labelWidth="100" class="flex-center-x">
				<uni-data-checkbox :multiple="true" v-model="formData.authorizedApp" collection="opendb-app-list"
					field="appid as value, name as text"></uni-data-checkbox>
				<span class="link-btn" @click="gotoAppList">管理</span>
			</uni-forms-item>
			<uni-forms-item name="mobile" label="手机号">
				<uni-easyinput v-model="formData.mobile" :clearable="false" placeholder="请输入手机号" />
			</uni-forms-item>
			<uni-forms-item name="email" label="邮箱">
				<uni-easyinput v-model="formData.email" :clearable="false" placeholder="请输入邮箱" />
			</uni-forms-item>
			<uni-forms-item name="status" label="是否启用">
				<switch @change="binddata('status', $event.detail.value)" :checked="formData.status" />
			</uni-forms-item>
			<view class="uni-button-group">
				<button style="width: 100px;" type="primary" class="uni-button"
					@click="submitForm">{{$t('common.button.submit')}}</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;"><button style="width: 100px;"
						class="uni-button">{{$t('common.button.back')}}</button></navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	import {
		validator
	} from '@/js_sdk/validator/uni-id-users.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'uni-id-users';

	function getValidator(fields) {
		let result = {}
		for (let key in validator) {
			if (fields.includes(key)) {
				result[key] = validator[key]
			}
		}
		return result
	}

	export default {
		data() {
			return {
				formData: {
					"username": "",
					"nickname": "",
					"password": "",
					"role": [],
					"authorizedApp": [],
					"tags": [],
					"mobile": undefined,
					"email": undefined,
					"status": true //默认启用
				},
				rules: {
					...getValidator(["username", "password", "role", "mobile", "email"]),
					"status": {
						"rules": [{
							"format": "bool"
						}]
					}
				},
				roles: []
			}
		},
		onLoad() {
			this.loadroles()
		},
		methods: {
			/**
			 * 跳转应用管理的 list 页
			 */
			gotoAppList() {
				uni.navigateTo({
					url: '../app/list'
				})
			},
			gotoTagList() {
				uni.navigateTo({
					url: '../tag/list'
				})
			},
			gotoTagAdd() {
				uni.navigateTo({
					url: '../tag/add',
					events: {
						refreshCheckboxData: () => {
							this.$refs.checkbox.loadData()
						}
					}
				})
			},

			/**
			 * 触发表单提交
			 */
			submitForm() {
				this.$refs.form.submit();
			},

			/**
			 * 表单提交
			 * @param {Object} event 回调参数 Function(callback:{value,errors})
			 */
			submit(event) {
				const {
					value,
					errors
				} = event.detail

				// 表单校验失败页面会提示报错 ，要停止表单提交逻辑
				if (errors) {
					return
				}
				uni.showLoading({
					title: '提交中...',
					mask: true
				})
				// 是否启用功能的数据类型转换， 0 正常， 1 禁用
				if (typeof value.status === "boolean") {
					value.status = Number(!value.status)
				}
				this.$request('addUser', value).then(() => {
					uni.showToast({
						title: '新增成功'
					})
					this.getOpenerEventChannel().emit('refreshData')
					setTimeout(() => uni.navigateBack(), 500)
				}).catch(err => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(err => {
					uni.hideLoading()
				})
			},
			loadroles() {
				db.collection('uni-id-roles').limit(500).get().then(res => {
					const roleIds = []
					this.roles = res.result.data.map(item => {
						roleIds.push(item.role_id)
						return {
							value: item.role_id,
							text: item.role_name
						}
					})
					if (roleIds.indexOf('admin') === -1) {
						this.roles.unshift({
							value: 'admin',
							text: '超级管理员'
						})
					}
				}).catch(err => {
					uni.showModal({
						title: '提示',
						content: err.message,
						showCancel: false
					})
				})
			}
		}
	}
</script>
<style>
	::v-deep .uni-forms-item__label {
		width: 90px !important;
	}
</style>
