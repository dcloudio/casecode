<template>
	<view class="withdraw-record">
		<!-- 统计信息 -->
		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-label">累计提现</text>
				<text class="stat-value">¥{{ totalAmount.toFixed(2) }}</text>
			</view>
			<view class="divider"></view>
			<view class="stat-item">
				<text class="stat-label">待审核</text>
				<text class="stat-value pending">{{ pendingCount }}</text>
			</view>
		</view>

		<!-- 状态筛选 -->
		<view class="filter-tabs">
			<view
				v-for="(tab, index) in statusTabs"
				:key="index"
				class="tab-item"
				:class="{ active: currentStatus === tab.value }"
				@click="changeStatus(tab.value)"
			>
				<text class="tab-text">{{ tab.label }}</text>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="record-list">
			<view v-if="filteredRecords.length === 0" class="empty-state">
				<uni-icons type="list" size="60" color="#cccccc"></uni-icons>
				<text class="empty-text">暂无提现记录</text>
			</view>

			<view
				v-for="(record, index) in filteredRecords"
				:key="record.id"
				class="record-item"
			>
				<view class="record-header">
					<view class="method-info">
						<uni-icons
							:type="record.method === 'bank' ? 'wallet' : 'scan'"
							size="20"
							color="#007AFF"
						></uni-icons>
						<text class="method-text">{{ record.method === 'bank' ? '银行卡' : '支付宝' }}</text>
					</view>
					<view class="status-tag" :class="getStatusClass(record.status)">
						<text class="status-text">{{ getStatusText(record.status) }}</text>
					</view>
				</view>

				<view class="record-content">
					<view class="content-row">
						<text class="content-label">提现积分</text>
						<text class="content-value">{{ record.score }} 积分</text>
					</view>
					<view class="content-row">
						<text class="content-label">兑换金额</text>
						<text class="content-value">¥{{ record.amount.toFixed(2) }}</text>
					</view>
					<view class="content-row">
						<text class="content-label">手续费</text>
						<text class="content-value fee">-¥{{ record.fee.toFixed(2) }}</text>
					</view>
					<view class="content-row highlight-row">
						<text class="content-label">实际到账</text>
						<text class="content-value amount">¥{{ record.actual_amount.toFixed(2) }}</text>
					</view>
				</view>

				<view class="record-footer">
					<text class="footer-time">{{ formatTime(record.create_time) }}</text>
					<text class="footer-id">订单号：{{ record._id.slice(-8) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true });

// 状态映射：后端数字状态 -> 前端字符串状态
const STATUS_MAP = {
	0: 'pending',    // 待审核
	1: 'approved',   // 审核通过
	2: 'rejected',   // 审核拒绝
	3: 'completed'   // 已打款/已完成
};

export default {
	data() {
		return {
			// 状态筛选
			statusTabs: [
				{ label: '全部', value: 'all' },
				{ label: '待审核', value: 'pending' },
				{ label: '已完成', value: 'completed' },
				{ label: '已拒绝', value: 'rejected' }
			],
			currentStatus: 'all',

			// 提现记录
			records: [],
			loading: false
		}
	},
	computed: {
		// 过滤后的记录
		filteredRecords() {
			if (this.currentStatus === 'all') {
				return this.records
			}
			return this.records.filter(record => {
				const statusStr = STATUS_MAP[record.status] || 'pending'
				return statusStr === this.currentStatus
			})
		},

		// 累计提现金额（已打款的）
		totalAmount() {
			return this.records
				.filter(record => record.status === 3) // 3 = 已打款
				.reduce((sum, record) => sum + (record.actual_amount || 0), 0)
		},

		// 待审核数量
		pendingCount() {
			return this.records.filter(record => record.status === 0).length
		}
	},
	onLoad() {
		this.loadRecords()
	},
	onShow() {
		// 每次显示页面时重新加载数据
		this.loadRecords()
	},
	methods: {
		/**
		 * 加载提现记录
		 */
		async loadRecords() {
			if (this.loading) return
			this.loading = true

			try {
				const result = await sfCo.action({
					name: 'client/withdrawal/getList',
					data: {
						pageIndex: 1,
						pageSize: 100,
						sortField: 'create_time',
						sortOrder: 'desc'
					}
				})

				if (result?.list) {
					this.records = result.list
				} else {
					this.records = []
				}
			} catch (error) {
				console.error('加载提现记录失败:', error)
				this.records = []
			} finally {
				this.loading = false
			}
		},

		/**
		 * 切换状态
		 */
		changeStatus(status) {
			this.currentStatus = status
		},

		/**
		 * 获取状态样式类
		 */
		getStatusClass(status) {
			return STATUS_MAP[status] || 'pending'
		},

		/**
		 * 获取状态文本
		 */
		getStatusText(status) {
			const statusTextMap = {
				0: '待审核',
				1: '已通过',
				2: '已拒绝',
				3: '已完成'
			}
			return statusTextMap[status] || '未知'
		},

		/**
		 * 格式化时间
		 */
		formatTime(timestamp) {
			if (!timestamp) return ''
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hour = String(date.getHours()).padStart(2, '0')
			const minute = String(date.getMinutes()).padStart(2, '0')

			return `${year}-${month}-${day} ${hour}:${minute}`
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

.withdraw-record {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

/* 统计卡片 */
.stats-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx;
	flex-direction: row;
	align-items: center;
}

.stat-item {
	flex: 1;
	align-items: center;
}

.divider {
	width: 1rpx;
	height: 80rpx;
	background: rgba(255, 255, 255, 0.2);
}

.stat-label {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
	margin-bottom: 12rpx;
}

.stat-value {
	font-size: 48rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.stat-value.pending {
	color: #FFD700;
}

/* 筛选标签 */
.filter-tabs {
	background: #FFFFFF;
	flex-direction: row;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.tab-item {
	flex: 1;
	height: 60rpx;
	align-items: center;
	justify-content: center;
	border-radius: 30rpx;
}

.tab-item.active {
	background: rgba(102, 126, 234, 0.1);
}

.tab-text {
	font-size: 28rpx;
	color: #666666;
}

.tab-item.active .tab-text {
	color: #667eea;
	font-weight: 600;
}

/* 记录列表 */
.record-list {
	padding: 0 20rpx;
}

.empty-state {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 100rpx 0;
	align-items: center;
	justify-content: center;
}

.empty-text {
	font-size: 28rpx;
	color: #999999;
	margin-top: 20rpx;
}

.record-item {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.record-header {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1px solid #f0f0f0;
}

.method-info {
	flex-direction: row;
	align-items: center;
}

.method-text {
	font-size: 30rpx;
	color: #333333;
	font-weight: 500;
	margin-left: 8rpx;
}

.status-tag {
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.status-tag.pending {
	background: rgba(255, 165, 0, 0.1);
}

.status-tag.completed {
	background: rgba(52, 199, 89, 0.1);
}

.status-tag.rejected {
	background: rgba(255, 59, 48, 0.1);
}

.status-text {
	font-size: 24rpx;
}

.status-tag.pending .status-text {
	color: #FFA500;
}

.status-tag.completed .status-text {
	color: #34C759;
}

.status-tag.rejected .status-text {
	color: #FF3B30;
}

.record-content {
	margin-bottom: 20rpx;
}

.content-row {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 0;
}

.content-row.highlight-row {
	padding-top: 20rpx;
	border-top: 1px dashed #e0e0e0;
}

.content-label {
	font-size: 28rpx;
	color: #666666;
}

.content-value {
	font-size: 28rpx;
	color: #333333;
}

.content-value.fee {
	color: #ff6b6b;
}

.content-value.amount {
	font-size: 32rpx;
	color: #007AFF;
	font-weight: bold;
}

.record-footer {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 1px solid #f8f8f8;
}

.footer-time {
	font-size: 24rpx;
	color: #999999;
}

.footer-id {
	font-size: 24rpx;
	color: #999999;
}
</style>
