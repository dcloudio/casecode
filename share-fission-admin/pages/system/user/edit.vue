<template>
	<view class="uni-container">
		<uni-forms ref="form" v-model="formData" :rules="rules" validateTrigger="bind" @submit="submit">
			<uni-forms-item name="username" label="用户名" required>
				<uni-easyinput v-model="formData.username" :clearable="false" placeholder="请输入用户名" />
			</uni-forms-item>
			<uni-forms-item name="nickname" label="用户昵称" required>
				<uni-easyinput v-model="formData.nickname" :clearable="false" placeholder="请输入用户昵称" />
			</uni-forms-item>
			<uni-forms-item v-if="showPassword" name="password" label="重置密码" key="password">
				<uni-easyinput v-model="formData.password" :clearable="false" placeholder="请输入重置密码">
					<view slot="right" class="cancel-reset-password-btn" @click="trigger">取消</view>
				</uni-easyinput>
			</uni-forms-item>
			<uni-forms-item v-else label="重置密码">
				<span class="reset-password-btn" @click="trigger">点击重置密码</span>
			</uni-forms-item>
			<uni-forms-item name="role" label="角色列表" class="flex-center-x">
				<uni-data-checkbox multiple :localdata="roles" v-model="formData.role" />
			</uni-forms-item>
			<uni-forms-item name="tags" label="用户标签" labelWidth="100" class="flex-center-x">
				<uni-data-checkbox ref="checkboxTags" :multiple="true" v-model="formData.tags" collection="uni-id-tag"
					field="tagid as value, name as text"></uni-data-checkbox>
				<span class="link-btn" @click="gotoTagAdd">新增</span>
				<span class="link-btn" @click="gotoTagList" style="margin-left: 10px;">管理</span>
			</uni-forms-item>
			<uni-forms-item name="authorizedApp" label="可登录应用">
				<view class="uni-forms-item-flex-center-x">
					<uni-data-checkbox :multiple="true" v-model="formData.authorizedApp" :localdata="appList"></uni-data-checkbox>
					<span class="link-btn" @click="gotoAppList">管理</span>
				</view>
				<view v-if="formDataId === userId" class="uni-form-item-tips">当前有未添加的应用{{ unknownAppidsCom }}，建议点击右侧管理进行添加</view>
			</uni-forms-item>
			<uni-forms-item name="mobile" label="手机号">
				<uni-easyinput v-model="formData.mobile" :clearable="false" placeholder="请输入手机号" />
			</uni-forms-item>
			<uni-forms-item name="email" label="邮箱">
				<uni-easyinput v-model="formData.email" :clearable="false" placeholder="请输入邮箱" />
			</uni-forms-item>
			<uni-forms-item name="status" label="用户状态">
				<switch v-if="Number(formData.status) < 2" @change="binddata('status', $event.detail.value)" :checked="formData.status" :disabled="formDataId === userId" />
				<view v-else class="uni-form-item-empty">{{parseUserStatus(formData.status)}}</view>
				<view v-if="formDataId === userId" class="uni-form-item-tips">请勿禁用当前登录的账号</view>
			</uni-forms-item>
			<view class="uni-button-group">
				<button style="width: 100px;" type="primary" class="uni-button" @click="submitForm">{{$t('common.button.submit')}}</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;"><button style="width: 100px;" class="uni-button">{{$t('common.button.back')}}</button></navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	import { validator } from '@/js_sdk/validator/uni-id-users.js';

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
				showPassword: false,
				formData: {
					"username": "",
					"nickname": "",
					"password": undefined,
					"role": [],
					"tags": [],
					"authorizedApp": [],
					"mobile": undefined,
					"email": undefined,
					"status": false //默认禁用
				},
				rules: {
					...getValidator(["username", "password", "role", "mobile", "email"]),
					"status": {
						"rules": [{
							"format": "bool"
						}]
					}
				},
				roles: [],
				userId:"",
				appList:[],
				unknownAppids:[]
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			let userInfo = uni.getStorageSync("uni-id-pages-userInfo") || {};
			this.userId = userInfo._id;
			this.getDetail(id)
			this.loadroles();
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
							this.$refs.checkboxTags.loadData();
						}
					}
				})
			},
			/**
			 * 切换重置密码框显示或隐藏
			 */
			trigger() {
				this.showPassword = !this.showPassword
			},

			/**
			 * 触发表单提交
			 */
			submitForm(form) {
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
					title: '修改中...',
					mask: true
				})

				// 是否启用功能的数据类型转换， 0 正常， 1 禁用
				if (typeof value.status === "boolean") {
					value.status = Number(!value.status)
				}
				value.uid = this.formDataId

				this.$request('updateUser', value).then(() => {
					uni.showToast({
						title: '修改成功'
					})
					const eventChannel = this.getOpenerEventChannel();
					if (eventChannel.emit) eventChannel.emit('refreshData');
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

			resetPWd(resetData) {
				this.$request('system/user/resetPwd', resetData)
					.then().catch(err => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					}).finally()
			},
			/**
			 * 获取表单数据
			 * @param {Object} id
			 */
			getDetail(id) {
				uni.showLoading({
					mask: true
				})
				db.collection(dbCollectionName)
					.doc(id)
					.field('username,nickname,role,dcloud_appid as authorizedApp,tags,mobile,email,status')
					.get()
					.then((res) => {
						const data = res.result.data[0]
						if (data) {
							if (data.status === undefined) {
								data.status = true
							}
							if (data.status === 0) {
								data.status = true
							}
							if (data.status === 1) {
								data.status = false
							}
							this.formData = Object.assign(this.formData, data);
							this.loadAppList(this.formData.authorizedApp);
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
			},
			loadAppList(authorizedApp){
				db.collection('opendb-app-list').limit(500).get().then(res => {
					let list = res.result.data.map((item, index) => {
						return {
							value: item.appid,
							text: item.name
						}
					});
					if (!list) list = [];
					authorizedApp.map((appid) => {
						let info = list.find((item) => {
							return item.value === appid;
						});
						if (!info) {
							this.unknownAppids.push(appid);
							list.push({
								value: appid,
								text: `未知应用${appid}`
							});
						}
					});
					this.appList = list;
				}).catch(err => {
					uni.showModal({
						title: '提示',
						content: err.message,
						showCancel: false
					})
				})
			},
			// status 对应文字显示
			parseUserStatus(status) {
				if (status === 0) {
					return '启用'
				} else if (status === 1) {
					return '禁用'
				} else if (status === 2) {
					return '审核中'
				} else if (status === 3) {
					return '审核拒绝'
				} else if (status === 4) {
					return '已注销'
				} else if (typeof status !== "undefined") {
					return '未知'
				} else {
					return '启用'
				}
			}
		},
		computed:{
			unknownAppidsCom(){
				let str = "";
				this.unknownAppids.map((item, index) => {
					str += item;
					if (index !== this.unknownAppids.length-1){
						str += "、";
					}
				});
				return str;
			}
		}
	}
</script>

<style>
	.reset-password-btn {
		/* height: 100%; */
		line-height: 36px;
		color: #007AFF;
		text-decoration: underline;
		cursor: pointer;
	}

	.cancel-reset-password-btn {
		color: #007AFF;
		padding-right: 10px;
		cursor: pointer;
	}
	::v-deep .uni-forms-item__label {
		width: 90px !important;
	}

	.uni-forms-item-flex-center-x {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}
</style>
