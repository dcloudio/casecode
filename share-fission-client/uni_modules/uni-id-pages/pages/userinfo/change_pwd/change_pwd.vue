<!-- 修改密码 -->
<template>
	<view class="uni-content">
		<match-media :min-width="690">
			<view class="login-logo">
				<image :src="logo"></image>
			</view>
			<!-- 顶部文字 -->
			<text class="title title-box">修改密码</text>
		</match-media>
		<uni-forms ref="form" :value="formData" err-show-type="toast">
			<uni-forms-item name="oldPassword">
				<uni-easyinput :focus="focusOldPassword" @blur="focusOldPassword = false" class="input-box"
					type="password" :inputBorder="false" v-model="formData.oldPassword" placeholder="请输入旧密码">
				</uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="newPassword">
				<uni-easyinput :focus="focusNewPassword" @blur="focusNewPassword = false" class="input-box"
					type="password" :inputBorder="false" v-model="formData.newPassword" placeholder="请输入新密码">
				</uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="newPassword2">
				<uni-easyinput :focus="focusNewPassword2" @blur="focusNewPassword2 = false" class="input-box"
					type="password" :inputBorder="false" v-model="formData.newPassword2" placeholder="请再次输入新密码">
				</uni-easyinput>
			</uni-forms-item>
			<button class="uni-btn send-btn-box" type="primary" @click="submit">提交</button>
		</uni-forms>
	</view>
</template>

<script>
	import mixin from '@/uni_modules/uni-id-pages/common/login-page.mixin.js';
  import passwordMod from '@/uni_modules/uni-id-pages/common/password.js'
  const uniIdCo = uniCloud.importObject("uni-id-co", {
		customUI:true
	})
	export default {
		mixins: [mixin],
		data() {
			return {
				focusOldPassword: false,
				focusNewPassword: false,
				focusNewPassword2: false,
				formData: {
					'oldPassword': '',
					'newPassword': '',
					'newPassword2': '',
				},
				rules: {
					oldPassword: {
						rules: [{
								required: true,
								errorMessage: '请输入新密码',
							},
							{
								pattern: /^.{6,20}$/,
								errorMessage: '密码为6 - 20位',
							}
						]
					},
          ...passwordMod.getPwdRules('newPassword', 'newPassword2')
        },
				logo: "/static/logo.png"
			}
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		onShow() {
			// #ifdef H5
			document.onkeydown = event => {
				var e = event || window.event;
				if (e && e.keyCode == 13) { //回车键的键值为13
					this.submit()
				}
			};
			// #endif
		},
		methods: {
			/**
			 * 完成并提交
			 */
			submit() {
				this.$refs.form.validate()
					.then(res => {
						let {
							oldPassword,
							newPassword
						} = this.formData
						uniIdCo.updatePwd({
								oldPassword,
								newPassword
							}).then(e => {
								uni.removeStorageSync('uni_id_token');
								uni.setStorageSync('uni_id_token_expired', 0)
								uni.redirectTo({
									url:'/uni_modules/uni-id-pages/pages/login/login-withpwd'
								})
							}).catch(e => {
								uni.showModal({
									content: e.message,
									showCancel: false
								});
							})
					}).catch(errors => {
						let key = errors[0].key
						key = key.replace(key[0], key[0].toUpperCase())
						this['focus' + key] = true
					})
			}
		}
	}
</script>

<style lang="scss">
	@import "@/uni_modules/uni-id-pages/common/login-page.scss";

	@media screen and (max-width: 690px) {
		.uni-content{
			margin-top: 15px;
		}
	}

	@media screen and (min-width: 690px) {
		.uni-content{
			padding: 30px 40px 40px;
		}
	}
</style>
