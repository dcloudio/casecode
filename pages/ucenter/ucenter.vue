<template>
	<view class="ucenter">
		<!-- #ifndef H5 -->
		<statusBar></statusBar>
		<!-- #endif -->

		<!-- 用户信息卡片 -->
		<view class="user-card" @click.capture="toUserInfo">
			<view class="user-avatar">
				<cloud-image width="120rpx" height="120rpx" v-if="hasLogin && userInfo.avatar_file && userInfo.avatar_file.url" :src="userInfo.avatar_file.url"></cloud-image>
				<view v-else class="default-avatar">
					<uni-icons color="#4299E1" size="40" type="person-filled" />
				</view>
			</view>
			<view class="user-info">
				<text class="user-name">{{ hasLogin ? (userInfo.nickname || userInfo.username || userInfo.mobile) : '未登录' }}</text>
				<text class="user-tip">{{ hasLogin ? '点击更新个人信息' : '点击登录/注册' }}</text>
			</view>
			<uni-icons type="right" size="18" color="#FFFFFF"></uni-icons>
		</view>

		<!-- 功能入口 -->
		<view class="section-card">
			<view class="section-title">
				<text class="title-text">常用功能</text>
			</view>
			<view class="menu-grid">
				<!-- #ifdef APP-PLUS -->
				<view class="menu-item" @click="gotoMarket">
					<view class="menu-icon">
						<uni-icons type="star" size="22" color="#3182CE"></uni-icons>
					</view>
					<text class="menu-text">去评分</text>
				</view>
				<!-- #endif -->
				<view class="menu-item" @click="getScore">
					<view class="menu-icon">
						<uni-icons type="paperplane" size="22" color="#3182CE"></uni-icons>
					</view>
					<text class="menu-text">我的积分</text>
				</view>
				<view class="menu-item" @click="navigateTo('/pages/ucenter/withdraw/withdraw')">
					<view class="menu-icon">
						<uni-icons type="wallet" size="22" color="#3182CE"></uni-icons>
					</view>
					<text class="menu-text">积分提现</text>
				</view>
				<view class="menu-item" @click="navigateTo('/pages/ucenter/distribution-invite/distribution-invite')">
					<view class="menu-icon">
						<uni-icons type="redo" size="22" color="#3182CE"></uni-icons>
					</view>
					<text class="menu-text">分销推荐</text>
				</view>
			</view>
		</view>

		<!-- 其他功能列表 -->
		<view class="section-card">
			<view class="section-title">
				<text class="title-text">更多服务</text>
			</view>
			<view class="menu-list">
				<view class="list-item" @click="navigateTo('/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback')">
					<view class="item-left">
						<uni-icons type="help" size="20" color="#6B7280"></uni-icons>
						<text class="item-text">问题与反馈</text>
					</view>
					<uni-icons type="right" size="16" color="#CBD5E0"></uni-icons>
				</view>
				<view class="list-item" @click="navigateTo('/pages/ucenter/settings/settings')">
					<view class="item-left">
						<uni-icons type="gear" size="20" color="#6B7280"></uni-icons>
						<text class="item-text">设置</text>
					</view>
					<uni-icons type="right" size="16" color="#CBD5E0"></uni-icons>
				</view>
				<!-- #ifdef APP-PLUS -->
				<view class="list-item" @click="checkVersion">
					<view class="item-left">
						<uni-icons type="loop" size="20" color="#6B7280"></uni-icons>
						<text class="item-text">检查更新</text>
					</view>
					<view class="item-right">
						<text class="item-version">{{ appVersion.version }}-{{ appVersion.versionCode }}</text>
						<view v-if="appVersion.hasNew" class="update-badge"></view>
						<uni-icons type="right" size="16" color="#CBD5E0"></uni-icons>
					</view>
				</view>
				<view class="list-item" @click="navigateTo('/pages/ucenter/about/about')">
					<view class="item-left">
						<uni-icons type="info" size="20" color="#6B7280"></uni-icons>
						<text class="item-text">关于</text>
					</view>
					<uni-icons type="right" size="16" color="#CBD5E0"></uni-icons>
				</view>
				<!-- #endif -->
			</view>
		</view>
	</view>
</template>

<script>
	import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
	import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
	import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version';
	import {store} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
		components: {
			statusBar
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
		data() {
			return {}
		},
		onLoad() {},
		onShow() {},
		computed: {
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
/* 页面通用样式 - V3 浅蓝色主题 */
view {
	display: flex;
	box-sizing: border-box;
	flex-direction: column;
}

.ucenter {
	min-height: 100vh;
	background: #F7FAFC;
	padding-bottom: 32px;
}

/* 用户信息卡片 */
.user-card {
	background: linear-gradient(135deg, #4299E1 0%, #3182CE 100%);
	margin: 16px;
	padding: 24px;
	border-radius: 20px;
	flex-direction: row;
	align-items: center;
	box-shadow: 0 10px 25px -5px rgba(66, 153, 225, 0.3);
}

.user-avatar {
	margin-right: 16px;
	width: 60px;
	height: 60px;
	border-radius: 50%;
	border: 2px solid rgba(255, 255, 255, 0.5);
}

.default-avatar {
	width: 100%;
	height: 100%;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	justify-content: center;
	align-items: center;
}

.default-avatar .uni-icons {
	color: #FFFFFF !important;
}

.user-info {
	flex: 1;
}

.user-name {
	font-size: 18px;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: 4px;
}

.user-tip {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.9);
}

.user-card .uni-icons[type="right"] {
	color: rgba(255, 255, 255, 0.7) !important;
}

/* 卡片通用样式 */
.section-card {
	background: #FFFFFF;
	margin: 0 16px 16px;
	border-radius: 20px;
	overflow: hidden;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #E2E8F0;
}

.section-title {
	padding: 16px 20px;
	border-bottom: 1px solid #F1F5F9;
}

.title-text {
	font-size: 16px;
	font-weight: 600;
	color: #1A202C;
}

/* 功能入口网格 */
.menu-grid {
	flex-direction: row;
	flex-wrap: wrap;
	padding: 20px 8px 8px;
}

.menu-item {
	width: 25%;
	align-items: center;
	padding: 0 0 20px;
}

.menu-icon {
	width: 52px;
	height: 52px;
	border-radius: 16px;
	justify-content: center;
	align-items: center;
	margin-bottom: 8px;
	background: #EBF8FF !important; /* 统一浅蓝背景色 */
}

.menu-icon .uni-icons {
	color: #3182CE !important; /* 统一深蓝色图标 */
}

.menu-text {
	font-size: 13px;
	color: #2D3748;
	font-weight: 500;
}

/* 列表样式 */
.menu-list {
	padding: 8px 0;
}

.list-item {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px;
}

.item-left {
	flex-direction: row;
	align-items: center;
}

.item-left .uni-icons {
	color: #718096 !important;
	margin-right: 4px;
}

.item-text {
	font-size: 15px;
	color: #2D3748;
	font-weight: 500;
	margin-left: 12px;
}

.item-right {
	flex-direction: row;
	align-items: center;
}

.item-right .uni-icons {
	color: #A0AEC0 !important;
}

.item-version {
	font-size: 14px;
	color: #A0AEC0;
	margin-right: 8px;
}

.update-badge {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: #E53E3E;
	margin-right: 8px;
}
</style>