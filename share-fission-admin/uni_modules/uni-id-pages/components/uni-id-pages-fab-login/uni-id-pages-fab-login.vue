<template>
	<view>
		<view class="fab-login-box">
			<view class="item" v-for="(item,index) in servicesList" :key="index"
				@click="item.path?toPage(item.path):login_before(item.id,false)">
				<image class="logo" :src="item.logo" mode="scaleToFill"></image>
				<text class="login-title">{{item.text}}</text>
			</view>
		</view>
	</view>
</template>
<script>
	import config from '@/uni_modules/uni-id-pages/config.js'
	//前一个窗口的页面地址。控制点击切换快捷登录方式是创建还是返回
	import {store,mutations} from '@/uni_modules/uni-id-pages/common/store.js'
	let allServicesList = []
	export default {
		computed: {
			agreements() {
				if (!config.agreements) {
					return []
				}
				let {
					serviceUrl,
					privacyUrl
				} = config.agreements
				return [{
						url: serviceUrl,
						title: "用户服务协议"
					},
					{
						url: privacyUrl,
						title: "隐私政策条款"
					}
				]
			},
			agree: {
				get() {
					return this.getParentComponent().agree
				},
				set(agree) {
					return this.getParentComponent().agree = agree
				}
			}
		},
		data() {
			return {
				servicesList: [{
						"id": "username",
						"text": "账号登录",
						"logo": "/uni_modules/uni-id-pages/static/login/uni-fab-login/user.png",
						"path": "/uni_modules/uni-id-pages/pages/login/login-withpwd"
					},
					{
						"id": "smsCode",
						"text": "短信验证码",
						"logo": "/uni_modules/uni-id-pages/static/login/uni-fab-login/sms.png",
						"path": "/uni_modules/uni-id-pages/pages/login/login-withoutpwd?type=smsCode"
					},
					{
						"id": "weixin",
						"text": "微信登录",
						"logo": "/uni_modules/uni-id-pages/static/login/uni-fab-login/weixin.png",
					},
					// #ifndef MP-WEIXIN
					{
						"id": "apple",
						"text": "苹果登录",
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/apple.png",
					},
					{
						"id": "univerify",
						"text": "一键登录",
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/univerify.png",
					},
					{
						"id": "taobao",
						"text": "淘宝登录", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/taobao.png",
					},
					{
						"id": "facebook",
						"text": "脸书登录", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/facebook.png",
					},
					{
						"id": "alipay",
						"text": "支付宝登录", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/alipay.png",
					},
					{
						"id": "qq",
						"text": "QQ登录", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/qq.png",
					},
					{
						"id": "google",
						"text": "谷歌登录", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/google.png",
					},
					{
						"id": "douyin",
						"text": "抖音登录", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/douyin.png",
					},
					{
						"id": "sinaweibo",
						"text": "新浪微博", //暂未提供该登录方式的接口示例
						"logo": "/uni_modules/uni-id-pages/static/app-plus/uni-fab-login/sinaweibo.png",
					}
					// #endif
				],
				univerifyStyle: { //一键登录弹出窗的样式配置参数
					"fullScreen": true, // 是否全屏显示，true表示全屏模式，false表示非全屏模式，默认值为false。
					"backgroundColor": "#ffffff", // 授权页面背景颜色，默认值：#ffffff
					"buttons": { // 自定义登录按钮
						"iconWidth": "45px", // 图标宽度（高度等比例缩放） 默认值：45px
						"list": []
					},
					"privacyTerms": {
						"defaultCheckBoxState": false, // 条款勾选框初始状态 默认值： true
						"textColor": "#BBBBBB", // 文字颜色 默认值：#BBBBBB
						"termsColor": "#5496E3", //  协议文字颜色 默认值： #5496E3
						"prefix": "我已阅读并同意", // 条款前的文案 默认值：“我已阅读并同意”
						"suffix": "并使用本机号码登录", // 条款后的文案 默认值：“并使用本机号码登录”
						"privacyItems": []
					}
				}
			}
		},
		watch: {
			agree(agree) {
				this.univerifyStyle.privacyTerms.defaultCheckBoxState = agree
			}
		},
		async created() {
			let servicesList = this.servicesList
			let loginTypes = config.loginTypes

			servicesList = servicesList.filter(item => {

				// #ifndef APP
				//非app端去掉apple登录
				if (item.id == 'apple') {
					return false
				}
				// #endif

				// #ifdef APP
				//去掉非ios系统上的apple登录
				if (item.id == 'apple' && uni.getSystemInfoSync().osName != 'ios') {
					return false
				}
				// #endif

				return loginTypes.includes(item.id)
			})
			//处理一键登录
			if (loginTypes.includes('univerify')) {
				this.univerifyStyle.privacyTerms.privacyItems = this.agreements
				//设置一键登录功能底下的快捷登录按钮
				servicesList.forEach(({
					id,
					logo,
					path
				}) => {
					if (id != 'univerify') {
						this.univerifyStyle.buttons.list.push({
							"iconPath": logo,
							"provider": id,
							path //路径用于点击快捷按钮时判断是跳转页面
						})
					}
				})
			}
			//	console.log(servicesList);

			//去掉当前页面对应的登录选项
			this.servicesList = servicesList.filter(item => {
				let path = item.path ? item.path.split('?')[0] : '';
				return path != this.getRoute(1)
			})
		},
		methods: {
			getParentComponent(){
				// #ifndef H5
				return this.$parent;
				// #endif

				// #ifdef H5
				return this.$parent.$parent;
				// #endif
			},
			setUserInfo(e) {
				console.log('setUserInfo', e);
			},
			getRoute(n = 0) {
				let pages = getCurrentPages();
				if (n > pages.length) {
					return ''
				}
				return '/' + pages[pages.length - n].route
			},
			toPage(path,index = 0) {
				//console.log('比较', this.getRoute(1),this.getRoute(2), path)
				if (this.getRoute(1) == path.split('?')[0] && this.getRoute(1) ==
					'/uni_modules/uni-id-pages/pages/login/login-withoutpwd') {
					//如果要被打开的页面已经打开，且这个页面是 /uni_modules/uni-id-pages/pages/index/index 则把类型参数传给他
					let loginType = path.split('?')[1].split('=')[1]
					uni.$emit('uni-id-pages-setLoginType', loginType)
				} else if (this.getRoute(2) == path) { // 如果上一个页面就是，马上要打开的页面，直接返回。防止重复开启
					uni.navigateBack();
				} else if (this.getRoute(1) != path) {
					if(index === 0){
						uni.navigateTo({
							url: path,
							animationType: 'slide-in-left',
							complete(e) {
								// console.log(e);
							}
						})
					}else{
						uni.redirectTo({
							url: path,
							animationType: 'slide-in-left',
							complete(e) {
								// console.log(e);
							}
						})
					}
				} else {
					console.log('出乎意料的情况,path：' + path);
				}
			},
			async login_before(type, navigateBack = true, options = {}) {
				console.log(type);
				//提示空实现
				if (["qq",
						"xiaomi",
						"sinaweibo",
						"taobao",
						"facebook",
						"google",
						"alipay",
						"douyin",
					].includes(type)) {
					return uni.showToast({
						title: '该登录方式暂未实现，欢迎提交pr',
						icon: 'none',
						duration: 3000
					});
				}

				//检查当前环境是否支持这种登录方式
				// #ifdef APP
				let isAppExist = true
				await new Promise((callback) => {
					plus.oauth.getServices(oauthServices => {
						let index = oauthServices.findIndex(e => e.id == type)
						if(index != -1){
							isAppExist = oauthServices[index].nativeClient
							callback()
						}else{
							return uni.showToast({
								title: '当前设备不支持此登录，请选择其他登录方式',
								icon: 'none',
								duration: 3000
							});
						}
					}, err => {
						throw new Error('获取服务供应商失败：' + JSON.stringify(err))
					})
				})
				// #endif

				if (
					// #ifdef APP
					!isAppExist
					// #endif

					//非app端使用了，app特有登录方式
					// #ifndef APP
					["univerify","apple"].includes(type)
					// #endif

				) {
					return uni.showToast({
						title: '当前设备不支持此登录，请选择其他登录方式',
						icon: 'none',
						duration: 3000
					});
				}

				//判断是否需要弹出隐私协议授权框
				let needAgreements = (config?.agreements?.scope || []).includes('register')
				if (type != 'univerify' && needAgreements && !this.agree) {
					let agreementsRef = this.getParentComponent().$refs.agreements
					return agreementsRef.popup(() => {
						this.login_before(type, navigateBack, options)
					})
				}

				// #ifdef H5
					if(type == 'weixin'){
						// console.log('开始微信网页登录');
						// let redirectUrl = location.protocol +'//'+
						// 				document.domain +
						// 				(window.location.href.includes('#')?'/#':'') +
						// 				'/uni_modules/uni-id-pages/pages/login/login-withoutpwd?is_weixin_redirect=true&type=weixin'
            // #ifdef VUE2
            const baseUrl = process.env.BASE_URL
            // #endif
            // #ifdef VUE3
            const baseUrl = import.meta.env.BASE_URL
            // #endif

            let redirectUrl = location.protocol +
                '//' +
                location.host +
                baseUrl.replace(/\/$/, '') +
                (window.location.href.includes('#')?'/#':'') +
                '/uni_modules/uni-id-pages/pages/login/login-withoutpwd?is_weixin_redirect=true&type=weixin'

						// console.log('redirectUrl----',redirectUrl);
						let ua = window.navigator.userAgent.toLowerCase();
						if (ua.match(/MicroMessenger/i) == 'micromessenger'){
							// console.log('在微信公众号内');
							return window.open(`https://open.weixin.qq.com/connect/oauth2/authorize?
										appid=${config.appid.weixin.h5}
										&redirect_uri=${encodeURIComponent(redirectUrl)}
										&response_type=code
										&scope=snsapi_userinfo
										&state=STATE&connect_redirect=1#wechat_redirect`);

						}else{
							// console.log('非微信公众号内');
							return location.href = `https://open.weixin.qq.com/connect/qrconnect?appid=${config.appid.weixin.web}
											&redirect_uri=${encodeURIComponent(redirectUrl)}
											&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect`
						}
					}
				// #endif

				uni.showLoading({
					mask: true
				})

				if (type == 'univerify') {
					let univerifyManager = uni.getUniverifyManager()
					let clickAnotherButtons = false
					let onButtonsClickFn = async res => {
						console.log('点击了第三方登录，provider：', res, res.provider, this.univerifyStyle.buttons.list);
						clickAnotherButtons = true
						let checkBoxState = await uni.getCheckBoxState();
						// 同步一键登录弹出层隐私协议框是否打勾
						// #ifdef VUE2
						this.agree = checkBoxState[1].state
						// #endif
						// #ifdef VUE3
						this.agree = checkBoxState.state
						// #endif
						let {
							path
						} = this.univerifyStyle.buttons.list[res.index]
						if (path) {
							if( this.getRoute(1).includes('login-withoutpwd') && path.includes('login-withoutpwd') ){
								this.getParentComponent().showCurrentWebview()
							}
							this.toPage(path,1)
							closeUniverify()
						} else {
							if (this.agree) {
								closeUniverify()
								setTimeout(() => {
									this.login_before(res.provider)
								}, 500)
							} else {
								uni.showToast({
									title: "你未同意隐私政策协议",
									icon: 'none',
									duration: 3000
								});
							}
						}
					}

					function closeUniverify() {
						uni.hideLoading()
						univerifyManager.close()
						// 取消订阅自定义按钮点击事件
						univerifyManager.offButtonsClick(onButtonsClickFn)
					}
					// 订阅自定义按钮点击事件
					univerifyManager.onButtonsClick(onButtonsClickFn)
					// 调用一键登录弹框
					return univerifyManager.login({
						"univerifyStyle": this.univerifyStyle,
						success: res => {
							this.login(res.authResult, 'univerify')
						},
						fail(err) {
							console.log(err)
							if(!clickAnotherButtons){
								uni.navigateBack()
							}
							// uni.showToast({
							// 	title: JSON.stringify(err),
							// 	icon: 'none',
							// 	duration: 3000
							// });
						},
						complete: async e => {
							uni.hideLoading()
							//同步一键登录弹出层隐私协议框是否打勾
							// this.agree = (await uni.getCheckBoxState())[1].state
							// 取消订阅自定义按钮点击事件
							univerifyManager.offButtonsClick(onButtonsClickFn)
						}
					})
				}

				if (type === 'weixinMobile') {
					return this.login({
						phoneCode: options.phoneNumberCode
					}, type)
				}

				uni.login({
					"provider": type,
					"onlyAuthorize": true,
					// #ifdef APP
					"univerifyStyle": this.univerifyStyle,
					// #endif
					success: async e => {
						if (type == 'apple') {
							let res = await this.getUserInfo({
								provider: "apple"
							})
							Object.assign(e.authResult, res.userInfo)
							uni.hideLoading()
						}
						this.login(type == 'weixin' ? {
							code: e.code
						} : e.authResult, type)
					},
					fail: async (err) => {
						console.log(err);
						uni.hideLoading()
					}
				})
			},
			login(params, type) { //联网验证登录
				// console.log('执行登录开始----');
				console.log({params,type});
				//toLowerCase
				let action = 'loginBy' + type.trim().replace(type[0], type[0].toUpperCase())
				const uniIdCo = uniCloud.importObject("uni-id-co",{
					customUI:true
				})
				uniIdCo[action](params).then(result => {
					uni.showToast({
						title: '登录成功',
						icon: 'none',
						duration: 2000
					});
					// #ifdef H5
					result.loginType = type
					// #endif
					mutations.loginSuccess(result)
				})
				.catch(e=>{
					uni.showModal({
						content: e.message,
						confirmText:"知道了",
						showCancel: false
					});
				})
				.finally(e => {
					if (type == 'univerify') {
						uni.closeAuthView()
					}
					uni.hideLoading()
				})
			},
			async getUserInfo(e) {
				return new Promise((resolve, reject) => {
					uni.getUserInfo({
						...e,
						success: (res) => {
							resolve(res);
						},
						fail: (err) => {
							uni.showModal({
								content: JSON.stringify(err),
								showCancel: false
							});
							reject(err);
						}
					})
				})
			}
		}
	}
</script>

<style lang="scss">
	/* #ifndef APP-NVUE */
	.fab-login-box,
	.item {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}
	/* #endif */

	.fab-login-box {
		flex-direction: row;
		flex-wrap: wrap;
		width: 750rpx;
		justify-content: space-around;
		position: fixed;
		left: 0;
	}

	.item {
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 200rpx;
		cursor: pointer;
	}

	/* #ifndef APP-NVUE */
	@media screen and (min-width: 690px) {
		.fab-login-box {
			max-width: 500px;
			margin-left: calc(50% - 250px);
		}
		.item {
			height: 160rpx;
		}
	}

	@media screen and (max-width: 690px) {
		.fab-login-box {
			bottom: 10rpx;
		}
	}

	/* #endif */

	.logo {
		width: 60rpx;
		height: 60rpx;
		max-width: 40px;
		max-height: 40px;
		border-radius: 100%;
		border: solid 1px #F6F6F6;
	}

	.login-title {
		text-align: center;
		margin-top: 6px;
		color: #999;
		font-size: 10px;
		width: 70px;
	}
</style>
