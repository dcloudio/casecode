<template>
	<view class="ucenter">
		<view class="mine-scene">
			<view class="mine-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="个人中心">
						<view class="title-cloud" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
						<text class="hero-title">个人中心</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">我</text>
			</view>

			<view class="page-content">
				<view
					class="profile-panel ornate-panel"
					hover-class="profile-panel-pressed"
					role="button"
					aria-label="查看个人资料"
					@click="toUserInfo"
				>
					<view class="panel-content profile-content">
						<view class="user-avatar">
							<cloud-image
								v-if="hasLogin && userInfo.avatar_file?.url"
								:src="userInfo.avatar_file.url"
								width="100%"
								height="100%"
								mode="aspectFill"
							></cloud-image>
							<view v-else class="default-avatar">
								<uni-icons color="#a66f42" size="29" type="person-filled"></uni-icons>
							</view>
						</view>

						<view class="user-info">
							<text class="user-name">{{ hasLogin ? (userInfo.nickname || userInfo.username || userInfo.mobile || '用户') : '未登录' }}</text>
							<text class="user-tip">{{ hasLogin ? '点击更新个人信息' : '点击登录或注册' }}</text>
						</view>

						<view class="profile-arrow">
							<uni-icons type="right" size="18" color="#a96835"></uni-icons>
						</view>
					</view>
				</view>

				<view class="section-panel ornate-panel">
					<view class="panel-content section-panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">常用功能</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<view class="menu-grid">
							<!-- #ifdef APP-PLUS -->
							<view class="menu-item" hover-class="menu-item-pressed" role="button" @click="gotoMarket">
								<view class="menu-icon menu-icon-gold">
									<uni-icons type="star" size="24" color="#c9852d"></uni-icons>
								</view>
								<text class="menu-text">去评分</text>
							</view>
							<!-- #endif -->
							<view class="menu-item" hover-class="menu-item-pressed" role="button" @click="getScore">
								<view class="menu-icon menu-icon-red">
									<uni-icons type="paperplane" size="24" color="#df521d"></uni-icons>
								</view>
								<text class="menu-text">我的积分</text>
							</view>
							<view
								class="menu-item"
								hover-class="menu-item-pressed"
								role="button"
								@click="navigateTo('/pages/ucenter/withdraw/withdraw')"
							>
								<view class="menu-icon menu-icon-green">
									<uni-icons type="wallet" size="24" color="#477c69"></uni-icons>
								</view>
								<text class="menu-text">积分提现</text>
							</view>
							<view
								class="menu-item"
								hover-class="menu-item-pressed"
								role="button"
								@click="navigateTo('/pages/ucenter/distribution-invite/distribution-invite')"
							>
								<view class="menu-icon menu-icon-brown">
									<uni-icons type="redo" size="24" color="#8c5b3b"></uni-icons>
								</view>
								<text class="menu-text">分销推荐</text>
							</view>
						</view>
					</view>
				</view>

				<view class="section-panel ornate-panel service-panel">
					<view class="panel-content service-panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">更多服务</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<view class="menu-list">
							<view
								class="list-item"
								hover-class="list-item-pressed"
								role="button"
								@click="navigateTo('/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback')"
							>
								<view class="item-left">
									<view class="item-icon item-icon-help">
										<uni-icons type="help" size="18" color="#c57d2c"></uni-icons>
									</view>
									<text class="item-text">问题与反馈</text>
								</view>
								<view class="list-arrow">
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>

							<view
								class="list-item"
								hover-class="list-item-pressed"
								role="button"
								@click="navigateTo('/pages/ucenter/settings/settings')"
							>
								<view class="item-left">
									<view class="item-icon item-icon-settings">
										<uni-icons type="gear" size="18" color="#66745f"></uni-icons>
									</view>
									<text class="item-text">设置</text>
								</view>
								<view class="list-arrow">
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>

							<!-- #ifdef APP-PLUS -->
							<view class="list-item" hover-class="list-item-pressed" role="button" @click="checkVersion">
								<view class="item-left">
									<view class="item-icon item-icon-update">
										<uni-icons type="loop" size="18" color="#477c69"></uni-icons>
									</view>
									<text class="item-text">检查更新</text>
								</view>
								<view class="item-right">
									<text class="item-version">{{ appVersion.version }}-{{ appVersion.versionCode }}</text>
									<view v-if="appVersion.hasNew" class="update-badge"></view>
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>

							<view
								class="list-item"
								hover-class="list-item-pressed"
								role="button"
								@click="navigateTo('/pages/ucenter/about/about')"
							>
								<view class="item-left">
									<view class="item-icon item-icon-about">
										<uni-icons type="info" size="18" color="#a9542a"></uni-icons>
									</view>
									<text class="item-text">关于</text>
								</view>
								<view class="list-arrow">
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>
							<!-- #endif -->
						</view>
					</view>
				</view>
			</view>

			<app-tabbar current="mine"></app-tabbar>
		</view>
	</view>
</template>

<script>
	import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
	import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version';
	import {store} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
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
		data() {
			return {
				statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0
			}
		},
		onLoad() {},
		onShow() {
			uni.hideTabBar({
				animation: false
			})
		},
		computed: {
			heroLayoutStyle() {
				const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
				const heroHeight = 178 + safeAreaOffset

				return {
					'--mine-status-bar-height': `${this.statusBarHeight}px`,
					height: `${heroHeight}px`,
					flexBasis: `${heroHeight}px`
				}
			},
			userInfo() {
				return store.userInfo
			},
			hasLogin(){
				return store.hasLogin
			},
			// #ifdef APP-PLUS
			appVersion() {
				return getApp().appVersion
			},
			// #endif
			appConfig() {
				return getApp().globalData.config
			}
		},
		methods: {
			navigateTo(url) {
				uni.navigateTo({ url })
			},
			toSettings() {
				uni.navigateTo({
					url: "/pages/ucenter/settings/settings"
				})
			},
			async checkVersion() {
				let res = await callCheckVersion()
				if (res.result.code > 0) {
					checkUpdate()
				} else {
					uni.showToast({
						title: res.result.message,
						icon: 'none'
					});
				}
			},
			toUserInfo() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
				})
			},
			gotoMarket() {
				// #ifdef APP-PLUS
				if (uni.getSystemInfoSync().platform == "ios") {
					const appstoreid = this.appConfig?.marketId?.ios || '';
					if (appstoreid) {
						plus.runtime.openURL('https://itunes.apple.com/cn/app/id' + appstoreid + '?mt=8', err => {});
					}
				}
				if (uni.getSystemInfoSync().platform == "android") {
					var Uri = plus.android.importClass("android.net.Uri");
					var uri = Uri.parse("market://details?id=" + this.appConfig.marketId.android);
					var Intent = plus.android.importClass('android.content.Intent');
					var intent = new Intent(Intent.ACTION_VIEW, uri);
					var main = plus.android.runtimeMainActivity();
					main.startActivity(intent);
				}
				// #endif
			},
			getScore() {
				if (!this.userInfo) return uni.showToast({
					title: "请登录后查看积分",
					icon: 'none'
				});
				uni.navigateTo({
					url: '/pages/ucenter/points-record/points-record'
				})
			}
		}
	}
</script>

<style scoped>
page,
view,
text,
image,
cloud-image {
	box-sizing: border-box;
	letter-spacing: 0;
}

page {
	min-height: 100%;
	background: #f9e7bd;
}

view {
	display: flex;
	flex-direction: column;
}

.ucenter {
	min-height: 100vh;
	background: #f9e7bd;
}

.mine-scene {
	position: relative;
	width: 100%;
	max-width: 430px;
	min-height: 100vh;
	margin: 0 auto;
	overflow: hidden;
	background: #fae8be;
}

.mine-hero {
	position: relative;
	z-index: 1;
	width: 100%;
	height: 178px;
	flex: 0 0 178px;
	overflow: hidden;
}

.hero-background {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: block;
	width: 100%;
	height: 100%;
}

.hero-content {
	position: relative;
	z-index: 2;
	width: 100%;
	height: 100%;
	padding-top: calc(8px + var(--mine-status-bar-height, 0px));
}

.hero-title-row {
	width: 100%;
	height: 53px;
	flex: 0 0 53px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
}

.hero-title {
	display: block;
	flex-shrink: 0;
	margin: 0 14px;
	color: #71300c;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 44px;
	font-weight: 900;
	line-height: 53px;
	text-align: center;
	text-shadow: 0 1px 0 rgba(255, 248, 220, 0.72), 0 2px 2px rgba(102, 46, 8, 0.12);
	white-space: nowrap;
}

.title-cloud {
	width: 58px;
	height: 20px;
	flex-shrink: 1;
	flex-direction: row;
	align-items: flex-end;
	opacity: 0.88;
}

.title-cloud-right {
	transform: scaleX(-1);
}

.title-cloud-curl {
	width: 22px;
	height: 11px;
	flex-shrink: 0;
	border: 2px solid #d99331;
	border-right: 0;
	border-bottom: 0;
	border-radius: 13px 0 0;
}

.title-cloud-tail {
	width: 36px;
	height: 2px;
	margin-bottom: 1px;
	background: linear-gradient(90deg, #d99331 0%, rgba(217, 147, 49, 0.08) 100%);
}

.lantern-word {
	position: absolute;
	top: 101px;
	left: 31px;
	z-index: 2;
	display: block;
	width: 28px;
	color: #d83711;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
	font-size: 27px;
	font-weight: 900;
	line-height: 34px;
	text-align: center;
	text-shadow: 0 1px 0 rgba(255, 244, 213, 0.72);
}

.page-content {
	position: relative;
	z-index: 3;
	width: 100%;
	margin-top: -34px;
	padding: 0 16px 14px;
}

.ornate-panel {
	position: relative;
	width: 100%;
	border: 2px solid #dfa153;
	background: rgba(254, 248, 235, 0.98);
	box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.92), inset 0 0 0 4px rgba(218, 151, 58, 0.2), 0 5px 13px rgba(125, 66, 19, 0.16);
}

.ornate-panel::before {
	position: absolute;
	top: 7px;
	right: 7px;
	bottom: 7px;
	left: 7px;
	z-index: 0;
	border: 1px solid rgba(223, 164, 82, 0.25);
	content: '';
	pointer-events: none;
}

.panel-content {
	position: relative;
	z-index: 1;
	width: 100%;
}

.profile-panel {
	border-radius: 24px;
	transition: opacity 120ms ease, transform 120ms ease;
}

.profile-panel::before {
	border-radius: 17px;
}

.profile-panel-pressed,
.menu-item-pressed {
	opacity: 0.82;
	transform: scale(0.985);
}

.profile-content {
	min-height: 96px;
	flex-direction: row;
	align-items: center;
	padding: 14px 16px;
}

.user-avatar {
	width: 64px;
	height: 64px;
	flex: 0 0 64px;
	margin-right: 13px;
	overflow: hidden;
	border: 2px solid rgba(221, 159, 73, 0.62);
	border-radius: 50%;
	background: #f6e8ce;
	box-shadow: inset 0 0 0 3px rgba(255, 251, 239, 0.66), 0 3px 7px rgba(111, 61, 21, 0.14);
}

.user-avatar cloud-image {
	display: block;
	width: 100%;
	height: 100%;
}

.default-avatar {
	width: 100%;
	height: 100%;
	flex-direction: row;
	align-items: center;
	justify-content: center;
}

.user-info {
	min-width: 0;
	flex: 1;
	justify-content: center;
}

.user-name,
.user-tip {
	display: block;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.user-name {
	color: #4b170d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 20px;
	font-weight: 700;
	line-height: 27px;
}

.user-tip {
	margin-top: 3px;
	color: #89624c;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	line-height: 19px;
}

.profile-arrow {
	width: 34px;
	height: 34px;
	flex: 0 0 34px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-left: 9px;
	border: 1px solid rgba(216, 155, 70, 0.38);
	border-radius: 50%;
	background: rgba(250, 234, 202, 0.66);
}

.section-panel {
	margin-top: 12px;
	border-radius: 22px;
}

.section-panel::before {
	border-radius: 15px;
}

.section-panel-content {
	padding: 12px 13px 10px;
}

.section-heading {
	height: 28px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 0 10px;
}

.section-title {
	display: block;
	flex-shrink: 0;
	margin: 0 6px;
	color: #4d190f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 18px;
	font-weight: 700;
	line-height: 26px;
}

.heading-rule {
	height: 1px;
	min-width: 12px;
	flex: 1;
	background: linear-gradient(90deg, transparent, #dda143);
}

.heading-rule-right {
	background: linear-gradient(90deg, #dda143, transparent);
}

.heading-ornament {
	display: block;
	flex-shrink: 0;
	color: #dda143;
	font-family: Georgia, serif;
	font-size: 19px;
	line-height: 20px;
}

.heading-ornament-left {
	transform: scaleX(-1);
}

.menu-grid {
	min-height: 95px;
	flex-direction: row;
	align-items: stretch;
	padding: 7px 0 1px;
}

.menu-item {
	min-width: 0;
	flex: 1;
	align-items: center;
	justify-content: center;
	padding: 4px 2px 6px;
	transition: opacity 120ms ease, transform 120ms ease;
}

.menu-icon {
	width: 52px;
	height: 52px;
	flex: 0 0 52px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-bottom: 7px;
	border: 1px solid rgba(218, 151, 58, 0.38);
	border-radius: 50%;
	box-shadow: inset 0 0 0 3px rgba(255, 252, 242, 0.58), 0 2px 5px rgba(111, 61, 21, 0.09);
}

.menu-icon-gold {
	background: #f7e8c8;
}

.menu-icon-red {
	background: #f8dfcc;
}

.menu-icon-green {
	border-color: rgba(87, 132, 113, 0.38);
	background: #e0eadf;
}

.menu-icon-brown {
	background: #eee0d1;
}

.menu-text {
	display: block;
	max-width: 100%;
	overflow: hidden;
	color: #5a2c18;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	font-weight: 600;
	line-height: 20px;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.service-panel-content {
	padding: 12px 13px 7px;
}

.menu-list {
	margin-top: 4px;
}

.list-item {
	width: 100%;
	min-height: 54px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 8px 4px;
	border-bottom: 1px dashed rgba(211, 146, 68, 0.26);
	transition: background-color 120ms ease, opacity 120ms ease;
}

.list-item:last-child {
	border-bottom: 0;
}

.list-item-pressed {
	background: rgba(245, 224, 187, 0.42);
	opacity: 0.82;
}

.item-left {
	min-width: 0;
	flex: 1;
	flex-direction: row;
	align-items: center;
}

.item-icon {
	width: 32px;
	height: 32px;
	flex: 0 0 32px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(218, 151, 58, 0.3);
	border-radius: 50%;
}

.item-icon-help {
	background: #f7e8c8;
}

.item-icon-settings {
	border-color: rgba(102, 116, 95, 0.3);
	background: #e8eadc;
}

.item-icon-update {
	border-color: rgba(71, 124, 105, 0.3);
	background: #e0eadf;
}

.item-icon-about {
	background: #f4dfd0;
}

.item-text {
	display: block;
	min-width: 0;
	margin-left: 11px;
	overflow: hidden;
	color: #4b170d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 15px;
	font-weight: 600;
	line-height: 22px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.list-arrow {
	width: 28px;
	height: 28px;
	flex: 0 0 28px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-left: 8px;
}

.item-right {
	min-width: 0;
	max-width: 58%;
	flex-direction: row;
	align-items: center;
	margin-left: 8px;
}

.item-version {
	display: block;
	min-width: 0;
	margin-right: 7px;
	overflow: hidden;
	color: #96745f;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 12px;
	line-height: 18px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.update-badge {
	width: 8px;
	height: 8px;
	flex: 0 0 8px;
	margin-right: 7px;
	border: 1px solid rgba(255, 223, 174, 0.72);
	border-radius: 50%;
	background: #e94818;
	box-shadow: 0 1px 3px rgba(145, 48, 10, 0.24);
}

@media (min-width: 431px) {
	.mine-scene {
		box-shadow: 0 0 28px rgba(107, 59, 17, 0.18);
	}
}

@media (max-width: 360px) {
	.hero-title {
		margin: 0 9px;
		font-size: 40px;
	}

	.title-cloud {
		width: 48px;
	}

	.page-content {
		padding-right: 12px;
		padding-left: 12px;
	}

	.profile-content {
		padding-right: 12px;
		padding-left: 12px;
	}

	.user-avatar {
		width: 58px;
		height: 58px;
		flex-basis: 58px;
		margin-right: 11px;
	}

	.user-name {
		font-size: 18px;
	}

	.section-panel-content,
	.service-panel-content {
		padding-right: 10px;
		padding-left: 10px;
	}

	.menu-icon {
		width: 48px;
		height: 48px;
		flex-basis: 48px;
	}

	.menu-text {
		font-size: 12px;
	}

	.list-item {
		padding-right: 2px;
		padding-left: 2px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.profile-panel,
	.menu-item,
	.list-item {
		transition: none;
	}
}
</style>
