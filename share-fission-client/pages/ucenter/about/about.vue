<template>
	<view class="about">
		<view class="box">
			<image class="logoImg" :src="about.logo"></image>
			<text class="tip appName">{{about.appName}}</text>
			<text class="tip">Version {{version}}</text>
			<view class="qrcode">
				<!--uqrcode 组件来源，插件Sansnn-uQRCode 链接地址：https://ext.dcloud.net.cn/plugin?id=1287-->
				<uqrcode :size="100" canvas-id="qrcode" :value="about.download"></uqrcode>
			</view>
			
			<text class="tip">扫描二维码，您的朋友也可以下载 {{about.appName}} 客户端</text>
		</view>
		<view class="copyright">
			<view class="agreement-box" v-for="(agreement,index) in agreements" :key="index">
				<text class="agreement" @click="navigateTo(agreement)">《{{agreement.title}}》</text>
				<text class="hint" v-if="agreements.length-1>index">和</text>
			</view>
			<text class="hint">Copyright © {{year}}</text>
			<text class="hint">{{about.company}}</text>
		</view>
	</view>
</template>
<script>
// #ifdef APP
	import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js';
	const uniShare = new UniShare()
// #endif
	import uniIdPagesConfig from '@/uni_modules/uni-id-pages/config.js';
	import uqrcode from "@/uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode"
	export default {
		components:{
			uqrcode
		},
		// #ifdef APP
		onBackPress({from}) {
			if(from=='backbutton'){
				this.$nextTick(function(){
					uniShare.hide()
				})
				return uniShare.isShow;
			}
		},
		// #endif
		onLoad() {
			// #ifdef APP-PLUS
			this.version = plus.runtime.version
			// #endif
		},
		computed: {
			uniStarterConfig() {
				return getApp().globalData.config
			},
			agreements() {
				if(!uniIdPagesConfig.agreements){
					return []
				}
				let {serviceUrl,privacyUrl} = uniIdPagesConfig.agreements
				return [
					{
						url:serviceUrl,
						title:"用户服务协议"
					},
					{
						url:privacyUrl,
						title:"隐私政策条款"
					}
				]
			}
		},
		data() {
			return {
				version: "V1.0.0",
				year: "2020",
				about: {}
			};
		},
		created() {
			this.about = this.uniStarterConfig.about
			uni.setNavigationBarTitle({
				title: "关于" + " " + this.about.appName
			})
			this.year = (new Date).getFullYear()
		},
		onNavigationBarButtonTap() {
			let {
				download,
				appName,
				slogan,
				logo
			} = this.about
			uniShare.show({
				content: { //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
					type: 0,
					href: download,
					title: appName,
					summary: slogan,
					imageUrl: logo + '?x-oss-process=image/resize,m_fill,h_100,w_100' //压缩图片解决，在ios端分享图过大导致的图片失效问题
				},
				menus: [{
						"img": "/static/app/sharemenu/wechatfriend.png",
						"text": "微信好友",
						"share": {
							"provider": "weixin",
							"scene": "WXSceneSession"
						}
					},
					{
						"img": "/static/app/sharemenu/wechatmoments.png",
						"text":  "微信朋友圈",
						"share": {
							"provider": "weixin",
							"scene": "WXSceneTimeline"
						}
					},
					{
						"img": "/static/app/sharemenu/weibo.png",
						"text":  "微博",
						"share": {
							"provider": "sinaweibo"
						}
					},
					{
						"img": "/static/app/sharemenu/qq.png",
						"text": "QQ",
						"share": {
							"provider": "qq"
						}
					},
					{
						"img": "/static/app/sharemenu/copyurl.png",
						"text": "复制",
						"share": "copyurl"
					},
					{
						"img": "/static/app/sharemenu/more.png",
						"text": "更多",
						"share": "shareSystem"
					}
				],
				cancelText: "取消分享",
			}, e => { //callback
				console.log(e);
			})
		},
		methods: {
			navigateTo({
				url,
				title
			}) {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/common/webview/webview?url=' + url + '&title=' + title,
					success: res => {},
					fail: () => {},
					complete: () => {}
				});
			}
		}
	}
</script>
<style lang="scss" scoped>
	view{
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}

	.about {
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.box {
		margin-top: 60px;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.logoImg {
		margin-bottom: 10rpx;
		width: 160rpx;
		height: 160rpx;
		border-radius: 15px;
	}

	.tip {
		text-align: center;
		font-size: 24rpx;
		margin-top: 10px;
		padding: 10rpx;
	}

	.appName {
		margin-top: 20px;
		font-size: 42rpx;
		font-weight: 500;
	}

	.qrcode ,.qrcode .uqrcode{
		margin: 10px 0;
		width: 100px;
		height: 100px;
		display: block;
	}

	.copyright {
		font-size: 32rpx;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		bottom: 20px;
		// left: 0;
		position: fixed;
	}

	.agreement-box {
		justify-content: center;
	}

	.agreement {
		color: #2285ff;
		font-size: 26rpx;
	}

	.hint {
		text-align: center;
		color: #999999;
		font-size: 26rpx;
	}
</style>
