<template>
	<view class="uni-container">
		<uni-forms labelWidth="80" ref="form" v-model="formData" :rules="rules" validateTrigger="bind" @submit="submit">
			<uni-forms-item name="menu_id" label="标识" required>
				<uni-easyinput v-model="formData.menu_id" :clearable="false" placeholder="请输入菜单项的ID，不可重复" />
			</uni-forms-item>
			<uni-forms-item name="name" label="显示名称" required>
				<uni-easyinput v-model="formData.name" :clearable="false" placeholder="请输入菜单名称" />
			</uni-forms-item>
			<uni-forms-item name="icon" label="图标class" style="margin-bottom: 10px;">
				<uni-easyinput v-model="formData.icon" :clearable="false" placeholder="请输入菜单图标css样式类名">
					<template v-slot:right>
						<span style="color: #007aff; cursor: pointer;padding-right: 10px;" @click="showIconPopup">内置图标</span>
					</template>
				</uni-easyinput>
				<uni-link font-size="12" href="https://uniapp.dcloud.net.cn/uniCloud/admin?id=icon-%e5%9b%be%e6%a0%87" text="如何使用自定义图标？"
				 class="uni-form-item-tips"></uni-link>
			</uni-forms-item>
			<uni-forms-item name="url" label="页面URL">
				<uni-easyinput v-model="formData.url" :clearable="false" placeholder="URL必须是/开头，若URL为空代表是目录而不是叶子节点" />
			</uni-forms-item>
			<uni-forms-item name="sort" label="序号">
				<uni-easyinput v-model="formData.sort" :clearable="false" placeholder="请输入菜单序号（越大越靠后）" />
			</uni-forms-item>
			<uni-forms-item name="parent_id" label="父菜单标识">
				<uni-easyinput :disabled="true" v-model="formData.parent_id" :clearable="false" placeholder="新增菜单时自动填充, 一级菜单不需要填写" />
			</uni-forms-item>
			<uni-forms-item name="permission" label="权限列表" class="flex-center-x">
				<uni-data-checkbox :multiple="true" v-model="formData.permission" collection="uni-id-permissions" :page-size="500" field="permission_name as text, permission_id as value" />
				<view class="uni-form-item-tips">
					当用户拥有以上被选中的权限时，可以访问此菜单。建议仅对子菜单配置权限，父菜单会自动包含。如不选择权限，意味着仅超级管理员可访问本菜单
				</view>
			</uni-forms-item>
			<uni-forms-item name="enable" label="是否启用">
				<switch @change="binddata('enable', $event.detail.value)" :checked="formData.enable" />
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" @click="submitForm" style="width: 100px;">{{$t('common.button.submit')}}</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;"><button class="uni-button" tyle="width: 100px;">{{$t('common.button.back')}}</button></navigator>
			</view>
		</uni-forms>
		<uni-popup class="icon-modal-box" ref="iconPopup" type="center">
			<view class="icon-modal icon-modal-pc">
				<Icons :tag="false" :fix-window="false"/>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import validator from '@/js_sdk/validator/opendb-admin-menus.js';
	import Icons from '@/pages/demo/icons/icons.vue'

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'opendb-admin-menus';

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
		components: {
			Icons
		},
		data() {
			return {
				formData: {
					"menu_id": "",
					"name": "",
					"icon": "",
					"url": "",
					"sort": null,
					"parent_id": "",
					"permission": [],
					"enable": true
				},
				rules: {
					...getValidator(["menu_id", "name", "icon", "url", "sort", "parent_id", "permission", "enable"])
				}
			}
		},
		onLoad(e) {
			if (e.parent_id) {
				this.formData.parent_id = e.parent_id
			}
		},
		methods: {
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
				// 使用 uni-clientDB 提交数据
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
			},
			showIconPopup() {
				this.$refs.iconPopup.open()
			}
		}
	}
</script>
<style scoped>
	.icon-modal-box {
		padding-top: var(--top-window-height);
	}

	.icon-modal {
		width: 350px;
		background-color: #fff;
		height: 500px;
		overflow-y: scroll;
	}

	@media screen and (min-width: 768px) {
		.icon-modal-pc {
			width: 600px;
		}
	}

	::v-deep .uni-forms-item__label {
		width: 90px !important;
	}

</style>
