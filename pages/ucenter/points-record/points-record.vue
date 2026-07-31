<template>
	<view class="points-record">
		<view class="record-scene">
			<view class="record-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="积分记录">
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
						<text class="hero-title">积分记录</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">账</text>

				<view class="balance-strip" :aria-label="`当前积分 ${currentBalance}`">
					<view class="balance-label-wrap">
						<view class="balance-medallion" aria-hidden="true">
							<uni-icons type="wallet-filled" size="15" color="#d14b1d"></uni-icons>
						</view>
						<text class="balance-label">当前积分</text>
					</view>
					<view class="balance-number-wrap">
						<text class="balance-number" :style="balanceNumberStyle">{{ currentBalance }}</text>
						<text class="balance-unit">分</text>
					</view>
				</view>
			</view>

			<view class="record-panel ornate-panel">
				<view class="panel-content">
					<view class="section-heading">
						<view class="heading-rule"></view>
						<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
						<text class="section-title">积分明细</text>
						<text class="heading-ornament" aria-hidden="true">❧</text>
						<view class="heading-rule heading-rule-right"></view>
					</view>

					<view class="time-filter" role="tablist" aria-label="积分记录时间范围">
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

					<view class="list-heading">
						<view class="list-title-wrap">
							<view class="title-mark" aria-hidden="true"></view>
							<text class="list-title">积分流水</text>
						</view>
						<text class="range-label">{{ currentTimeFilterLabel }}</text>
					</view>

					<view class="record-list">
						<view v-if="loading && records.length === 0" class="skeleton-list" aria-label="积分记录加载中">
							<view v-for="index in 4" :key="index" class="skeleton-row">
								<view class="skeleton-icon shimmer"></view>
								<view class="skeleton-details">
									<view class="skeleton-line skeleton-line-title shimmer"></view>
									<view class="skeleton-line skeleton-line-time shimmer"></view>
								</view>
								<view class="skeleton-amount shimmer"></view>
							</view>
						</view>

						<view v-else-if="!loading && loadError && records.length === 0" class="empty-state">
							<view class="empty-medallion empty-medallion-error">
								<uni-icons type="info-filled" size="30" color="#c9893a"></uni-icons>
							</view>
							<text class="empty-text">积分记录加载失败</text>
							<view
								class="retry-action"
								hover-class="retry-action-pressed"
								role="button"
								tabindex="0"
								@click="retryLoad"
								@keyup.enter="retryLoad"
							>
								<uni-icons type="loop" size="14" color="#a75724"></uni-icons>
								<text class="retry-action-text">重新加载</text>
							</view>
						</view>

						<view v-else-if="!loading && records.length === 0" class="empty-state">
							<view class="empty-medallion">
								<uni-icons type="list" size="31" color="#d4933e"></uni-icons>
							</view>
							<text class="empty-text">暂无积分记录</text>
						</view>

						<scroll-view
							v-else
							class="scroll-content"
							scroll-y
							:show-scrollbar="false"
							@scrolltolower="loadMore"
						>
							<view v-for="record in records" :key="record._id" class="record-item">
								<view class="record-left">
									<view
										class="record-icon"
										:class="isIncomeRecord(record) ? 'record-icon-income' : 'record-icon-expense'"
										aria-hidden="true"
									>
										<uni-icons
											:type="isIncomeRecord(record) ? 'plus-filled' : 'minus-filled'"
											size="17"
											:color="isIncomeRecord(record) ? '#d84b1c' : '#477c69'"
										></uni-icons>
									</view>
									<view class="record-copy">
										<text class="record-source">{{ getSourceText(record.source) }}</text>
										<text class="record-time">{{ formatTime(record.create_date) }}</text>
										<text v-if="record.comment" class="record-comment">{{ record.comment }}</text>
									</view>
								</view>
								<view class="record-right">
									<text
										class="record-score"
										:class="isIncomeRecord(record) ? 'record-score-income' : 'record-score-expense'"
										:style="getAmountStyle(record.score)"
									>
										{{ isIncomeRecord(record) ? '+' : '-' }}{{ Math.abs(Number(record.score) || 0) }}
									</text>
									<text class="record-balance">余额 {{ record.balance }}</text>
								</view>
							</view>

							<view v-if="loadMoreError" class="load-more-error">
								<text class="load-more-error-text">加载失败</text>
								<view
									class="load-more-retry"
									hover-class="load-more-retry-pressed"
									role="button"
									tabindex="0"
									@click="retryLoadMore"
									@keyup.enter="retryLoadMore"
								>
									<uni-icons type="loop" size="13" color="#a75724"></uni-icons>
									<text class="load-more-retry-text">重试</text>
								</view>
							</view>
							<view
								v-else-if="records.length > 0 && (loadMoreStatus === 'loading' || loadMoreStatus === 'more' || hasLoadedMore)"
								class="load-more"
							>
								<uni-load-more :status="loadMoreStatus"></uni-load-more>
							</view>
							<view class="record-list-end"></view>
						</scroll-view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()

export default {
	data() {
		return {
			statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
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
			loadError: false,
			loadMoreError: false,
			loadMoreStatus: 'more',
			hasLoadedMore: false, // 是否已加载过更多数据
			recordsRequestId: 0
		}
	},
	computed: {
		heroLayoutStyle() {
			const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
			const heroHeight = 178 + safeAreaOffset

			return {
				'--record-status-bar-height': `${this.statusBarHeight}px`,
				'--record-safe-area-offset': `${safeAreaOffset}px`,
				'--record-balance-top': `${105 + safeAreaOffset}px`,
				height: `${heroHeight}px`,
				flexBasis: `${heroHeight}px`
			}
		},
		balanceNumberStyle() {
			const length = Math.max(1, String(this.currentBalance).length)
			const fontSize = Math.min(29, Math.max(13, Math.floor(112 / length)))
			return { fontSize: `${fontSize}px` }
		},
		currentTimeFilterLabel() {
			const selectedFilter = this.timeFilters.find(item => item.value === this.currentTimeFilter)
			return selectedFilter?.label || '全部'
		}
	},
	onLoad() {
		this.loadCurrentBalance()
		this.loadRecords()
	},
	methods: {
		goBack() {
			if (getCurrentPages().length > 1) {
				uni.navigateBack({ delta: 1 })
				return
			}

			uni.switchTab({ url: '/pages/ucenter/ucenter' })
		},

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
			const requestId = ++this.recordsRequestId
			const requestOffset = this.offset
			this.loading = true
			this.loadError = false
			this.loadMoreError = false
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
					.orderBy("create_date", "desc")
					.skip(requestOffset)
					.limit(this.limit)
					.get()

				if (requestId !== this.recordsRequestId) return

				const newList = res.result.data || []

				if (requestOffset === 0) {
					this.records = newList
					this.hasLoadedMore = false
				} else {
					this.records = [...this.records, ...newList]
					this.hasLoadedMore = true
				}

				// 更新加载状态
				this.loadMoreStatus = newList.length < this.limit ? 'noMore' : 'more'
			} catch (error) {
				if (requestId !== this.recordsRequestId) return

				console.error('加载积分记录失败:', error)
				this.loadError = requestOffset === 0
				this.loadMoreError = requestOffset > 0
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
				this.loadMoreStatus = 'noMore'
			} finally {
				if (requestId === this.recordsRequestId) {
					this.loading = false
				}
			}
		},

		/**
		 * 切换时间筛选
		 */
		changeTimeFilter(value) {
			if (value === this.currentTimeFilter) return

			this.currentTimeFilter = value
			this.offset = 0
			this.records = []
			this.loadMoreError = false
			this.loadMoreStatus = 'more'
			this.hasLoadedMore = false
			this.loadRecords()
		},

		retryLoad() {
			this.offset = 0
			this.records = []
			this.loadMoreError = false
			this.loadMoreStatus = 'more'
			this.hasLoadedMore = false
			this.loadRecords()
		},

		retryLoadMore() {
			if (this.loading || !this.loadMoreError) return

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
				'ad_watch': '观看广告',
				'sign_in': '每日签到',
				'team_reward': '团队奖励',
				'withdraw_fee_return': '提现手续费返还',
				'withdraw_refund': '提现退款',
				'admin_adjust': '管理员调整',
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

		isIncomeRecord(record) {
			if (Number(record.type) === 1) return true
			if (Number(record.type) === 2) return false
			return Number(record.score) >= 0
		},

		getAmountStyle(score) {
			const length = String(Math.abs(Number(score) || 0)).length + 1
			const fontSize = Math.min(21, Math.max(12, Math.floor(94 / length)))
			return { fontSize: `${fontSize}px` }
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
page,
view,
text,
image,
scroll-view {
	box-sizing: border-box;
	letter-spacing: 0;
}

page {
	width: 100%;
	height: 100%;
	background: #f9e7bd;
}

view {
	display: flex;
	flex-direction: column;
}

.points-record {
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #f9e7bd;
	color: #4b170d;
}

.record-scene {
	position: relative;
	display: flex;
	width: 100%;
	max-width: 430px;
	height: 100%;
	margin: 0 auto;
	overflow: hidden;
	flex-direction: column;
	background: #fae8be;
}

.record-hero {
	position: relative;
	z-index: 1;
	width: 100%;
	height: 178px;
	overflow: hidden;
	flex: 0 0 178px;
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
	padding-top: calc(8px + var(--record-status-bar-height, 0px));
}

.hero-title-row {
	position: relative;
	width: 100%;
	height: 53px;
	flex: 0 0 53px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 0 60px;
}

.back-button {
	position: absolute;
	top: 7px;
	left: 14px;
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
	min-width: 0;
	height: 20px;
	flex-shrink: 1;
	flex-direction: row;
	align-items: flex-end;
	overflow: hidden;
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
	top: calc(101px + var(--record-safe-area-offset, 0px));
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

.balance-strip {
	position: absolute;
	top: var(--record-balance-top, 105px);
	right: 68px;
	left: 68px;
	z-index: 3;
	height: 42px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 0 15px 0 9px;
	border: 1px solid rgba(218, 151, 58, 0.74);
	border-radius: 21px;
	background: linear-gradient(90deg, rgba(255, 250, 232, 0.93), rgba(255, 246, 221, 0.84));
	box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.72), 0 3px 7px rgba(120, 68, 20, 0.13);
}

.balance-label-wrap {
	min-width: 0;
	flex-direction: row;
	align-items: center;
}

.balance-medallion {
	width: 27px;
	height: 27px;
	flex: 0 0 27px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(224, 159, 70, 0.5);
	border-radius: 50%;
	background: #f8e6c3;
	box-shadow: inset 0 0 0 2px rgba(255, 252, 241, 0.6);
}

.balance-label {
	display: block;
	flex-shrink: 0;
	margin-left: 6px;
	color: #6a2b18;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	font-weight: 700;
	line-height: 18px;
	white-space: nowrap;
}

.balance-number-wrap {
	height: 100%;
	min-width: 0;
	flex: 1;
	flex-direction: row;
	align-items: center;
	justify-content: flex-end;
	margin-left: 8px;
}

.balance-number {
	display: block;
	max-width: calc(100% - 15px);
	overflow: hidden;
	color: #ec4a17;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 29px;
	font-weight: 700;
	line-height: 1;
	text-overflow: ellipsis;
	transform: translateY(-2px);
	white-space: nowrap;
}

.balance-unit {
	display: block;
	flex-shrink: 0;
	margin-left: 3px;
	color: #9b6040;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
	font-size: 12px;
	font-weight: 700;
	line-height: 18px;
}

.ornate-panel {
	position: relative;
	width: auto;
	border: 2px solid #dfa153;
	background: rgba(254, 248, 235, 0.98);
	box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.92), inset 0 0 0 4px rgba(218, 151, 58, 0.2), 0 5px 13px rgba(125, 66, 19, 0.16);
}

.ornate-panel::before {
	position: absolute;
	top: 7px;
	right: 7px;
	bottom: 0;
	left: 7px;
	z-index: 0;
	border: 1px solid rgba(223, 164, 82, 0.25);
	border-bottom: 0;
	border-radius: 17px 17px 0 0;
	content: '';
	pointer-events: none;
}

.record-panel {
	position: relative;
	z-index: 3;
	display: flex;
	min-height: 0;
	flex: 1;
	flex-direction: column;
	margin: -31px 16px 0;
	overflow: hidden;
	border-radius: 24px 24px 0 0;
}

.panel-content {
	position: relative;
	z-index: 1;
	display: flex;
	width: 100%;
	height: 100%;
	min-height: 0;
	flex: 1;
	flex-direction: column;
	padding: 12px 13px 0;
}

.section-heading {
	height: 28px;
	flex: 0 0 28px;
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

.time-filter {
	height: 36px;
	flex: 0 0 36px;
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
	height: 30px;
	min-width: 0;
	flex: 1;
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

.filter-item-pressed {
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

.list-heading {
	height: 43px;
	flex: 0 0 43px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-top: 4px;
	padding: 3px 4px 0;
	border-bottom: 1px solid rgba(207, 156, 92, 0.2);
}

.list-title-wrap {
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

.list-title {
	display: block;
	overflow: hidden;
	color: #4d190f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 17px;
	font-weight: 700;
	line-height: 24px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.range-label {
	display: block;
	max-width: 40%;
	flex-shrink: 0;
	margin-left: 8px;
	overflow: hidden;
	padding: 3px 10px;
	border: 1px solid rgba(216, 155, 70, 0.38);
	border-radius: 12px;
	background: rgba(250, 234, 202, 0.66);
	color: #805138;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	line-height: 18px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.record-list {
	min-height: 0;
	flex: 1;
	margin-top: 2px;
}

.scroll-content {
	display: block;
	width: 100%;
	height: 100%;
	min-height: 0;
	flex: 1;
}

.record-item {
	width: 100%;
	min-height: 76px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 10px 5px;
	border-bottom: 1px dashed rgba(211, 146, 68, 0.24);
}

.record-left {
	min-width: 0;
	flex: 1;
	flex-direction: row;
	align-items: center;
}

.record-icon {
	width: 38px;
	height: 38px;
	flex: 0 0 38px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-right: 10px;
	border: 1px solid rgba(218, 151, 58, 0.34);
	border-radius: 50%;
	box-shadow: inset 0 0 0 2px rgba(255, 252, 242, 0.52);
}

.record-icon-income {
	background: #f6dfcc;
}

.record-icon-expense {
	border-color: rgba(71, 124, 105, 0.32);
	background: #e0eadf;
}

.record-copy {
	min-width: 0;
	flex: 1;
	justify-content: center;
}

.record-source,
.record-time,
.record-comment {
	display: block;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.record-source {
	color: #4b170d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 16px;
	font-weight: 700;
	line-height: 22px;
}

.record-time {
	margin-top: 2px;
	color: #89624c;
	font-size: 12px;
	line-height: 17px;
}

.record-comment {
	margin-top: 1px;
	color: #a28471;
	font-size: 12px;
	line-height: 17px;
}

.record-right {
	max-width: 40%;
	min-width: 72px;
	flex-shrink: 0;
	align-items: flex-end;
	justify-content: center;
	margin-left: 8px;
}

.record-score {
	display: block;
	max-width: 100%;
	overflow: hidden;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 21px;
	font-weight: 700;
	line-height: 25px;
	text-align: right;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.record-score-income {
	color: #df4b18;
}

.record-score-expense {
	color: #477c69;
}

.record-balance {
	display: block;
	max-width: 100%;
	margin-top: 2px;
	overflow: hidden;
	color: #96745f;
	font-size: 12px;
	line-height: 17px;
	text-align: right;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.empty-state {
	min-height: 224px;
	flex: 1;
	align-items: center;
	justify-content: center;
}

.empty-medallion {
	width: 62px;
	height: 62px;
	flex: 0 0 62px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(218, 151, 58, 0.42);
	border-radius: 50%;
	background: rgba(255, 248, 231, 0.82);
	box-shadow: inset 0 0 0 4px rgba(237, 198, 137, 0.14);
}

.empty-medallion-error {
	background: #f8e9ca;
}

.empty-text {
	margin-top: 12px;
	color: #96745f;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 21px;
}

.retry-action {
	height: 31px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-top: 10px;
	padding: 0 13px;
	border: 1px solid rgba(207, 137, 52, 0.56);
	border-radius: 16px;
	background: #fff5dc;
	transition: opacity 120ms ease, transform 120ms ease;
}

.retry-action-pressed {
	opacity: 0.78;
	transform: scale(0.97);
}

.retry-action-text {
	margin-left: 5px;
	color: #a75724;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	font-weight: 700;
	line-height: 18px;
}

.load-more {
	padding: 9px 0 3px;
	align-items: center;
}

.load-more-error {
	height: 46px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
}

.load-more-error-text {
	color: #96745f;
	font-size: 12px;
	line-height: 18px;
}

.load-more-retry {
	height: 28px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-left: 8px;
	padding: 0 10px;
	border: 1px solid rgba(207, 137, 52, 0.5);
	border-radius: 14px;
	background: #fff5dc;
	transition: opacity 120ms ease, transform 120ms ease;
}

.load-more-retry-pressed {
	opacity: 0.78;
	transform: scale(0.97);
}

.load-more-retry-text {
	margin-left: 4px;
	color: #a75724;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 12px;
	font-weight: 700;
	line-height: 18px;
}

.record-list-end {
	height: calc(14px + constant(safe-area-inset-bottom));
	height: calc(14px + env(safe-area-inset-bottom));
	flex: 0 0 auto;
}

.skeleton-list {
	width: 100%;
}

.skeleton-row {
	height: 76px;
	flex-direction: row;
	align-items: center;
	padding: 10px 5px;
	border-bottom: 1px dashed rgba(211, 146, 68, 0.18);
}

.skeleton-icon {
	width: 38px;
	height: 38px;
	flex: 0 0 38px;
	border-radius: 50%;
}

.skeleton-details {
	min-width: 0;
	flex: 1;
	margin-left: 10px;
}

.skeleton-line {
	height: 8px;
	border-radius: 4px;
}

.skeleton-line-title {
	width: 52%;
}

.skeleton-line-time {
	width: 38%;
	margin-top: 10px;
}

.skeleton-amount {
	width: 58px;
	height: 25px;
	flex-shrink: 0;
	margin-left: 10px;
	border-radius: 5px;
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
	animation: record-shimmer 1.35s ease-in-out infinite;
}

@keyframes record-shimmer {
	to {
		left: 120%;
	}
}

@media (min-width: 431px) {
	.record-scene {
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

	.balance-strip {
		right: 58px;
		left: 58px;
	}

	.record-panel {
		margin-right: 12px;
		margin-left: 12px;
	}

	.panel-content {
		padding-right: 10px;
		padding-left: 10px;
	}

	.record-item,
	.skeleton-row {
		padding-right: 2px;
		padding-left: 2px;
	}

	.record-icon {
		width: 36px;
		height: 36px;
		flex-basis: 36px;
		margin-right: 8px;
	}

	.record-right {
		min-width: 64px;
		margin-left: 5px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.back-button,
	.filter-item,
	.retry-action,
	.load-more-retry {
		transition: none;
	}

	.shimmer::after {
		animation: none;
	}
}
</style>
