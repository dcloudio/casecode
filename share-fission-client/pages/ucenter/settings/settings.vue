<template>
	<view class="settings-page">
		<view class="settings-scene">
			<view class="settings-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="设置">
						<view
							class="back-button"
							hover-class="back-button-pressed"
							role="button"
							tabindex="0"
							aria-label="返回"
							@click="goBack"
							@keyup.enter="goBack"
						>
							<uni-icons type="back" size="22" color="#71300c"></uni-icons>
						</view>

						<view class="title-cloud" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
						<text class="hero-title">设置</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">设</text>
			</view>

			<view class="page-content">
				<view class="section-panel ornate-panel">
					<view class="panel-content section-panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">账号与安全</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<view class="menu-list">
							<view
								class="list-item"
								hover-class="list-item-pressed"
								role="button"
								tabindex="0"
								@click="navigateTo('/uni_modules/uni-id-pages/pages/userinfo/userinfo')"
								@keyup.enter="navigateTo('/uni_modules/uni-id-pages/pages/userinfo/userinfo')"
							>
								<view class="item-left">
									<view class="item-icon item-icon-profile">
										<uni-icons type="person-filled" size="18" color="#a66f42"></uni-icons>
									</view>
									<view class="item-copy">
										<text class="item-title">账号资料</text>
										<text class="item-description">{{ hasLogin ? '头像、昵称和绑定信息' : '登录后管理个人信息' }}</text>
									</view>
								</view>
								<view class="list-arrow">
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>

							<view
								v-if="hasLogin && hasPassword"
								class="list-item"
								hover-class="list-item-pressed"
								role="button"
								tabindex="0"
								@click="navigateTo('/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd')"
								@keyup.enter="navigateTo('/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd')"
							>
								<view class="item-left">
									<view class="item-icon item-icon-password">
										<uni-icons type="locked-filled" size="17" color="#9a5a31"></uni-icons>
									</view>
									<view class="item-copy">
										<text class="item-title">修改密码</text>
										<text class="item-description">更新当前账号的登录密码</text>
									</view>
								</view>
								<view class="list-arrow">
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- #ifdef APP-PLUS -->
				<view class="section-panel ornate-panel">
					<view class="panel-content section-panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">设备设置</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<view class="menu-list">
							<view
								class="list-item"
								hover-class="list-item-pressed"
								role="button"
								tabindex="0"
								@click="clearTmp"
								@keyup.enter="clearTmp"
							>
								<view class="item-left">
									<view class="item-icon item-icon-cache">
										<uni-icons type="trash-filled" size="17" color="#477c69"></uni-icons>
									</view>
									<view class="item-copy">
										<text class="item-title">清理缓存</text>
										<text class="item-description">释放应用产生的临时文件</text>
									</view>
								</view>
								<view class="list-arrow">
									<uni-icons type="right" size="16" color="#b98253"></uni-icons>
								</view>
							</view>

							<view v-if="pushIsOn !== 'wait'" class="list-item push-item">
								<view class="item-left">
									<view class="item-icon item-icon-push">
										<uni-icons type="notification-filled" size="17" color="#d25223"></uni-icons>
									</view>
									<view class="item-copy">
										<text class="item-title">推送功能</text>
										<text class="item-description">{{ pushIsOn ? '应用消息提醒已开启' : '应用消息提醒已关闭' }}</text>
									</view>
								</view>
				<switch
					class="push-switch"
					:checked="pushIsOn === true"
									color="#e94818"
									aria-label="推送功能"
									@change="togglePush"
								></switch>
							</view>
						</view>
					</view>
				</view>
				<!-- #endif -->

				<button
					class="login-button"
					:class="{ 'login-button-secondary': !hasLogin }"
					hover-class="login-button-pressed"
					@click="changeLoginState"
				>
					<uni-icons :type="hasLogin ? 'undo' : 'person-filled'" size="18" color="#fffdf5"></uni-icons>
					<text class="login-button-text">{{ hasLogin ? '退出登录' : '立即登录' }}</text>
				</button>
				<text class="login-hint">{{ hasLogin ? '退出后可重新登录当前账号' : '登录后可管理完整的账号设置' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import pushServer from './dc-push/push.js'
	import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'

	const uniIdCo = uniCloud.importObject('uni-id-co')

	export default {
		data() {
			return {
				statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
				platform: uni.getSystemInfoSync().platform,
				hasPassword: false,
				pushIsOn: 'wait',
				pushRefreshTimer: null
			}
		},
		computed: {
			heroLayoutStyle() {
				const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
				const heroHeight = 178 + safeAreaOffset

				return {
					'--settings-status-bar-height': `${this.statusBarHeight}px`,
					height: `${heroHeight}px`,
					flexBasis: `${heroHeight}px`
				}
			},
			userInfo() {
				return store.userInfo
			},
			hasLogin() {
				return store.hasLogin
			}
		},
		onShow() {
			this.refreshPasswordState()

			// #ifdef APP-PLUS
			this.schedulePushRefresh()
			// #endif
		},
		onUnload() {
			if (this.pushRefreshTimer) {
				clearTimeout(this.pushRefreshTimer)
				this.pushRefreshTimer = null
			}
		},
		methods: {
			goBack() {
				if (getCurrentPages().length > 1) {
					uni.navigateBack({ delta: 1 })
					return
				}

				uni.switchTab({ url: '/pages/ucenter/ucenter' })
			},
			navigateTo(url) {
				uni.navigateTo({ url })
			},
			async refreshPasswordState() {
				if (!this.hasLogin) {
					this.hasPassword = false
					return
				}

				try {
					const accountInfo = await uniIdCo.getAccountInfo()
					this.hasPassword = Boolean(accountInfo.isPasswordSet)
				} catch (error) {
					this.hasPassword = false
					console.error('Failed to load account password state', error)
				}
			},
			async changeLoginState() {
				if (this.hasLogin) {
					await mutations.logout()
					return
				}

				uni.redirectTo({
					url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
				})
			},
			refreshPushState() {
				const nextState = pushServer.isOn()
				this.pushIsOn = typeof nextState === 'boolean' ? nextState : false
			},
			schedulePushRefresh() {
				if (this.pushRefreshTimer) {
					clearTimeout(this.pushRefreshTimer)
				}

				this.pushRefreshTimer = setTimeout(() => {
					this.refreshPushState()
					this.pushRefreshTimer = null
				}, 300)
			},
			togglePush(event) {
				const shouldEnable = Boolean(event.detail.value)
				if (this.platform === 'ios') {
					this.pushIsOn = !shouldEnable
					pushServer.setting()
					return
				}

				if (shouldEnable) {
					pushServer.on()
				} else {
					pushServer.off()
				}

				this.pushIsOn = shouldEnable
				this.schedulePushRefresh()
			},
			clearTmp() {
				uni.showLoading({
					title: '清除中',
					mask: true
				})

				uni.getSavedFileList({
					success: async (res) => {
						if (res.fileList.length === 0) {
							this.showClearResult(true)
							return
						}

						const results = await Promise.all(res.fileList.map((file) => this.removeSavedFile(file.filePath)))
						this.showClearResult(results.every(Boolean))
					},
					fail: () => {
						this.showClearResult(false)
					}
				})
			},
			removeSavedFile(filePath) {
				return new Promise((resolve) => {
					uni.removeSavedFile({
						filePath,
						success: () => resolve(true),
						fail: () => resolve(false)
					})
				})
			},
			showClearResult(succeeded) {
				uni.hideLoading()
				uni.showToast({
					title: succeeded ? '清除成功' : '部分缓存清除失败，请稍后重试',
					icon: 'none'
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
	button,
	switch {
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

	.settings-page {
		min-height: 100vh;
		background: #f9e7bd;
		color: #4b170d;
	}

	.settings-scene {
		position: relative;
		width: 100%;
		max-width: 430px;
		min-height: 100vh;
		margin: 0 auto;
		overflow: hidden;
		background: #fae8be;
	}

	.settings-hero {
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
		padding-top: calc(8px + var(--settings-status-bar-height, 0px));
	}

	.hero-title-row {
		position: relative;
		width: 100%;
		height: 53px;
		flex: 0 0 53px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.back-button {
		position: absolute;
		left: 14px;
		top: 7px;
		z-index: 3;
		width: 39px;
		height: 39px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(218, 151, 58, 0.58);
		border-radius: 50%;
		background: rgba(255, 249, 229, 0.76);
		box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.58), 0 2px 6px rgba(112, 58, 18, 0.14);
		transition: opacity 120ms ease, transform 120ms ease;
	}

	.back-button-pressed {
		opacity: 0.78;
		transform: scale(0.94);
	}

	.hero-title {
		display: block;
		flex-shrink: 0;
		margin: 0 12px;
		color: #71300c;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 42px;
		font-weight: 900;
		line-height: 53px;
		text-align: center;
		text-shadow: 0 1px 0 rgba(255, 248, 220, 0.72), 0 2px 2px rgba(102, 46, 8, 0.12);
		white-space: nowrap;
	}

	.title-cloud {
		width: 50px;
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
		width: 20px;
		height: 11px;
		flex-shrink: 0;
		border: 2px solid #d99331;
		border-right: 0;
		border-bottom: 0;
		border-radius: 13px 0 0;
	}

	.title-cloud-tail {
		width: 30px;
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
		padding: 0 16px 24px;
		padding-bottom: calc(24px + constant(safe-area-inset-bottom));
		padding-bottom: calc(24px + env(safe-area-inset-bottom));
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

	.section-panel {
		border-radius: 22px;
	}

	.section-panel + .section-panel {
		margin-top: 12px;
	}

	.section-panel::before {
		border-radius: 15px;
	}

	.section-panel-content {
		padding: 12px 13px 7px;
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

	.menu-list {
		margin-top: 4px;
	}

	.list-item {
		width: 100%;
		min-height: 64px;
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
		width: 38px;
		height: 38px;
		flex: 0 0 38px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(218, 151, 58, 0.3);
		border-radius: 50%;
		box-shadow: inset 0 0 0 2px rgba(255, 252, 242, 0.5);
	}

	.item-icon-profile {
		background: #f7e8c8;
	}

	.item-icon-password {
		background: #eee0d1;
	}

	.item-icon-cache {
		border-color: rgba(71, 124, 105, 0.3);
		background: #e0eadf;
	}

	.item-icon-push {
		background: #f4dfd0;
	}

	.item-copy {
		min-width: 0;
		flex: 1;
		justify-content: center;
		margin-left: 11px;
	}

	.item-title,
	.item-description {
		display: block;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-title {
		color: #4b170d;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 16px;
		font-weight: 700;
		line-height: 22px;
	}

	.item-description {
		margin-top: 1px;
		color: #96745f;
		font-size: 12px;
		line-height: 18px;
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

	.push-switch {
		flex-shrink: 0;
		margin-left: 10px;
		transform: scale(0.82);
		transform-origin: right center;
	}

	.login-button {
		display: flex;
		width: 100%;
		height: 52px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin: 16px 0 0;
		padding: 0 16px;
		border: 2px solid #efa950;
		border-radius: 15px;
		background: linear-gradient(180deg, #f2551d 0%, #e33e0f 100%);
		box-shadow: inset 0 0 0 1px rgba(255, 203, 100, 0.7), inset 0 -2px 4px rgba(133, 49, 4, 0.15), 0 3px 8px rgba(141, 54, 9, 0.2);
		line-height: 1;
		transition: opacity 120ms ease, transform 120ms ease;
	}

	.login-button-secondary {
		border-color: #e6a34c;
		background: linear-gradient(180deg, #ed7f2a 0%, #d95e18 100%);
	}

	.login-button::after {
		border: 0;
	}

	.login-button-pressed {
		opacity: 0.86;
		transform: scale(0.985);
	}

	.login-button-text {
		margin-left: 7px;
		color: #fffdf5;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 18px;
		font-weight: 700;
		line-height: 24px;
		text-shadow: 0 1px 1px rgba(112, 36, 3, 0.24);
	}

	.login-hint {
		display: block;
		width: 100%;
		margin-top: 7px;
		color: #98725b;
		font-size: 12px;
		line-height: 18px;
		text-align: center;
	}

	@media (min-width: 431px) {
		.settings-scene {
			box-shadow: 0 0 28px rgba(107, 59, 17, 0.18);
		}
	}

	@media (max-width: 360px) {
		.back-button {
			left: 11px;
		}

		.hero-title {
			margin: 0 8px;
			font-size: 39px;
		}

		.title-cloud {
			width: 40px;
		}

		.title-cloud-curl {
			width: 17px;
		}

		.title-cloud-tail {
			width: 23px;
		}

		.page-content {
			padding-right: 12px;
			padding-left: 12px;
		}

		.section-panel-content {
			padding-right: 10px;
			padding-left: 10px;
		}

		.list-item {
			padding-right: 2px;
			padding-left: 2px;
		}

		.item-icon {
			width: 36px;
			height: 36px;
			flex-basis: 36px;
		}

		.item-copy {
			margin-left: 9px;
		}

		.push-switch {
			margin-left: 5px;
			transform: scale(0.75);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back-button,
		.list-item,
		.login-button {
			transition: none;
		}
	}
</style>
