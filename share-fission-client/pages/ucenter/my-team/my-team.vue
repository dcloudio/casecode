<template>
	<view class="my-team">
		<view class="team-scene">
			<view class="team-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="我的团队">
						<view class="title-cloud" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
						<text class="hero-title">我的团队</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">聚</text>
			</view>

			<view class="page-content">
				<view class="stats-panel ornate-panel">
					<view class="panel-content">
						<view class="section-heading">
							<view class="heading-rule"></view>
							<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
							<text class="section-title">我的收益</text>
							<text class="heading-ornament" aria-hidden="true">❧</text>
							<view class="heading-rule heading-rule-right"></view>
						</view>

						<view class="time-filter" role="tablist" aria-label="收益时间范围">
							<view
								v-for="item in timeFilters"
								:key="item.value"
								class="filter-item"
								:class="{ 'filter-item-active': currentTimeFilter === item.value }"
								role="tab"
								:aria-selected="currentTimeFilter === item.value"
								:hover-class="currentTimeFilter === item.value ? 'none' : 'filter-item-pressed'"
								@click="changeTimeFilter(item.value)"
							>
								<text class="filter-text">{{ item.label }}</text>
							</view>
						</view>

						<view class="stats-summary">
							<view class="stat-item">
								<text class="stat-label">积分收益</text>
								<text class="stat-value stat-value-primary" :style="getStatValueStyle(statsData.points)">{{ statsData.points }}</text>
							</view>
							<view class="stat-item">
								<text class="stat-label">一级用户</text>
								<text class="stat-value" :style="getStatValueStyle(statsData.level1Count)">{{ statsData.level1Count }}</text>
							</view>
							<view class="stat-item">
								<text class="stat-label">二级用户</text>
								<text class="stat-value stat-value-secondary" :style="getStatValueStyle(statsData.level2Count)">{{ statsData.level2Count }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="team-panel ornate-panel">
					<view class="panel-content team-panel-content">
						<view class="team-header">
							<view class="team-title-wrap">
								<view class="title-mark" aria-hidden="true"></view>
								<text class="team-title">团队成员</text>
							</view>
							<text class="team-count">共 {{ totalCount }} 人</text>
						</view>

						<view class="level-tabs" role="tablist" aria-label="团队层级">
							<view
								v-for="tab in levelTabs"
								:key="tab.value"
								class="tab-item"
								:class="{ 'tab-item-active': currentLevel === tab.value }"
								role="tab"
								:aria-selected="currentLevel === tab.value"
								:hover-class="currentLevel === tab.value ? 'none' : 'tab-item-pressed'"
								@click="changeLevel(tab.value)"
							>
								<text class="tab-text">{{ tab.label }}</text>
								<text class="tab-count">{{ tab.value === 1 ? level1Total : level2Total }}</text>
							</view>
						</view>

						<view class="member-list">
							<view v-if="loading && teamList.length === 0" class="skeleton-list" aria-label="团队成员加载中">
								<view v-for="index in 4" :key="index" class="skeleton-row">
									<view class="skeleton-avatar shimmer"></view>
									<view class="skeleton-details">
										<view class="skeleton-line skeleton-line-name shimmer"></view>
										<view class="skeleton-line skeleton-line-time shimmer"></view>
									</view>
									<view class="skeleton-tag shimmer"></view>
								</view>
							</view>

							<view v-else-if="teamList.length === 0" class="empty-state">
								<view class="empty-medallion">
									<uni-icons type="person" size="31" color="#d4933e"></uni-icons>
								</view>
								<text class="empty-text">暂无团队成员</text>
							</view>

							<view v-else class="member-items">
								<view v-for="member in teamList" :key="member.uid" class="member-item">
									<view class="member-info">
										<cloud-image
											v-if="member.avatarFile?.url"
											class="member-avatar"
											:src="member.avatarFile.url"
											width="44px"
											height="44px"
										></cloud-image>
										<view v-else class="member-avatar default-avatar">
											<uni-icons type="person-filled" size="20" color="#a66f42"></uni-icons>
										</view>

										<view class="member-details">
											<text class="member-name">{{ member.nickname || member.username || '用户' + member.uid.slice(-6) }}</text>
											<text class="member-time">{{ formatTime(member.inviteTime) }}</text>
										</view>
									</view>

									<view class="member-tag" :class="{ 'member-tag-secondary': currentLevel === 2 }">
										<text class="tag-text">{{ currentLevel === 1 ? '一级' : '二级' }}</text>
									</view>
								</view>
							</view>

							<view
								v-if="teamList.length > 0 && (loadMoreStatus === 'loading' || loadMoreStatus === 'more' || hasLoadedMore)"
								class="load-more"
							>
								<uni-load-more :status="loadMoreStatus"></uni-load-more>
							</view>
						</view>
					</view>
				</view>
			</view>

			<app-tabbar current="team"></app-tabbar>
		</view>
	</view>
</template>

<script>
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true });

export default {
	data() {
		return {
			statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
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
	computed: {
		heroLayoutStyle() {
			const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
			const heroHeight = 178 + safeAreaOffset

			return {
				'--team-status-bar-height': `${this.statusBarHeight}px`,
				height: `${heroHeight}px`,
				flexBasis: `${heroHeight}px`
			}
		}
	},
	onLoad() {
		this.loadTeamData()
		this.loadStatsData()
	},
	onShow() {
		uni.hideTabBar({
			animation: false
		})
	},
	onReachBottom() {
		if (this.loadMoreStatus === 'more') {
			this.loadMore()
		}
	},
	methods: {
		getStatValueStyle(value) {
			const length = Math.max(1, String(value).length)
			const fontSize = Math.min(27, Math.max(8, Math.floor(104 / length)))
			return { fontSize: `${fontSize}px` }
		},

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
page,
view,
text,
image {
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

.my-team {
	min-height: 100vh;
	background: #f9e7bd;
}

.team-scene {
	position: relative;
	width: 100%;
	max-width: 430px;
	min-height: 100vh;
	margin: 0 auto;
	overflow: hidden;
	background: #fae8be;
}

.team-hero {
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
	padding-top: calc(8px + var(--team-status-bar-height, 0px));
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
	margin-top: -31px;
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

.stats-panel {
	border-radius: 24px;
}

.stats-panel::before {
	border-radius: 17px;
}

.stats-panel .panel-content {
	padding: 12px 13px 13px;
}

.section-heading {
	height: 28px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 0 10px;
}

.section-title {
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

.time-filter {
	height: 36px;
	flex-direction: row;
	align-items: center;
	margin-top: 7px;
	padding: 2px 3px;
	border: 1px solid rgba(232, 191, 126, 0.54);
	border-radius: 18px;
	background: rgba(253, 242, 222, 0.82);
	box-shadow: inset 0 1px 3px rgba(136, 77, 26, 0.04);
}

.filter-item {
	position: relative;
	min-width: 0;
	flex: 1;
	height: 30px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid transparent;
	border-radius: 15px;
	transition: opacity 120ms ease, transform 120ms ease;
}

.filter-item-active {
	border: 2px solid #efa950;
	background: linear-gradient(180deg, #f2551d 0%, #e33e0f 100%);
	box-shadow: inset 0 0 0 1px rgba(255, 203, 100, 0.7), 0 2px 5px rgba(141, 54, 9, 0.19);
}

.filter-item-active::before,
.filter-item-active::after {
	position: absolute;
	top: 50%;
	width: 5px;
	height: 5px;
	border: 1px solid #ffd177;
	background: #e94915;
	content: '';
	transform: translateY(-50%) rotate(45deg);
}

.filter-item-active::before {
	left: -3px;
}

.filter-item-active::after {
	right: -3px;
}

.filter-item-pressed,
.tab-item-pressed {
	opacity: 0.78;
	transform: scale(0.98);
}

.filter-text {
	display: block;
	max-width: calc(100% - 8px);
	overflow: hidden;
	color: #6c341f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	font-weight: 600;
	line-height: 20px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.filter-item-active .filter-text {
	color: #fffdf5;
	font-weight: 700;
	text-shadow: 0 1px 1px rgba(112, 36, 3, 0.22);
}

.stats-summary {
	height: 72px;
	flex-direction: row;
	align-items: stretch;
	margin-top: 9px;
	border-top: 1px dashed rgba(211, 146, 68, 0.34);
}

.stat-item {
	min-width: 0;
	flex: 1;
	align-items: center;
	justify-content: center;
}

.stat-item + .stat-item {
	border-left: 1px solid rgba(222, 155, 71, 0.35);
}

.stat-label {
	display: block;
	max-width: calc(100% - 8px);
	overflow: hidden;
	color: #7b4c2e;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 12px;
	font-weight: 600;
	line-height: 18px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.stat-value {
	display: block;
	width: calc(100% - 10px);
	margin-top: 3px;
	overflow: hidden;
	color: #5a2318;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 27px;
	font-weight: 700;
	line-height: 31px;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.stat-value-primary {
	color: #e94818;
}

.stat-value-secondary {
	color: #3f7465;
}

.team-panel {
	margin-top: 12px;
	border-radius: 22px;
}

.team-panel::before {
	border-radius: 15px;
}

.team-panel-content {
	padding: 12px 13px 9px;
}

.team-header {
	height: 38px;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 0 4px;
	border-bottom: 1px solid rgba(207, 156, 92, 0.2);
}

.team-title-wrap {
	min-width: 0;
	flex-direction: row;
	align-items: center;
}

.title-mark {
	width: 4px;
	height: 18px;
	flex-shrink: 0;
	margin-right: 7px;
	border-radius: 2px;
	background: linear-gradient(180deg, #f2551d, #d8380c);
	box-shadow: 0 1px 2px rgba(135, 50, 8, 0.16);
}

.team-title {
	display: block;
	overflow: hidden;
	color: #4d190f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 18px;
	font-weight: 700;
	line-height: 24px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.team-count {
	display: block;
	max-width: 44%;
	flex-shrink: 0;
	margin-left: 8px;
	overflow: hidden;
	padding: 3px 10px;
	border: 1px solid rgba(216, 155, 70, 0.38);
	border-radius: 12px;
	background: rgba(250, 234, 202, 0.66);
	color: #805138;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 18px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.level-tabs {
	height: 40px;
	flex-direction: row;
	margin-top: 9px;
	padding: 3px;
	border: 1px solid rgba(232, 191, 126, 0.54);
	border-radius: 20px;
	background: rgba(253, 242, 222, 0.82);
	box-shadow: inset 0 1px 3px rgba(136, 77, 26, 0.04);
}

.tab-item {
	position: relative;
	min-width: 0;
	flex: 1;
	height: 32px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid transparent;
	border-radius: 16px;
	transition: opacity 120ms ease, transform 120ms ease;
}

.tab-item-active {
	border-color: #d9943a;
	background: #f2ddb7;
	box-shadow: inset 0 0 0 1px rgba(255, 250, 235, 0.62), 0 1px 3px rgba(125, 66, 19, 0.09);
}

.tab-text {
	display: block;
	max-width: calc(100% - 46px);
	overflow: hidden;
	color: #805138;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 20px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tab-item-active .tab-text {
	color: #a94718;
	font-weight: 700;
}

.tab-count {
	display: block;
	min-width: 25px;
	max-width: 38px;
	margin-left: 6px;
	overflow: hidden;
	padding: 1px 6px;
	border-radius: 9px;
	background: rgba(142, 92, 55, 0.1);
	color: #89624c;
	font-size: 12px;
	line-height: 16px;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tab-item-active .tab-count {
	background: rgba(184, 80, 31, 0.12);
	color: #a94718;
	font-weight: 700;
}

.member-list {
	min-height: 232px;
	margin-top: 3px;
}

.empty-state {
	min-height: 224px;
	align-items: center;
	justify-content: center;
}

.empty-medallion {
	width: 62px;
	height: 62px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(218, 151, 58, 0.42);
	border-radius: 50%;
	background: rgba(255, 248, 231, 0.82);
	box-shadow: inset 0 0 0 4px rgba(237, 198, 137, 0.14);
}

.empty-text {
	margin-top: 12px;
	color: #96745f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 21px;
}

.member-item {
	width: 100%;
	min-height: 66px;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 10px 5px;
	border-bottom: 1px dashed rgba(211, 146, 68, 0.24);
}

.member-item:last-child {
	border-bottom: none;
}

.member-info {
	min-width: 0;
	flex: 1;
	flex-direction: row;
	align-items: center;
}

.member-avatar {
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	border-radius: 50%;
	margin-right: 11px;
	overflow: hidden;
	border: 2px solid rgba(221, 159, 73, 0.48);
	box-shadow: 0 2px 5px rgba(111, 61, 21, 0.11);
}

.default-avatar {
	background: #f6e8ce;
	align-items: center;
	justify-content: center;
}

.member-details {
	min-width: 0;
	flex: 1;
}

.member-name {
	display: block;
	width: 100%;
	overflow: hidden;
	color: #4b170d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 15px;
	font-weight: 700;
	line-height: 21px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.member-time {
	display: block;
	margin-top: 2px;
	color: #89624c;
	font-size: 12px;
	line-height: 17px;
	white-space: nowrap;
}

.member-tag {
	min-width: 48px;
	height: 27px;
	flex: 0 0 48px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-left: 10px;
	border: 1px solid #e8a44c;
	border-radius: 14px;
	background: linear-gradient(180deg, #f37c2b 0%, #df5918 100%);
	box-shadow: inset 0 0 0 1px rgba(255, 223, 158, 0.68), 0 2px 4px rgba(117, 57, 12, 0.13);
}

.member-tag-secondary {
	border-color: #80a391;
	background: linear-gradient(180deg, #5f907e 0%, #3f7465 100%);
	box-shadow: inset 0 0 0 1px rgba(218, 237, 224, 0.38), 0 2px 4px rgba(37, 82, 68, 0.14);
}

.tag-text {
	color: #fffdf5;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 12px;
	font-weight: 700;
	line-height: 18px;
	text-shadow: 0 1px 1px rgba(94, 39, 7, 0.2);
}

.load-more {
	padding: 9px 0 3px;
	align-items: center;
}

.skeleton-row {
	height: 66px;
	flex-direction: row;
	align-items: center;
	padding: 10px 5px;
	border-bottom: 1px dashed rgba(211, 146, 68, 0.18);
}

.skeleton-avatar {
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	border-radius: 50%;
}

.skeleton-details {
	min-width: 0;
	flex: 1;
	margin-left: 11px;
}

.skeleton-line {
	height: 8px;
	border-radius: 4px;
}

.skeleton-line-name {
	width: 52%;
}

.skeleton-line-time {
	width: 34%;
	margin-top: 9px;
}

.skeleton-tag {
	width: 48px;
	height: 27px;
	flex-shrink: 0;
	margin-left: 10px;
	border-radius: 14px;
}

.shimmer {
	position: relative;
	overflow: hidden;
	background: #efe1c5;
}

.shimmer::after {
	position: absolute;
	top: 0;
	bottom: 0;
	left: -80%;
	width: 70%;
	background: linear-gradient(90deg, transparent, rgba(255, 253, 245, 0.72), transparent);
	content: '';
	animation: team-shimmer 1.35s ease-in-out infinite;
}

@keyframes team-shimmer {
	to {
		left: 120%;
	}
}

@media (min-width: 431px) {
	.team-scene {
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

	.stats-panel .panel-content,
	.team-panel-content {
		padding-right: 10px;
		padding-left: 10px;
	}
}

@media (max-height: 740px) {
	.member-list,
	.empty-state {
		min-height: 130px;
	}

	.skeleton-row:nth-child(n + 3) {
		display: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.filter-item,
	.tab-item {
		transition: none;
	}

	.shimmer::after {
		animation: none;
	}
}
</style>
