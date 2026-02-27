<!-- 注销（销毁）账号 -->
<template>
	<view class="uni-content">
		<text class="words" space="emsp">
			一、注销是不可逆操作，注销后:\n
			1.帐号将无法登录、无法找回。\n
			2.帐号所有信息都会清除(个人身份信息、粉丝数等;发布的作品、评论、点赞等;交易信息等)，你
			的朋友将无法通过本应用帐号联系你，请自行备份相关
			信息和数据。\n

			二、重要提示\n
			1.封禁帐号(永久封禁、社交封禁、直播权限封禁)不能申请注销。\n
			2.注销后，你的身份证、三方帐号(微信、QQ、微博、支付宝)、手机号等绑定关系将解除，解除后可以绑定到其他帐号。\n
			3.注销后，手机号可以注册新的帐号，新帐号不会存在之前帐号的任何信息(作品、粉丝、评论、个人信息等)。\n
			4.注销本应用帐号前，需尽快处理帐号下的资金问题。\n
			5.视具体帐号情况而定，注销最多需要7天。\n
		</text>
		<view class="button-group">
			<button @click="nextStep" class="next" type="default">下一步</button>
			<button @click="cancel" type="warn">取消</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {

			}
		},
		onLoad() {},
		methods: {
			cancel() {
				uni.navigateBack()
			},
			nextStep() {
				uni.showModal({
					content: '已经仔细阅读注销提示，知晓可能带来的后果，并确认要注销',
					complete: (e) => {
						if (e.confirm) {
							const uniIdco = uniCloud.importObject("uni-id-co");
							uniIdco.closeAccount().then((e) => {
								uni.showToast({
									title: '注销成功',
									duration: 3000
								});
								uni.removeStorageSync('uni_id_token');
								uni.setStorageSync('uni_id_token_expired', 0)
								uni.navigateTo({
									url:"/uni_modules/uni-id-pages/pages/login/login-withoutpwd"
								})
							})
						} else {
							uni.navigateBack()
						}
					}
				});
			}
		}
	}
</script>

<style>
	.uni-content {
		display: flex;
		flex-direction: column;
		font-size: 28rpx;
	}

	.words {
		padding: 0 26rpx;
		line-height: 46rpx;
		margin-top: 20rpx;
		margin-bottom: 80px;
	}

	.button-group button {
		border-radius: 100px;
		border: none;
		width: 300rpx;
		height: 42px;
		line-height: 42px;
		font-size: 32rpx;
	}

	.button-group button:after {
		border: none;
	}

	.button-group button.next {
		color: #e64340;
		border: solid 1px #e64340;
	}
	.button-group {
		display: flex;
		flex-direction: row;
		position: fixed;
		height: 50px;
		bottom: 10px;
		width: 750rpx;
		justify-content: center;
		align-items: center;
		border-top: solid 1px #e4e6ec;
		padding-top: 10px;
		background-color: #FFFFFF;
		max-width: 690px;
	}
	
	
	@media screen and (min-width: 690px) {
		.uni-content{
			max-width: 690px;
			margin-left: calc(50% - 345px);
		}
	}
</style>
