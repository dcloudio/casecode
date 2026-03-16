<template>
	<view class="points-record">

		<!-- 顶部积分余额 -->
		<view class="header-balance">
			<view class="balance-info">
				<text class="balance-label">当前积分</text>
				<text class="balance-number">{{ currentBalance }}</text>
			</view>
		</view>

		<!-- 时间筛选 -->
		<view class="time-filter">
			<view
				v-for="(item, index) in timeFilters"
				:key="index"
				class="filter-item"
				:class="{ active: currentTimeFilter === item.value }"
				@click="changeTimeFilter(item.value)"
			>
				<text class="filter-text">{{ item.label }}</text>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="record-list">
			<view v-if="loading && records.length === 0" class="loading-wrapper">
				<text class="loading-text">加载中...</text>
			</view>

			<view v-else-if="!loading && records.length === 0" class="empty-state">
				<uni-icons type="list" size="60" color="#cccccc"></uni-icons>
				<text class="empty-text">暂无积分记录</text>
			</view>

			<scroll-view v-else class="scroll-content" scroll-y @scrolltolower="loadMore">
				<view
					v-for="record in records"
					:key="record._id"
					class="record-item"
				>
					<view class="record-left">
						<text class="record-source">{{ getSourceText(record.source) }}</text>
						<text class="record-time">{{ formatTime(record.create_date) }}</text>
						<text v-if="record.comment" class="record-comment">{{ record.comment }}</text>
					</view>
					<view class="record-right">
						<text class="record-score" :class="{ income: record.type === 1, expense: record.type === 2 }">
							{{ record.type === 1 ? '+' : '-' }}{{ Math.abs(record.score) }}
						</text>
						<text class="record-balance">余额: {{ record.balance }}</text>
					</view>
				</view>

				<!-- 加载更多 -->
				<view v-if="records.length > 0 && (loadMoreStatus === 'loading' || loadMoreStatus === 'more' || hasLoadedMore)" class="load-more">
					<uni-load-more :status="loadMoreStatus"></uni-load-more>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
const db = uniCloud.database();

export default {
	components: {
		statusBar
	},
	data() {
		return {
			// 当前积分余额
			currentBalance: 0,

			// 时间筛选
			timeFilters: [
				{ label: '全部', value: 'all' },
				{ label: '今日', value: 'today' },
				{ label: '昨日', value: 'yesterday' },
				{ label: '近7天', value: 'week' }
			],
			currentTimeFilter: 'all',

			// 积分记录列表
			records: [],

			// 分页
			limit: 20,
			offset: 0,

			// 加载状态
			loading: false,
			loadMoreStatus: 'more',
			hasLoadedMore: false // 是否已加载过更多数据
		}
	},
	onLoad() {
		this.loadCurrentBalance()
		this.loadRecords()
	},
	methods: {
		/**
		 * 加载当前积分余额
		 */
		async loadCurrentBalance() {
			try {
				const res = await db.collection("uni-id-scores")
					.where('"user_id" == $env.uid')
					.field('balance')
					.orderBy("create_date", "desc")
					.limit(1)
					.get()

				if (res.result.data && res.result.data.length > 0) {
					this.currentBalance = res.result.data[0].balance || 0
				}
			} catch (error) {
				console.error('获取积分余额失败:', error)
				this.currentBalance = 0
			}
		},

		/**
		 * 加载积分记录
		 */
		async loadRecords() {
			if (this.loading) return

			this.loading = true
			this.loadMoreStatus = 'loading'

			try {
				// 构建查询条件
				let where = '"user_id" == $env.uid'

				// 添加时间过滤
				const timeFilter = this.getTimeFilter()
				if (timeFilter) {
					where += ` && create_date >= ${timeFilter.start} && create_date <= ${timeFilter.end}`
				}

				const res = await db.collection("uni-id-scores")
					.where(where)
					.orderBy("_id", "desc")
					.skip(this.offset)
					.limit(this.limit)
					.get()

				const newList = res.result.data || []

				if (this.offset === 0) {
					this.records = newList
					this.hasLoadedMore = false
				} else {
					this.records = [...this.records, ...newList]
					this.hasLoadedMore = true
				}

				// 更新加载状态
				this.loadMoreStatus = newList.length < this.limit ? 'noMore' : 'more'
			} catch (error) {
				console.error('加载积分记录失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
				this.loadMoreStatus = 'noMore'
			} finally {
				this.loading = false
			}
		},

		/**
		 * 切换时间筛选
		 */
		changeTimeFilter(value) {
			this.currentTimeFilter = value
			this.offset = 0
			this.records = []
			this.loadMoreStatus = 'more'
			this.hasLoadedMore = false
			this.loadRecords()
		},

		/**
		 * 加载更多
		 */
		loadMore() {
			if (this.loadMoreStatus === 'more') {
				this.offset += this.limit
				this.loadRecords()
			}
		},

		/**
		 * 获取时间过滤条件
		 */
		getTimeFilter() {
			const now = new Date()
			const beijingOffset = 8 * 60 * 60 * 1000
			const beijingNow = new Date(now.getTime() + beijingOffset)
			const year = beijingNow.getUTCFullYear()
			const month = String(beijingNow.getUTCMonth() + 1).padStart(2, '0')
			const day = String(beijingNow.getUTCDate()).padStart(2, '0')

			const todayStart = new Date(`${year}-${month}-${day}T00:00:00+08:00`).getTime()
			const todayEnd = new Date(`${year}-${month}-${day}T23:59:59.999+08:00`).getTime()

			switch (this.currentTimeFilter) {
				case 'today':
					return { start: todayStart, end: todayEnd }
				case 'yesterday':
					const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
					const yesterdayEnd = todayStart - 1
					return { start: yesterdayStart, end: yesterdayEnd }
				case 'week':
					const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000
					return { start: weekStart, end: todayEnd }
				case 'all':
				default:
					return null
			}
		},

		/**
		 * 获取积分来源文本
		 */
		getSourceText(source) {
			const sourceMap = {
				'rewarded-video-ad': '观看广告',
				'invite': '邀请奖励',
				'admin_add': '管理员增加',
				'admin_deduct': '管理员扣除',
				'exchange': '积分兑换',
				'withdraw': '积分提现',
				'system': '系统奖励'
			}
			return sourceMap[source] || source || '其他'
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
page {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
}

view {
	display: flex;
	box-sizing: border-box;
	flex-direction: column;
}

.points-record {
	width: 100%;
	min-height: 100vh;
	background: #FAFAFA;
	overflow-x: hidden;
}

/* 顶部积分余额 */
.header-balance {
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	padding: 24px 20px;
	align-items: center;

	.balance-info {
		align-items: center;

		.balance-label {
			font-size: 14px;
			color: rgba(255, 255, 255, 0.9);
			margin-bottom: 8px;
		}

		.balance-number {
			font-size: 32px;
			font-weight: 600;
			color: #FFFFFF;
		}
	}
}

/* 时间筛选 */
.time-filter {
	flex-direction: row;
	justify-content: space-around;
	background: #FFFFFF;
	padding: 12px 20px;
	margin-bottom: 12px;

	.filter-item {
		padding: 6px 20px;
		border-radius: 999px;
		background: #F5F5F5;

		.filter-text {
			font-size: 14px;
			color: #595959;
		}

		&.active {
			background: #5B8FF9;

			.filter-text {
				color: #FFFFFF;
				font-weight: 500;
			}
		}
	}
}

/* 记录列表 */
.record-list {
	flex: 1;
	min-height: 400px;

	.loading-wrapper {
		padding: 60px 0;
		align-items: center;
		justify-content: center;

		.loading-text {
			font-size: 14px;
			color: #8C8C8C;
		}
	}

	.empty-state {
		background: #FFFFFF;
		border-radius: 12px;
		padding: 60px 0;
		margin: 0 16px;
		align-items: center;
		justify-content: center;

		.empty-text {
			font-size: 14px;
			color: #8C8C8C;
			margin-top: 16px;
		}
	}

	.scroll-content {
		flex: 1;
		padding: 0 16px;
		box-sizing: border-box;

		.record-item {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			background: #FFFFFF;
			border-radius: 12px;
			padding: 16px;
			margin-bottom: 12px;

			.record-left {
				flex: 1;

				.record-source {
					font-size: 15px;
					color: #262626;
					font-weight: 500;
					margin-bottom: 6px;
				}

				.record-time {
					font-size: 13px;
					color: #8C8C8C;
					margin-bottom: 4px;
				}

				.record-comment {
					font-size: 12px;
					color: #BFBFBF;
				}
			}

			.record-right {
				align-items: flex-end;

				.record-score {
					font-size: 18px;
					font-weight: 600;
					margin-bottom: 4px;

					&.income {
						color: #52C41A;
					}

					&.expense {
						color: #F5222D;
					}
				}

				.record-balance {
					font-size: 12px;
					color: #8C8C8C;
				}
			}
		}

		.load-more {
			padding: 20px 0;
			align-items: center;
		}
	}
}
</style>
