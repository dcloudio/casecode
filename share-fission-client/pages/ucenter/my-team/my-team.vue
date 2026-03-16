<template>
	<view class="my-team">
		<!-- 收益统计 -->
		<view class="stats-container">
      <!-- #ifndef H5 -->
      <statusBar></statusBar>
      <!-- #endif -->
			<view class="stats-header">
				<text class="stats-title">我的收益</text>
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

			<!-- 收益数据卡片 -->
			<view class="stats-cards">
				<view class="stat-card">
					<text class="stat-label">积分收益</text>
					<text class="stat-value">{{ statsData.points }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">一级用户</text>
					<text class="stat-value highlight">{{ statsData.level1Count }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">二级用户</text>
					<text class="stat-value highlight">{{ statsData.level2Count }}</text>
				</view>
			</view>
		</view>

		<!-- 团队成员 -->
		<view class="team-container">
			<view class="team-header">
				<text class="team-title">团队成员</text>
				<text class="team-count">共 {{ totalCount }} 人</text>
			</view>

			<!-- 层级切换 -->
			<view class="level-tabs">
				<view
					v-for="(tab, index) in levelTabs"
					:key="index"
					class="tab-item"
					:class="{ active: currentLevel === tab.value }"
					@click="changeLevel(tab.value)"
				>
					<text class="tab-text">{{ tab.label }}</text>
					<text class="tab-count">{{ tab.value === 1 ? level1Total : level2Total }}</text>
				</view>
			</view>

			<!-- 成员列表 -->
			<view class="member-list">
				<view v-if="teamList.length === 0 && !loading" class="empty-state">
					<uni-icons type="person" size="60" color="#cccccc"></uni-icons>
					<text class="empty-text">暂无团队成员</text>
				</view>

				<view
					v-for="member in teamList"
					:key="member.uid"
					class="member-item"
				>
					<view class="member-info">
						<cloud-image
							v-if="member.avatarFile?.url"
							class="member-avatar"
							:src="member.avatarFile.url"
							width="80rpx"
							height="80rpx"
						></cloud-image>
						<view v-else class="member-avatar default-avatar">
							<uni-icons type="person-filled" size="20" color="#999999"></uni-icons>
						</view>

						<view class="member-details">
							<text class="member-name">{{ member.nickname || member.username || '用户' + member.uid.slice(-6) }}</text>
							<text class="member-time">{{ formatTime(member.inviteTime) }}</text>
						</view>
					</view>

					<view class="member-tag">
						<text class="tag-text">{{ currentLevel === 1 ? '一级' : '二级' }}</text>
					</view>
				</view>

				<!-- 加载更多 -->
				<view v-if="teamList.length > 0 && (loadMoreStatus === 'loading' || loadMoreStatus === 'more' || hasLoadedMore)" class="load-more">
					<uni-load-more :status="loadMoreStatus"></uni-load-more>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true });

export default {
	components: {
		statusBar
	},
	data() {
		return {
			// 时间筛选
			timeFilters: [
				{ label: '今日', value: 'today' },
				{ label: '昨日', value: 'yesterday' },
				{ label: '近7天', value: 'week' },
				{ label: '全部', value: 'all' }
			],
			currentTimeFilter: 'all',

			// 层级切换
			levelTabs: [
				{ label: '一级用户', value: 1 },
				{ label: '二级用户', value: 2 }
			],
			currentLevel: 1,

			// 收益数据
			statsData: {
				points: 0,
				level1Count: 0,
				level2Count: 0
			},

			// 团队列表
			teamList: [],
			level1Total: 0,
			level2Total: 0,
			totalCount: 0,

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
		this.loadTeamData()
		this.loadStatsData()
	},
	onReachBottom() {
		if (this.loadMoreStatus === 'more') {
			this.loadMore()
		}
	},
	methods: {
		/**
		 * 加载团队数据
		 */
		async loadTeamData() {
			if (this.loading) return

			this.loading = true
			this.loadMoreStatus = 'loading'

			try {
				// 使用 share-fission-co 获取团队成员
				const res = await sfCo.action({
					name: 'client/user/getTeamMembers',
					data: {
						level: this.currentLevel,
						timeRange: this.currentTimeFilter,
						limit: this.limit,
						offset: this.offset,
						needTotal: true
					}
				})

				if (res?.errCode && res.errCode !== 0) {
					uni.showToast({
						title: res.errMsg || '加载失败',
						icon: 'none'
					})
					this.loadMoreStatus = 'noMore'
					return
				}

				const result = res?.data || res || {}
				const newList = result.invitedUser || []

				if (this.offset === 0) {
					this.teamList = newList
					this.hasLoadedMore = false
				} else {
					this.teamList = [...this.teamList, ...newList]
					this.hasLoadedMore = true
				}

				// 更新加载状态
				this.loadMoreStatus = newList.length < this.limit ? 'noMore' : 'more'
			} catch (error) {
				uni.showToast({
					title: error.message || '加载失败',
					icon: 'none'
				})
				this.loadMoreStatus = 'noMore'
			} finally {
				this.loading = false
			}
		},

		/**
		 * 加载收益数据
		 */
		async loadStatsData() {
			try {
				const res = await sfCo.action({
					name: 'client/user/getTeamStats',
					data: {
						timeRange: this.currentTimeFilter
					}
				})

				if (res?.errCode && res.errCode !== 0) {
					uni.showToast({
						title: res.errMsg || '加载失败',
						icon: 'none'
					})
					return
				}

				const result = res?.data || res || {}

				// 更新数量
				this.level1Total = Number(result.level1_count || 0)
				this.level2Total = Number(result.level2_count || 0)
				this.totalCount = this.level1Total + this.level2Total

				// 更新收益数据
				this.statsData = {
					points: Number(result.total_income || 0),
					level1Count: this.level1Total,
					level2Count: this.level2Total
				}
			} catch (error) {
				uni.showToast({
					title: error.message || '加载收益数据失败',
					icon: 'none'
				})
			}
		},

		/**
		 * 切换时间筛选
		 */
		changeTimeFilter(value) {
			this.currentTimeFilter = value
			this.offset = 0
			this.teamList = []
			this.loadMoreStatus = 'more'
			this.hasLoadedMore = false
			this.loadStatsData()
			this.loadTeamData()
		},

		/**
		 * 切换层级
		 */
		changeLevel(level) {
			if (this.currentLevel === level) return

			this.currentLevel = level
			this.offset = 0
			this.teamList = []
			this.loadMoreStatus = 'more'
			this.hasLoadedMore = false
			this.loadTeamData()
		},

		/**
		 * 加载更多
		 */
		loadMore() {
			this.offset += this.limit
			this.loadTeamData()
		},

		/**
		 * 格式化时间
		 */
		formatTime(timestamp) {
			if (!timestamp) return ''

			const date = new Date(timestamp)
			const now = new Date()
			const diff = now - date

			// 小于1分钟
			if (diff < 60000) {
				return '刚刚'
			}
			// 小于1小时
			if (diff < 3600000) {
				return Math.floor(diff / 60000) + '分钟前'
			}
			// 小于1天
			if (diff < 86400000) {
				return Math.floor(diff / 3600000) + '小时前'
			}
			// 小于7天
			if (diff < 604800000) {
				return Math.floor(diff / 86400000) + '天前'
			}

			// 超过7天显示具体日期
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')

			if (year === now.getFullYear()) {
				return `${month}-${day}`
			}
			return `${year}-${month}-${day}`
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

.my-team {
	min-height: 100vh;
	background: #FAFAFA;
	padding-bottom: 32px;
}

/* 收益统计 */
.stats-container {
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	padding: 24px 20px 20px;
	margin-bottom: 16px;
	box-shadow: 0 4px 16px rgba(91, 143, 249, 0.2);
}

.stats-header {
	margin-bottom: 30rpx;
}

.stats-title {
	font-size: 18px;
	font-weight: bold;
	color: #FFFFFF;
}

.time-filter {
	flex-direction: row;
	justify-content: space-around;
	margin-bottom: 30rpx;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 40rpx;
	padding: 8rpx;
}

.filter-item {
	flex: 1;
	height: 60rpx;
	align-items: center;
	justify-content: center;
	border-radius: 32rpx;
	transition: all 0.3s;
}

.filter-item.active {
	background: #FFFFFF;
}

.filter-text {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
}

.filter-item.active .filter-text {
	color: #667eea;
	font-weight: 600;
}

.stats-cards {
	flex-direction: row;
	justify-content: space-between;
}

.stat-card {
	flex: 1;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 16rpx;
	padding: 30rpx 20rpx;
	margin: 0 8rpx;
	align-items: center;
}

.stat-card:first-child {
	margin-left: 0;
}

.stat-card:last-child {
	margin-right: 0;
}

.stat-label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.9);
	margin-bottom: 12rpx;
}

.stat-value {
	font-size: 20px;
	font-weight: bold;
	color: #FFFFFF;
}

.stat-value.highlight {
	color: #FFD700;
}

/* 团队成员 */
.team-container {
	background: #FFFFFF;
	border-radius: 20rpx 20rpx 0 0;
	margin: 0 20rpx;
	padding: 30rpx;
}

.team-header {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 1px solid #f0f0f0;
}

.team-title {
	font-size: 16px;
	font-weight: bold;
	color: #333333;
}

.team-count {
	font-size: 14px;
	color: #999999;
}

.level-tabs {
	flex-direction: row;
	margin-bottom: 30rpx;
	background: #f8f8f8;
	border-radius: 12rpx;
	padding: 6rpx;
}

.tab-item {
	flex: 1;
	height: 70rpx;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx;
}

.tab-item.active {
	background: #FFFFFF;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.tab-text {
	font-size: 14px;
	color: #666666;
	margin-right: 8rpx;
}

.tab-item.active .tab-text {
	color: #333333;
	font-weight: 600;
}

.tab-count {
	font-size: 12px;
	color: #999999;
	background: #f0f0f0;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
}

.tab-item.active .tab-count {
	color: #667eea;
	background: rgba(102, 126, 234, 0.1);
}

/* 成员列表 */
.member-list {
	min-height: 400rpx;
}

.empty-state {
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-text {
	font-size: 14px;
	color: #999999;
	margin-top: 20rpx;
}

.member-item {
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1px solid #f5f5f5;
}

.member-item:last-child {
	border-bottom: none;
}

.member-info {
	flex: 1;
	flex-direction: row;
	align-items: center;
}

.member-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 20rpx;
	overflow: hidden;
}

.default-avatar {
	background: #f0f0f0;
	align-items: center;
	justify-content: center;
}

.member-details {
	flex: 1;
}

.member-name {
	font-size: 15px;
	color: #333333;
	font-weight: 500;
	margin-bottom: 8rpx;
}

.member-time {
	font-size: 12px;
	color: #999999;
}

.member-tag {
	background: #5B8FF9;
	padding: 4px 12px;
	border-radius: 4px;
}

.tag-text {
	font-size: 12px;
	color: #FFFFFF;
}

.load-more {
	padding: 20rpx 0;
	align-items: center;
}
</style>
