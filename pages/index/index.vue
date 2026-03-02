<template>
	<view class="pages">
		<!-- #ifndef H5 -->
		<statusBar></statusBar>
		<!-- #endif -->

		<!-- 标题栏 -->
		<view class="header">
			<text class="header-title">猜谜语</text>
			<text class="header-subtitle">看广告解锁答案</text>
		</view>

		<!-- 谜语卡片 -->
		<view class="riddle-container">
			<view class="riddle-card">
				<!-- 难度标签 -->
				<view class="difficulty-tag" :class="'difficulty-' + currentRiddle.difficulty">
					<text class="difficulty-text">{{ currentRiddle.difficulty }}</text>
				</view>

				<!-- 分类标签 -->
				<view class="category-tag">
					<text class="category-text">{{ currentRiddle.category }}</text>
				</view>

				<!-- 谜面 -->
				<view class="question-box">
					<text class="question-label">谜面：</text>
					<text class="question-text">{{ currentRiddle.question }}</text>
				</view>

				<!-- 提示信息 -->
				<view class="hint-box">
					<text class="hint-text">类型：{{ currentRiddle.category }}  |  答案：{{ currentRiddle.answer.length }}个字</text>
				</view>

				<!-- 输入区域 -->
				<view v-if="!isAnswerCorrect" class="input-box">
					<input
						class="answer-input"
						v-model="userAnswer"
						placeholder="请输入你的答案"
						:maxlength="currentRiddle.answer.length + 2"
					/>
					<view class="btn-submit" @click="checkAnswer">
						<text class="btn-submit-text">提交答案</text>
					</view>
				</view>

				<!-- 答案区域（猜对或查看广告后显示） -->
				<view v-if="showAnswer || isAnswerCorrect" class="answer-box">
					<text class="answer-label">谜底：</text>
					<view class="answer-revealed">
						<text class="answer-text">{{ currentRiddle.answer }}</text>
					</view>
					<view v-if="isAnswerCorrect" class="congratulations">
						<text class="congrats-text">🎉 恭喜你答对了！</text>
					</view>
				</view>

				<!-- 看不出来？查看答案 -->
				<view v-if="!showAnswer && !isAnswerCorrect" class="tip-box">
					<text v-if="attemptCount > 0" class="tip-text">已尝试 {{ attemptCount }} 次，看不出来？</text>
					<text v-else class="tip-text">想不出来？直接查看答案吧</text>
					<view class="btn-ad-hint" @click="watchAdForAnswer">
						<text class="btn-ad-text">观看广告查看答案</text>
					</view>
				</view>

				<!-- 下一题按钮 -->
				<view v-if="showAnswer || isAnswerCorrect" class="btn-box">
					<view class="btn-next" @click="nextRiddle">
						<text class="btn-text">下一题</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 进度指示器 -->
		<view class="progress-box">
			<text class="progress-text">第 {{ currentIndex + 1 }} / {{ totalRiddles }} 题</text>
		</view>

		<!-- 切换按钮 -->
		<!-- <view class="nav-buttons">
			<view class="btn-nav" @click="prevRiddle" :class="{ 'btn-disabled': currentIndex === 0 }">
				<text class="nav-text">上一题</text>
			</view>
			<view class="btn-nav" @click="nextRiddle" :class="{ 'btn-disabled': currentIndex === totalRiddles - 1 }">
				<text class="nav-text">下一题</text>
			</view>
		</view> -->
	</view>
</template>

<script>
	import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
	import riddleData from "@/data/riddles.js";
	import AD from "@/utils/ad.js";
	import {store} from "@/uni_modules/uni-id-pages/common/store.js";

	export default {
		components: {
			statusBar
		},
		data() {
			return {
				riddles: riddleData,
				currentIndex: 0,
				showAnswer: false,
				userAnswer: '',
				isAnswerCorrect: false,
				attemptCount: 0
			}
		},
		computed: {
			currentRiddle() {
				return this.riddles[this.currentIndex] || {}
			},
			totalRiddles() {
				return this.riddles.length
			}
		},
		onLoad(options) {
      		console.log('options', options)
			// 如果有 uniInvitationCode 就记录到storage中
			if (options.uniInvitationCode) {
				uni.setStorageSync('sf-invitation-code', options.uniInvitationCode)
			}


			// 随机打乱谜语顺序，增加趣味性
			this.shuffleRiddles()
		},
		methods: {
			// 随机打乱谜语顺序
			shuffleRiddles() {
				for (let i = this.riddles.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[this.riddles[i], this.riddles[j]] = [this.riddles[j], this.riddles[i]]
				}
			},

			// 校验登录，未登录则跳转登录页
			requireLogin() {
				if (!store.hasLogin) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					const redirectUrl = '/pages/index/index'
					uni.navigateTo({
						url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd?uniIdRedirectUrl=' + encodeURIComponent(redirectUrl)
					})
					return false
				}
				return true
			},

			// 验证答案
			checkAnswer() {
				if (!this.requireLogin()) return

				const trimmedAnswer = this.userAnswer?.trim()

				if (!trimmedAnswer) {
					uni.showToast({
						title: '请输入答案',
						icon: 'none'
					})
					return
				}

				this.attemptCount++

				// 验证答案（去除空格，不区分大小写）
				if (trimmedAnswer === this.currentRiddle.answer) {
					this.isAnswerCorrect = true
					uni.showToast({
						title: '回答正确！',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: '答案不对，再想想吧',
						icon: 'none'
					})
					// 震动反馈
					uni.vibrateShort({
						success: () => {}
					})
				}
			},

			// 观看广告查看答案
			watchAdForAnswer() {
				if (!this.requireLogin()) return

				const userId = uniCloud.getCurrentUserInfo().uid
				console.log('watchAdForAnswer 用户ID:', userId);
				AD.showRewardedAd({
					urlCallback: {
						userId,
            			extra: {
							action: 'watchAdForAnswer'
						}
					},
					onSuccess: () => {
						// 广告播放完成，显示答案
						this.showAnswer = true;
						uni.showToast({
							title: '感谢观看！',
							icon: 'success'
						});
						// 标记商城页需要重新拉取积分
						getApp().globalData.pointsNeedRefresh = true;
					},
					cancelMessage: '请完整观看广告才能查看答案'
				})
			},

			// 重置当前题目状态
			resetCurrentQuestion() {
				this.userAnswer = ''
				this.showAnswer = false
				this.isAnswerCorrect = false
				this.attemptCount = 0
			},

			// 下一题
			nextRiddle() {
				if (this.currentIndex < this.totalRiddles - 1) {
					this.currentIndex++
					this.resetCurrentQuestion()
				} else {
					uni.showToast({
						title: '已经是最后一题了',
						icon: 'none'
					})
				}
			},

			// 上一题
			prevRiddle() {
				if (this.currentIndex > 0) {
					this.currentIndex--
					this.resetCurrentQuestion()
				} else {
					uni.showToast({
						title: '已经是第一题了',
						icon: 'none'
					})
				}
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

	.pages {
		background-color: #F7FAFC;
		min-height: 100vh;
		padding-bottom: 24px;
	}

	/* 头部区域 - V3 浅蓝色渐变 */
	.header {
		background: linear-gradient(135deg, #4299E1 0%, #3182CE 100%);
		padding: 24px 20px 48px;
		align-items: center;
		border-radius: 0 0 32px 32px;
		box-shadow: 0 10px 30px -10px rgba(66, 153, 225, 0.4);
	}

	.header-title {
		font-size: 22px;
		font-weight: 700;
		color: #FFFFFF;
		margin-bottom: 6px;
	}

	.header-subtitle {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.9);
	}

	/* 谜语卡片容器 */
	.riddle-container {
		padding: 0 16px;
		margin-top: -32px;
	}

	.riddle-card {
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 24px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		position: relative;
		border: 1px solid #E2E8F0;
	}

	/* 难度和分类标签 */
	.difficulty-tag {
		position: absolute;
		top: 24px;
		right: 24px;
		padding: 5px 10px;
		border-radius: 8px;
	}

	.difficulty-text {
		font-size: 12px;
		font-weight: 600;
	}

	.difficulty-简单 { background-color: #C6F6D5; color: #2F855A; }
	.difficulty-中等 { background-color: #FEEBC8; color: #B45309; }
	.difficulty-困难 { background-color: #FED7D7; color: #C53030; }

	.category-tag {
		margin-bottom: 16px;
		align-self: flex-start;
	}

	.category-text {
		font-size: 12px;
		color: #3182CE;
		background-color: #EBF8FF;
		padding: 4px 10px;
		border-radius: 8px;
		font-weight: 500;
	}

	/* 谜面区域 */
	.question-box {
		margin-bottom: 16px;
		padding: 16px;
		background-color: #F7FAFC;
		border-radius: 12px;
		border: 1px solid #EDF2F7;
	}

	.question-label {
		font-size: 14px;
		color: #3182CE;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.question-text {
		font-size: 16px;
		color: #1A202C;
		line-height: 1.7;
		font-weight: 500;
	}

	/* 提示信息 */
	.hint-box {
		margin-bottom: 20px;
		padding: 10px 12px;
		background-color: #EBF8FF;
		border-radius: 12px;
		align-items: center;
		border: 1px solid #BEE3F8;
	}

	.hint-text {
		font-size: 13px;
		color: #2B6CB0;
		font-weight: 500;
	}

	/* 输入区域 */
	.input-box {
		margin-bottom: 20px;
		background-color: transparent;
		padding: 0;
	}

	.answer-input {
		background-color: #F7FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		padding: 14px;
		font-size: 15px;
		color: #1A202C;
		margin-bottom: 16px;
		text-align: center;
		height: 52px;
		line-height: 22px;
	}

	.answer-input:focus {
		border-color: #4299E1;
		box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
	}

	.btn-submit {
		background: linear-gradient(to right, #4299E1, #3182CE);
		padding: 14px 0;
		border-radius: 12px;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 14px 0 rgba(66, 153, 225, 0.3);
		height: 52px;
	}

	.btn-submit-text {
		font-size: 16px;
		color: #FFFFFF;
		font-weight: 600;
	}

	/* 答案区域 */
	.answer-box {
		margin-bottom: 20px;
		padding: 16px;
		background-color: #F0FFF4;
		border-radius: 12px;
		justify-content: center;
		border: 1px solid #C6F6D5;
		text-align: center;
	}

	.answer-label {
		font-size: 14px;
		color: #38A169;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.answer-text {
		font-size: 20px;
		color: #2F855A;
		font-weight: 700;
	}

	.congratulations {
		margin-top: 12px;
		align-items: center;
	}

	.congrats-text {
		font-size: 15px;
		color: #2F855A;
		font-weight: 600;
	}

	/* "想不出来？" 提示区域 */
	.tip-box {
		margin-bottom: 20px;
		padding: 16px;
		background-color: #FEFCE8;
		border-radius: 12px;
		align-items: center;
		border: 1px solid #FEEBC8;
	}

	.tip-text {
		font-size: 13px;
		color: #B45309;
		margin-bottom: 12px;
		font-weight: 500;
	}

	.btn-ad-hint {
		background: linear-gradient(to right, #F6AD55, #ED8936);
		padding: 10px 24px;
		border-radius: 12px;
		box-shadow: 0 4px 14px 0 rgba(237, 137, 54, 0.3);
	}

	.btn-ad-text {
		font-size: 14px;
		color: #FFFFFF;
		font-weight: 600;
	}

	/* "下一题" 按钮区域 */
	.btn-box {
		align-items: center;
		margin-top: 16px;
	}

	.btn-next {
		background: linear-gradient(to right, #4299E1, #3182CE);
		padding: 12px 32px;
		border-radius: 12px;
		box-shadow: 0 4px 14px 0 rgba(66, 153, 225, 0.3);
	}

	.btn-text {
		font-size: 16px;
		color: #FFFFFF;
		font-weight: 600;
	}

	/* 进度指示器 */
	.progress-box {
		align-items: center;
		margin-top: 24px;
		padding: 10px 24px;
		background: #FFFFFF;
		border-radius: 999px;
		margin-left: auto;
		margin-right: auto;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
		max-width: 200px;
	}

	.progress-text {
		font-size: 14px;
		color: #4A5568;
		font-weight: 500;
	}

	/* 上一题/下一题 导航按钮 */
	.nav-buttons {
		flex-direction: row;
		justify-content: space-between;
		padding: 0 16px;
		margin-top: 20px;
		gap: 16px;
	}

	.btn-nav {
		flex: 1;
		background-color: #FFFFFF;
		padding: 14px 20px;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		align-items: center;
		box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.03);
	}

	.btn-disabled {
		opacity: 0.5;
		background-color: #F7FAFC;
	}

	.nav-text {
		font-size: 15px;
		color: #2D3748;
		font-weight: 600;
	}
</style>
