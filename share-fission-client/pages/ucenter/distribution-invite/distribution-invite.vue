<template>
	<view class="distribution-invite">
    <!-- #ifndef H5 -->
    <statusBar></statusBar>
    <!-- #endif -->
		<view class="header">
			<text class="subtitle">邀请好友，共享收益</text>
		</view>

		<view class="content">
			<!-- 专属推广二维码 -->
			<view class="section qrcode-section">
				<view class="section-header">
					<uni-icons type="image" size="20" color="#007AFF"></uni-icons>
					<text class="section-title">专属推广二维码</text>
				</view>
				<view class="qrcode-container">
					<view class="qrcode-wrapper" id="qrcodeWrapper">
						<uqrcode
							ref="qrcode"
							:size="200"
							canvas-id="distribution-qrcode"
							:value="inviteUrl"
							:options="qrcodeOptions"
						></uqrcode>
					</view>
					<view class="qrcode-footer">
						<text class="tip-text">扫描二维码或保存图片分享</text>
					</view>
				</view>
				<button class="save-btn" @click="saveQRCode">
					<uni-icons type="download" size="18" color="#FFFFFF"></uni-icons>
					<text class="btn-text">保存到相册</text>
				</button>
			</view>

			<!-- 专属邀请码 -->
			<view class="section">
				<view class="section-header">
					<uni-icons type="vip" size="20" color="#007AFF"></uni-icons>
					<text class="section-title">专属邀请码</text>
				</view>
				<view class="invite-code-container">
					<text class="invite-code">{{ myInviteCode || '加载中...' }}</text>
				</view>
			</view>

			<!-- 推广链接 -->
			<view class="section">
				<view class="section-header">
					<uni-icons type="link" size="20" color="#007AFF"></uni-icons>
					<text class="section-title">推广链接</text>
				</view>
				<view class="link-container">
					<text class="link-text">{{ inviteUrl }}</text>
				</view>
				<button class="copy-btn" @click="copyLink">
					<uni-icons type="copy" size="18" color="#007AFF"></uni-icons>
					<text class="btn-text">复制链接</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import uqrcode from "@/uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode"
const db = uniCloud.database();

export default {
	components: {
		uqrcode
	},
	data() {
		return {
			myInviteCode: '',
			inviteUrl: '',
			qrcodeOptions: {
				errorCorrectLevel: 'H',
				margin: 0
			}
		}
	},
	computed: {
		appConfig() {
			return getApp().globalData.config
		}
	},
	onLoad() {
		this.getInviteCode()
	},
	methods: {
		/**
		 * 获取邀请码
		 */
		async getInviteCode() {
			try {
				uni.showLoading({
					title: '加载中...',
					mask: true
				})

				let {result} = await db.collection('uni-id-users')
					.where("'_id' == $cloudEnv_uid")
					.field('my_invite_code')
					.get()

				if (result.data && result.data.length > 0) {
					this.myInviteCode = result.data[0].my_invite_code

					if (!this.myInviteCode) {
						uni.showToast({
							title: '请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode',
							icon: 'none',
							duration: 3000
						});
						return
					}

					// 生成邀请链接
					const baseUrl = this.appConfig.h5?.url
					this.inviteUrl = `${baseUrl}/#/?uniInvitationCode=${this.myInviteCode}`
				}
			} catch (error) {
				console.error('获取邀请码失败:', error)
				uni.showToast({
					title: '获取邀请码失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading()
			}
		},

		/**
		 * 保存二维码到相册
		 */
		saveQRCode() {
			// #ifdef APP-PLUS || H5
			uni.showLoading({
				title: '生成中...',
				mask: true
			})

			// 使用 canvas 生成图片
			setTimeout(() => {
				this.$refs.qrcode.save({
					success: (res) => {
						uni.hideLoading()
						uni.showToast({
							title: '保存成功',
							icon: 'success'
						});
					},
					fail: (error) => {
						uni.hideLoading()
						console.error('生成图片失败:', error)
						uni.showToast({
							title: '生成图片失败',
							icon: 'none'
						});
					}
				})
			}, 500)
			// #endif

			// #ifndef APP-PLUS || H5
			uni.showToast({
				title: '当前平台暂不支持此功能',
				icon: 'none'
			});
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
					});
				},
				fail: () => {
					uni.showToast({
						title: '复制失败',
						icon: 'none'
					});
				}
			})
		}
	}
}
</script>

<style scoped>
view {
	display: flex;
	box-sizing: border-box;
	flex-direction: column;
}

.distribution-invite {
	min-height: 100vh;
	background: #FAFAFA;
	padding-bottom: 32px;
}

.header {
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	padding: 60px 24px 48px;
	align-items: center;
	color: #FFFFFF;
	box-shadow: 0 4px 16px rgba(91, 143, 249, 0.2);
}

.title {
	font-size: 48rpx;
	font-weight: bold;
	margin-bottom: 16rpx;
}

.subtitle {
	font-size: 28rpx;
	opacity: 0.9;
}

.content {
	padding: 0 30rpx;
	margin-top: -30rpx;
}

.section {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-header {
	flex-direction: row;
	align-items: center;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 1px solid #f0f0f0;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
	margin-left: 12rpx;
}

.qrcode-section {
	align-items: center;
}

.qrcode-container {
	align-items: center;
	margin: 20rpx 0;
}

.qrcode-wrapper {
	padding: 30rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	border: 2rpx solid #e8e8e8;
}

.qrcode-footer {
	margin-top: 20rpx;
}

.tip-text {
	font-size: 24rpx;
	color: #999999;
	text-align: center;
}

.save-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	border-radius: 8px;
	color: #FFFFFF;
	font-size: 32rpx;
	border: none;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-top: 20rpx;
	box-shadow: 0 2px 8px rgba(91, 143, 249, 0.25);
}

.save-btn::after {
	border: none;
}

.btn-text {
	margin-left: 10rpx;
	color: #FFFFFF;
}

.invite-code-container {
	background: #FFF7E6;
	border: 1px solid #FFD591;
	border-radius: 12px;
	padding: 32px;
	margin-bottom: 16px;
	align-items: center;
	justify-content: center;
}

.invite-code {
	font-size: 60rpx;
	font-weight: bold;
	color: #333333;
	letter-spacing: 8rpx;
	font-family: 'Courier New', monospace;
}

.link-container {
	background: #f8f8f8;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
}

.link-text {
	font-size: 26rpx;
	color: #666666;
	line-height: 1.6;
	word-break: break-all;
}

.copy-btn {
	width: 100%;
	height: 88rpx;
	background: #FFFFFF;
	border: 2rpx solid #007AFF;
	border-radius: 44rpx;
	color: #007AFF;
	font-size: 32rpx;
	flex-direction: row;
	align-items: center;
	justify-content: center;
}

.copy-btn::after {
	border: none;
}

.copy-btn .btn-text {
	color: #007AFF;
}
</style>
