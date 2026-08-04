<template>
	<view class="distribution-invite">
		<view class="invite-scene">
			<view class="invite-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="分销推荐">
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
						<text class="hero-title">分销推荐</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">邀</text>
			</view>

			<view class="page-content">
				<view class="qrcode-panel ornate-panel">
					<view class="panel-content qrcode-panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">专属邀请函</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<text class="invite-slogan">邀请好友，共享收益</text>

						<view class="qrcode-stage">
							<view id="qrcodeWrapper" class="qrcode-frame">
								<view class="frame-corner frame-corner-top-left" aria-hidden="true"></view>
								<view class="frame-corner frame-corner-top-right" aria-hidden="true"></view>
								<view class="frame-corner frame-corner-bottom-left" aria-hidden="true"></view>
								<view class="frame-corner frame-corner-bottom-right" aria-hidden="true"></view>
								<uqrcode
									v-if="isInviteReady"
									ref="qrcode"
									:size="200"
									canvas-id="distribution-qrcode"
									:value="inviteUrl"
									:options="qrcodeOptions"
									@change="handleQRCodeChange"
									@complete="handleQRCodeComplete"
								></uqrcode>
								<view v-else class="qrcode-placeholder" aria-live="polite">
									<view class="placeholder-medallion">
										<uni-icons
											:type="inviteStatus === 'loading' ? 'loop' : 'info'"
											size="25"
											color="#c9893a"
										></uni-icons>
									</view>
									<text class="placeholder-text">{{ inviteStatusText }}</text>
									<view
										v-if="inviteStatus === 'error'"
										class="retry-action"
										hover-class="retry-action-pressed"
										role="button"
										tabindex="0"
										@click="getInviteCode"
										@keyup.enter="getInviteCode"
									>
										<uni-icons type="loop" size="14" color="#a75724"></uni-icons>
										<text class="retry-action-text">重新生成</text>
									</view>
								</view>
							</view>
						</view>

						<view class="qrcode-label">
							<uni-icons type="scan" size="16" color="#b9682d"></uni-icons>
							<text class="qrcode-label-text">好友邀请二维码</text>
						</view>

						<button
							class="primary-button"
							:class="{ 'action-button-disabled': !canSaveQRCode }"
							:disabled="!canSaveQRCode"
							hover-class="primary-button-pressed"
							aria-label="保存二维码到相册"
							@click="saveQRCode"
						>
							<uni-icons type="download" size="18" color="#fffdf5"></uni-icons>
							<text class="primary-button-text">{{ saving ? '生成中...' : '保存到相册' }}</text>
						</button>
					</view>
				</view>

				<view class="share-panel ornate-panel">
					<view class="panel-content share-panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">分享凭证</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<view class="credential-row code-row">
							<view class="credential-icon credential-icon-code">
								<uni-icons type="vip" size="20" color="#d14b1d"></uni-icons>
							</view>
							<view class="credential-copy">
								<text class="credential-label">专属邀请码</text>
								<text class="invite-code" :style="inviteCodeStyle">{{ inviteCodeDisplay }}</text>
							</view>
						</view>

						<view class="credential-row link-row">
							<view class="credential-icon credential-icon-link">
								<uni-icons type="link" size="20" color="#477c69"></uni-icons>
							</view>
							<view class="credential-copy">
								<text class="credential-label">推广链接</text>
								<text class="link-text">{{ inviteUrl || inviteStatusText }}</text>
							</view>
						</view>

						<button
							class="secondary-button"
							:class="{ 'action-button-disabled': !isInviteReady }"
							:disabled="!isInviteReady"
							hover-class="secondary-button-pressed"
							aria-label="复制推广链接"
							@click="copyLink"
						>
							<uni-icons type="paperclip" size="18" color="#b25120"></uni-icons>
							<text class="secondary-button-text">复制推广链接</text>
						</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import uqrcode from '@/uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode'

const db = uniCloud.database()

export default {
	components: {
		uqrcode
	},
	data() {
		return {
			statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
			myInviteCode: '',
			inviteUrl: '',
			inviteStatus: 'loading',
			qrcodeReady: false,
			saving: false,
			qrcodeOptions: {
				errorCorrectLevel: 'H',
				margin: 0
			}
		}
	},
	computed: {
		isInviteReady() {
			return Boolean(this.myInviteCode && this.inviteUrl)
		},
		canSaveQRCode() {
			return this.isInviteReady && this.qrcodeReady && !this.saving
		},
		inviteStatusText() {
			if (this.inviteStatus === 'empty') return '暂无可用邀请函'
			if (this.inviteStatus === 'error') return '邀请函生成失败'
			return '邀请函生成中'
		},
		inviteCodeDisplay() {
			if (this.myInviteCode) return this.myInviteCode
			return this.inviteStatus === 'loading' ? '加载中...' : '--'
		},
		inviteCodeStyle() {
			const length = Math.max(1, String(this.inviteCodeDisplay).length)
			const fontSize = Math.min(25, Math.max(14, Math.floor(180 / length)))

			return { fontSize: `${fontSize}px` }
		},
		heroLayoutStyle() {
			const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
			const heroHeight = 178 + safeAreaOffset

			return {
				'--invite-status-bar-height': `${this.statusBarHeight}px`,
				height: `${heroHeight}px`,
				flexBasis: `${heroHeight}px`
			}
		},
		appConfig() {
			return getApp().globalData.config
		}
	},
	onLoad() {
		this.getInviteCode()
	},
	onUnload() {
		if (this.saving) {
			this.saving = false
			uni.hideLoading()
		}
	},
	methods: {
		handleQRCodeChange() {
			this.qrcodeReady = false
		},
		handleQRCodeComplete(event) {
			this.qrcodeReady = Boolean(event && event.success)
		},

		goBack() {
			if (getCurrentPages().length > 1) {
				uni.navigateBack({ delta: 1 })
				return
			}

			uni.switchTab({ url: '/pages/ucenter/ucenter' })
		},

		/**
		 * 获取邀请码
		 */
		async getInviteCode() {
			this.inviteStatus = 'loading'
			this.qrcodeReady = false
			this.myInviteCode = ''
			this.inviteUrl = ''

			try {
				uni.showLoading({
					title: '加载中...',
					mask: true
				})

				const { result } = await db.collection('uni-id-users')
					.where("'_id' == $cloudEnv_uid")
					.field('my_invite_code')
					.get()

				if (result.data && result.data.length > 0) {
					this.myInviteCode = result.data[0].my_invite_code

					if (!this.myInviteCode) {
						this.inviteStatus = 'empty'
						uni.showToast({
							title: '请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode',
							icon: 'none',
							duration: 3000
						})
						return
					}

					const baseUrl = this.appConfig.h5?.url
					this.inviteUrl = `${baseUrl}/#/?uniInvitationCode=${this.myInviteCode}`
					this.inviteStatus = 'ready'
				} else {
					this.inviteStatus = 'empty'
				}
			} catch (error) {
				this.inviteStatus = 'error'
				console.error('获取邀请码失败:', error)
				uni.showToast({
					title: '获取邀请码失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},

		/**
		 * 保存二维码到相册
		 */
		saveQRCode() {
			// #ifdef APP-PLUS || H5
			if (!this.canSaveQRCode) return

			this.saving = true
			uni.showLoading({
				title: '生成中...',
				mask: true
			})

			const qrcode = this.$refs.qrcode

			if (!qrcode || typeof qrcode.save !== 'function') {
				this.saving = false
				uni.hideLoading()
				uni.showToast({
					title: '二维码尚未生成，请稍后重试',
					icon: 'none'
				})
				return
			}

			qrcode.save({
				success: () => {
					this.saving = false
					uni.hideLoading()
					// #ifdef H5
					uni.showToast({
						title: '请长按二维码保存',
						icon: 'none'
					})
					// #endif
					// #ifdef APP-PLUS
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})
					// #endif
				},
				fail: (error) => {
					this.saving = false
					uni.hideLoading()
					console.error('生成图片失败:', error)
					uni.showToast({
						title: '生成图片失败',
						icon: 'none'
					})
				}
			})
			// #endif

			// #ifndef APP-PLUS || H5
			uni.showToast({
				title: '当前平台暂不支持此功能',
				icon: 'none'
			})
			// #endif
		},

		/**
		 * 复制链接
		 */
		copyLink() {
			uni.setClipboardData({
				data: this.inviteUrl,
				success: () => {
					uni.showToast({
						title: '复制成功',
						icon: 'success'
					})
				},
				fail: () => {
					uni.showToast({
						title: '复制失败',
						icon: 'none'
					})
				}
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
button {
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

.distribution-invite {
	min-height: 100vh;
	background: #f9e7bd;
	color: #4b170d;
}

.invite-scene {
	position: relative;
	width: 100%;
	max-width: 430px;
	min-height: 100vh;
	margin: 0 auto;
	overflow: hidden;
	background: #fae8be;
}

.invite-hero {
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
	padding-top: calc(8px + var(--invite-status-bar-height, 0px));
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
	top: 4px;
	left: 14px;
	z-index: 3;
	width: 44px;
	height: 44px;
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
	margin: 0 9px;
	color: #71300c;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 38px;
	font-weight: 900;
	line-height: 53px;
	text-align: center;
	text-shadow: 0 1px 0 rgba(255, 248, 220, 0.72), 0 2px 2px rgba(102, 46, 8, 0.12);
	white-space: nowrap;
}

.title-cloud {
	width: 39px;
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
	width: 18px;
	height: 11px;
	flex-shrink: 0;
	border: 2px solid #d99331;
	border-right: 0;
	border-bottom: 0;
	border-radius: 13px 0 0;
}

.title-cloud-tail {
	width: 21px;
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

.qrcode-panel,
.share-panel {
	border-radius: 24px;
}

.qrcode-panel::before,
.share-panel::before {
	border-radius: 17px;
}

.qrcode-panel-content {
	align-items: center;
	padding: 14px 18px 18px;
}

.share-panel {
	margin-top: 12px;
}

.share-panel-content {
	padding: 13px 18px 17px;
}

.section-heading {
	width: 100%;
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

.invite-slogan {
	display: block;
	margin-top: 3px;
	color: #8a5b3d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 22px;
	text-align: center;
}

.qrcode-stage {
	position: relative;
	align-items: center;
	justify-content: center;
	margin-top: 9px;
	padding: 9px;
	border: 1px solid rgba(226, 177, 102, 0.56);
	border-radius: 9px;
	background: #f8e9ca;
	box-shadow: inset 0 1px 5px rgba(134, 76, 24, 0.08);
}

.qrcode-frame {
	position: relative;
	align-items: center;
	justify-content: center;
	padding: 13px;
	border: 1px solid rgba(217, 146, 55, 0.46);
	border-radius: 5px;
	background: #ffffff;
	box-shadow: 0 3px 8px rgba(116, 60, 17, 0.12);
}

.qrcode-placeholder {
	width: 200px;
	height: 200px;
	align-items: center;
	justify-content: center;
	background: #fffdf7;
}

.placeholder-medallion {
	width: 48px;
	height: 48px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(218, 151, 58, 0.4);
	border-radius: 50%;
	background: #fbefd8;
	box-shadow: inset 0 0 0 3px rgba(255, 253, 247, 0.7);
}

.placeholder-text {
	margin-top: 10px;
	color: #96745f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 21px;
}

.retry-action {
	height: 28px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-top: 7px;
	padding: 0 11px;
	border: 1px solid rgba(211, 139, 53, 0.58);
	border-radius: 14px;
	background: #fff5dc;
	transition: opacity 120ms ease, transform 120ms ease;
}

.retry-action-pressed {
	opacity: 0.76;
	transform: scale(0.97);
}

.retry-action-text {
	margin-left: 4px;
	color: #a75724;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	font-weight: 700;
	line-height: 20px;
}

.frame-corner {
	position: absolute;
	z-index: 2;
	width: 18px;
	height: 18px;
	border-color: #dd7130;
	border-style: solid;
	pointer-events: none;
}

.frame-corner-top-left {
	top: 5px;
	left: 5px;
	border-width: 2px 0 0 2px;
}

.frame-corner-top-right {
	top: 5px;
	right: 5px;
	border-width: 2px 2px 0 0;
}

.frame-corner-bottom-left {
	bottom: 5px;
	left: 5px;
	border-width: 0 0 2px 2px;
}

.frame-corner-bottom-right {
	right: 5px;
	bottom: 5px;
	border-width: 0 2px 2px 0;
}

.qrcode-label {
	height: 25px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-top: 7px;
}

.qrcode-label-text {
	margin-left: 5px;
	color: #876048;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	line-height: 20px;
}

.primary-button,
.secondary-button {
	display: flex;
	width: 100%;
	height: 44px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin: 0;
	padding: 0 18px;
	font-size: 16px;
	line-height: 44px;
	transition: opacity 120ms ease, transform 120ms ease;
}

.primary-button::after,
.secondary-button::after {
	border: 0;
}

.primary-button {
	margin-top: 7px;
	border: 2px solid #f0ad51;
	border-radius: 22px;
	background: linear-gradient(180deg, #f25a20 0%, #df3e10 100%);
	box-shadow: inset 0 0 0 1px rgba(255, 207, 112, 0.62), inset 0 -2px 4px rgba(123, 35, 3, 0.18), 0 3px 7px rgba(136, 51, 9, 0.2);
}

.primary-button-pressed,
.secondary-button-pressed {
	opacity: 0.82;
	transform: scale(0.985);
}

.action-button-disabled {
	opacity: 0.52;
	box-shadow: none;
}

.primary-button-text,
.secondary-button-text {
	margin-left: 7px;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 16px;
	font-weight: 700;
}

.primary-button-text {
	color: #fffdf5;
	text-shadow: 0 1px 1px rgba(112, 36, 3, 0.26);
}

.credential-row {
	width: 100%;
	min-height: 67px;
	flex-direction: row;
	align-items: center;
	padding: 8px 3px;
	border-bottom: 1px dashed rgba(211, 146, 68, 0.3);
}

.credential-icon {
	width: 40px;
	height: 40px;
	flex: 0 0 40px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(218, 151, 58, 0.32);
	border-radius: 50%;
	box-shadow: inset 0 0 0 2px rgba(255, 252, 242, 0.58);
}

.credential-icon-code {
	background: #f7dfc5;
}

.credential-icon-link {
	background: #e0eadf;
}

.credential-copy {
	min-width: 0;
	flex: 1;
	justify-content: center;
	margin-left: 11px;
}

.credential-label {
	display: block;
	color: #79513a;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	line-height: 19px;
}

.invite-code {
	display: block;
	width: 100%;
	margin-top: 1px;
	color: #d94718;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 25px;
	font-weight: 700;
	line-height: 30px;
	word-break: break-all;
}

.link-text {
	display: block;
	width: 100%;
	margin-top: 1px;
	color: #745c4d;
	font-size: 12px;
	line-height: 18px;
	word-break: break-all;
}

.secondary-button {
	margin-top: 12px;
	border: 1px solid #d9903c;
	border-radius: 22px;
	background: #fff5dc;
	box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.62), 0 2px 5px rgba(121, 65, 18, 0.1);
}

.secondary-button-text {
	color: #a8491c;
}

@media (min-width: 431px) {
	.invite-scene {
		box-shadow: 0 0 28px rgba(107, 59, 17, 0.18);
	}
}

@media (max-width: 360px) {
	.hero-title {
		margin: 0 6px;
		font-size: 32px;
	}

	.title-cloud {
		width: 26px;
	}

	.title-cloud-curl {
		width: 16px;
	}

	.title-cloud-tail {
		width: 10px;
	}

	.page-content {
		padding-right: 12px;
		padding-left: 12px;
	}

	.qrcode-panel-content,
	.share-panel-content {
		padding-right: 14px;
		padding-left: 14px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.back-button,
	.primary-button,
	.secondary-button,
	.retry-action {
		transition: none;
	}
}
</style>
