<template>
	<view class="withdraw">
		<!-- 账户余额 -->
		<view class="balance-card">
			<view class="balance-header">
				<text class="balance-title">可提现积分</text>
				<view class="record-link" @click="toWithdrawRecord">
					<text class="record-text">提现记录</text>
					<uni-icons type="right" size="14" color="#999999"></uni-icons>
				</view>
			</view>
			<view class="balance-content">
				<text class="balance-number">{{ availablePoints }}</text>
				<text class="balance-unit">积分</text>
			</view>
			<view class="balance-footer">
				<text class="balance-tip">约合 ¥{{ (availablePoints * pointsRate).toFixed(2) }}</text>
			</view>
		</view>

		<!-- 提现规则 -->
		<view class="rules-card">
			<view class="card-title">
				<uni-icons type="info" size="18" color="#007AFF"></uni-icons>
				<text class="title-text">提现规则</text>
			</view>
			<view class="rules-content">
				<view class="rule-item">
					<text class="rule-label">积分兑换比例</text>
					<text class="rule-value">{{ Math.floor(1 / pointsRate) }} 积分 = 1 元</text>
				</view>
				<view class="rule-item">
					<text class="rule-label">手续费比例</text>
					<text class="rule-value">{{ (feeRate * 100).toFixed(1) }}%</text>
				</view>
				<view class="rule-item">
					<text class="rule-label">最低提现</text>
					<text class="rule-value">{{ minWithdraw }} 积分</text>
				</view>
				<view class="rule-item">
					<text class="rule-label">到账时间</text>
					<text class="rule-value">1-3 个工作日</text>
				</view>
			</view>
		</view>

		<!-- 提现表单 -->
		<view class="form-card">
			<view class="form-item">
				<text class="form-label">提现方式</text>
				<view class="withdraw-methods">
					<view
						v-for="(method, index) in withdrawMethods"
						:key="index"
						class="method-item"
						:class="{ active: selectedMethod === method.value }"
						@click="selectMethod(method.value)"
					>
						<uni-icons :type="method.icon" size="24" :color="selectedMethod === method.value ? '#007AFF' : '#999999'"></uni-icons>
						<text class="method-text">{{ method.label }}</text>
					</view>
				</view>
			</view>

			<!-- 银行卡信息 -->
			<view v-if="selectedMethod === 'bank'" class="form-item">
				<text class="form-label">持卡人姓名</text>
				<input
					class="form-input"
					v-model="bankInfo.name"
					placeholder="请输入持卡人姓名"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="selectedMethod === 'bank'" class="form-item">
				<text class="form-label">银行卡号</text>
				<input
					class="form-input"
					v-model="bankInfo.cardNumber"
					type="number"
					placeholder="请输入银行卡号"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="selectedMethod === 'bank'" class="form-item">
				<text class="form-label">开户银行</text>
				<input
					class="form-input"
					v-model="bankInfo.bankName"
					placeholder="例如：中国工商银行"
					placeholder-class="input-placeholder"
				/>
			</view>

			<!-- 支付宝信息 -->
			<view v-if="selectedMethod === 'alipay'" class="form-item">
				<text class="form-label">支付宝账号</text>
				<input
					class="form-input"
					v-model="alipayInfo.account"
					placeholder="请输入支付宝账号"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="selectedMethod === 'alipay'" class="form-item">
				<text class="form-label">真实姓名</text>
				<input
					class="form-input"
					v-model="alipayInfo.name"
					placeholder="请输入真实姓名"
					placeholder-class="input-placeholder"
				/>
			</view>

			<!-- 提现积分 -->
			<view class="form-item">
				<text class="form-label">提现积分</text>
				<view class="amount-input-wrapper">
					<input
						class="amount-input"
						v-model.number="withdrawAmount"
						type="number"
						placeholder="请输入提现积分"
						placeholder-class="input-placeholder"
					/>
					<text class="all-btn" @click="withdrawAll">全部</text>
				</view>
			</view>

			<!-- 到账金额 -->
			<view class="amount-info">
				<view class="info-row">
					<text class="info-label">兑换金额</text>
					<text class="info-value">¥{{ exchangeAmount.toFixed(2) }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">手续费</text>
					<text class="info-value fee">-¥{{ feeAmount.toFixed(2) }}</text>
				</view>
				<view class="info-row final">
					<text class="info-label">实际到账</text>
					<text class="info-value highlight">¥{{ actualAmount.toFixed(2) }}</text>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-wrapper">
			<button class="submit-btn" :disabled="!canSubmit" @click="submitWithdraw">
				<text class="btn-text">立即提现</text>
			</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true });

export default {
	data() {
		return {
			// 可提现积分
			availablePoints: 0,

			// 提现规则（从系统配置加载）
			pointsRate: 0.001, // 积分兑换比例：1000积分=1元
			feeRate: 0.2, // 手续费比例：20%
			minWithdraw: 1000, // 最低提现积分

			// 提现方式
			withdrawMethods: [
				{ label: '银行卡', value: 'bank', icon: 'wallet' },
				{ label: '支付宝', value: 'alipay', icon: 'scan' }
			],
			selectedMethod: 'alipay',

			// 银行卡信息
			bankInfo: {
				name: '',
				cardNumber: '',
				bankName: ''
			},

			// 支付宝信息
			alipayInfo: {
				account: '',
				name: ''
			},

			// 提现金额
			withdrawAmount: '',

			// 提交中状态
			submitting: false
		}
	},
	computed: {
		// 兑换金额
		exchangeAmount() {
			return (this.withdrawAmount || 0) * this.pointsRate
		},

		// 手续费
		feeAmount() {
			return this.exchangeAmount * this.feeRate
		},

		// 实际到账
		actualAmount() {
			return this.exchangeAmount - this.feeAmount
		},

		// 是否可提交
		canSubmit() {
			if (this.submitting) {
				return false
			}
			if (!this.withdrawAmount || this.withdrawAmount < this.minWithdraw) {
				return false
			}
			if (this.withdrawAmount > this.availablePoints) {
				return false
			}

			if (this.selectedMethod === 'bank') {
				return this.bankInfo.name && this.bankInfo.cardNumber && this.bankInfo.bankName
			} else if (this.selectedMethod === 'alipay') {
				return this.alipayInfo.account && this.alipayInfo.name
			}

			return false
		}
	},
	onLoad() {
		this.loadSystemConfig()
		this.loadUserPoints()
	},
	methods: {
		/**
		 * 加载系统配置
		 */
		async loadSystemConfig() {
			try {
				const config = await sfCo.action({
					name: 'client/config/get',
					data: {}
				})
				if (config) {
					// 积分兑换比例：ad_score_rate 表示 1元=多少积分，如 1000
					if (config.ad_score_rate) {
						this.pointsRate = 1 / config.ad_score_rate
					}
					// 手续费比例
					if (config.withdrawal_fee_rate !== undefined) {
						this.feeRate = config.withdrawal_fee_rate
					}
					// 最低提现积分
					if (config.withdrawal_min_score !== undefined) {
						this.minWithdraw = config.withdrawal_min_score
					}
				}
			} catch (error) {
				console.error('获取系统配置失败:', error)
			}
		},

		/**
		 * 加载用户积分
		 */
		async loadUserPoints() {
			try {
				const res = await db.collection("uni-id-users")
					.where('"_id" == $env.uid')
					.field('score')
					.limit(1)
					.get()

				if (res.result.data?.length > 0) {
					this.availablePoints = res.result.data[0].score || 0
				}
			} catch (error) {
				console.error('获取积分失败:', error)
				this.availablePoints = 0
			}
		},

		/**
		 * 选择提现方式
		 */
		selectMethod(method) {
			this.selectedMethod = method
		},

		/**
		 * 全部提现
		 */
		withdrawAll() {
			this.withdrawAmount = this.availablePoints
		},

		/**
		 * 提交提现申请
		 */
		submitWithdraw() {
			if (!this.canSubmit) {
				return
			}

			// 验证提现金额
			if (this.withdrawAmount < this.minWithdraw) {
				uni.showToast({
					title: `最低提现${this.minWithdraw}积分`,
					icon: 'none'
				})
				return
			}

			if (this.withdrawAmount > this.availablePoints) {
				uni.showToast({
					title: '积分不足',
					icon: 'none'
				})
				return
			}

			// 显示确认对话框
			uni.showModal({
				title: '提现确认',
				content: `确认提现${this.withdrawAmount}积分，实际到账¥${this.actualAmount.toFixed(2)}？`,
				success: (res) => {
					if (res.confirm) {
						this.processWithdraw()
					}
				}
			})
		},

		/**
		 * 处理提现
		 */
		async processWithdraw() {
			if (this.submitting) return
			this.submitting = true

			uni.showLoading({
				title: '提交中...',
				mask: true
			})

			try {
				// 构建账户信息
				let account_info = {}
				if (this.selectedMethod === 'alipay') {
					account_info = {
						account: this.alipayInfo.account,
						name: this.alipayInfo.name
					}
				} else if (this.selectedMethod === 'bank') {
					account_info = {
						account: this.bankInfo.cardNumber,
						name: this.bankInfo.name,
						bank_name: this.bankInfo.bankName
					}
				}

				// 调用云函数提交提现申请
				const result = await sfCo.action({
					name: 'client/withdrawal/apply',
					data: {
						score: this.withdrawAmount,
						method: this.selectedMethod,
						account_info
					}
				})

				uni.hideLoading()

				if (result?.id) {
					// 更新可用积分
					this.availablePoints -= this.withdrawAmount
					// 清空提现金额
					this.withdrawAmount = ''

					uni.showToast({
						title: '提现申请已提交',
						icon: 'success',
						duration: 2000
					})

					// 延迟跳转到提现记录页面
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/ucenter/withdraw-record/withdraw-record'
						})
					}, 2000)
				} else {
					uni.showToast({
						title: '提交失败，请重试',
						icon: 'none'
					})
				}
			} catch (error) {
				uni.hideLoading()
				console.error('提现申请失败:', error)
				uni.showToast({
					title: error.message || '提交失败，请重试',
					icon: 'none'
				})
			} finally {
				this.submitting = false
			}
		},

		/**
		 * 跳转到提现记录
		 */
		toWithdrawRecord() {
			uni.navigateTo({
				url: '/pages/ucenter/withdraw-record/withdraw-record'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
view {
	display: flex;
	box-sizing: border-box;
	flex-direction: column;
}

.withdraw {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 20rpx;
	padding-bottom: 140rpx;
}

/* 余额卡片 */
.balance-card {
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 16px;
	box-shadow: 0 4px 16px rgba(91, 143, 249, 0.2);
}

.balance-header {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.balance-title {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
}

.record-link {
	flex-direction: row;
	align-items: center;
}

.record-text {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.8);
	margin-right: 4rpx;
}

.balance-content {
	flex-direction: row;
	align-items: baseline;
	margin-bottom: 12rpx;
}

.balance-number {
	font-size: 72rpx;
	font-weight: bold;
	color: #FFFFFF;
	margin-right: 12rpx;
}

.balance-unit {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
}

.balance-footer {

}

.balance-tip {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

/* 规则卡片 */
.rules-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.card-title {
	flex-direction: row;
	align-items: center;
	margin-bottom: 24rpx;
	padding-bottom: 20rpx;
	border-bottom: 1px solid #f0f0f0;
}

.title-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
	margin-left: 8rpx;
}

.rules-content {

}

.rule-item {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1px solid #f8f8f8;
}

.rule-item:last-child {
	border-bottom: none;
}

.rule-label {
	font-size: 28rpx;
	color: #666666;
}

.rule-value {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}

/* 表单卡片 */
.form-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.withdraw-methods {
	flex-direction: row;
	margin-top: 16rpx;
}

.method-item {
	flex: 1;
	height: 120rpx;
	align-items: center;
	justify-content: center;
	background: #f8f8f8;
	border-radius: 12rpx;
	margin-right: 20rpx;
	border: 2rpx solid transparent;
}

.method-item:last-child {
	margin-right: 0;
}

.method-item.active {
	background: rgba(0, 122, 255, 0.05);
	border-color: #007AFF;
}

.method-text {
	font-size: 26rpx;
	color: #666666;
	margin-top: 8rpx;
}

.method-item.active .method-text {
	color: #007AFF;
	font-weight: 500;
}

.form-input {
	height: 88rpx;
	background: #f8f8f8;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	margin-top: 16rpx;
}

.input-placeholder {
	color: #cccccc;
}

.amount-input-wrapper {
	flex-direction: row;
	align-items: center;
	background: #f8f8f8;
	border-radius: 12rpx;
	padding: 0 24rpx;
	margin-top: 16rpx;
}

.amount-input {
	flex: 1;
	height: 88rpx;
	font-size: 28rpx;
}

.all-btn {
	font-size: 28rpx;
	color: #007AFF;
	padding: 8rpx 16rpx;
}

.amount-info {
	margin-top: 30rpx;
	padding-top: 30rpx;
	border-top: 1px solid #f0f0f0;
}

.info-row {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.info-row:last-child {
	margin-bottom: 0;
}

.info-row.final {
	padding-top: 20rpx;
	border-top: 1px dashed #e0e0e0;
}

.info-label {
	font-size: 28rpx;
	color: #666666;
}

.info-value {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}

.info-value.fee {
	color: #ff6b6b;
}

.info-value.highlight {
	font-size: 36rpx;
	color: #007AFF;
	font-weight: bold;
}

/* 提交按钮 */
.submit-wrapper {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx;
	background: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	border-radius: 8px;
	border: none;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(91, 143, 249, 0.25);
}

.submit-btn[disabled] {
	opacity: 0.5;
}

.submit-btn::after {
	border: none;
}

.btn-text {
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: 600;
}
</style>
