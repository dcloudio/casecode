<template>
	<view class="content">
		<!-- 功能列表 -->
		<uni-list class="mt10" :border="false">
			<uni-list-item title="账号资料" to="/uni_modules/uni-id-pages/pages/userinfo/userinfo" link="navigateTo"></uni-list-item>
			<uni-list-item v-if="userInfo.mobile" title="修改密码" :to="'/pages/ucenter/login-page/pwd-retrieve/pwd-retrieve?phoneNumber='+ userInfo.mobile" link="navigateTo"></uni-list-item>
		</uni-list>
		<uni-list class="mt10" :border="false">
    <!-- #ifdef APP-PLUS -->
    <!-- 检查push过程未结束不显示，push设置项 -->
    <uni-list-item title="清理缓存" @click="clearTmp" link></uni-list-item>
    <uni-list-item v-show="pushIsOn != 'wait'" title="推送功能" @click.native="pushIsOn?pushServer.off():pushServer.on()"  showSwitch :switchChecked="pushIsOn"></uni-list-item>
    <!-- #endif -->
		</uni-list>

		<!-- 退出/登录 按钮 -->
		<view class="bottom-back" @click="changeLoginState">
			<text class="bottom-back-text" v-if="hasLogin">退出登录</text>
			<text class="bottom-back-text" v-else>登录</text>
		</view>
	</view>
</template>

<script>
	import pushServer from './dc-push/push.js';
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
		data() {
			return {
				pushServer:pushServer,
				pushIsOn:"wait",
				userInfo:{}
			}
		},
		computed: {
			hasLogin(){
				return store.hasLogin
			}
		},
		onLoad() {
			uni.setNavigationBarTitle({
				title: "设置"
			})
		},
		onShow() {
			// 检查手机端获取推送是否开启
			//#ifdef APP-PLUS
			setTimeout(()=>{
				this.pushIsOn = pushServer.isOn();
			},300)
			//#endif
		},
		methods: {
			async changeLoginState(){
				if(this.hasLogin){
					await mutations.logout()
				}else{
					uni.redirectTo({
						url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
					});
				}
			},
			checkIsSoterEnrolledInDevice({checkAuthMode,title}) {
				return new Promise((resolve, reject) => {
					uni.checkIsSoterEnrolledInDevice({
						checkAuthMode,
						success: (res) => {
							console.log(res);
							if (res.isEnrolled) {
								return resolve(res);
							}
							uni.showToast({
								title: "设备未开启"+ `${title}`,
								icon: 'none'
							});
							reject(res);
						},
						fail: (err) => {
							console.log(err);
							uni.showToast({
								title: `${title}` + "失败",
								icon: 'none'
							});
							reject(err);
						}
					})
				})
			},
						clearTmp() {
							uni.showLoading({
								title: "清除中",
								mask: true
							});
							/*
							任何临时存储或删除不直接影响程序运行逻辑（清除缓存必定造成业务逻辑的变化，如：打开页面的图片不从缓存中读取而从网络请求）的内容都可以视为缓存。主要有storage、和file写入。
							缓存分为三部分
								原生层（如：webview、x5播放器的、第三方sdk的、地图组件等）
								前端框架（重启就会自动清除）
								开发者自己的逻辑（如：
									本示例的 检测更新功能下载了apk安装包，
									其他逻辑需要根据开发者自己的业务设计
									比如：有聊天功能的应用，聊天记录是否视为缓存，还是单独提供清除聊天记录的功能由开发者自己设计
								）
							*/
							uni.getSavedFileList({
								success:res=>{
									if (res.fileList.length > 0) {
										uni.removeSavedFile({
											filePath: res.fileList[0].filePath,
											complete:res=>{
												console.log(res);
												uni.hideLoading()
												uni.showToast({
													title: "清除成功",
													icon: 'none'
												});
											}
										});
									}else{
										uni.hideLoading()
										uni.showToast({
											title: "清除成功",
											icon: 'none'
										});
									}
								},					complete:e=>{
						console.log(e);
					}
				});
			}
		}
	}
</script>

<style>
	page {
		flex: 1;
		width: 100%;
		height: 100%;
	}

	uni-button:after {
		border: none;
		border-radius: 0;
	}

	.content {
		display: flex;
		width: 100%;
		height: 100vh;
		flex-direction: column;
		flex: 1;
		background-color: #F9F9F9;
	}

	.bottom-back {
    flex-direction: column;
    justify-content: center;
    align-items: center;
		margin-top: 10px;
		width: 750rpx;
		height: 44px;
		display: flex;
    width: 100%;
    border: none;
		border-width: 0;
		border-radius: 0;
		background-color: #FFFFFF;
	}

	.bottom-back-text {
		font-size: 33rpx;
	}

	.mt10 {
		margin-top: 10px;
	}

	.content ::v-deep .uni-list {
		background-color: #F9F9F9;
	}
	.content ::v-deep .uni-list-item--disabled,.list-item {
		height: 50px;
		margin-bottom: 1px;
	}

</style>
