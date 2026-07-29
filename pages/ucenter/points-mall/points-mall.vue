<template>
	<view class="points-mall">
		<view class="mall-scene">
			<view class="mall-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="积分商城">
						<view class="title-cloud title-cloud-left" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
						<text class="hero-title">积分商城</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">兑</text>

				<view class="balance-strip">
					<view class="balance-info">
						<text class="balance-label">我的积分</text>
						<view class="balance-number-wrap">
							<text class="balance-number" :style="userPointsStyle">{{ userPoints }}</text>
						</view>
					</view>
					<view
						class="order-link"
						hover-class="order-link-pressed"
						role="button"
						aria-label="查看兑换记录"
						@click="toExchangeOrder"
					>
						<text class="order-text">兑换记录</text>
						<uni-icons type="right" size="17" color="#fffdf5"></uni-icons>
					</view>
				</view>
			</view>

			<view class="mall-panel">
				<view class="panel-inner">
					<scroll-view
						class="category-scroll"
						scroll-x
						:show-scrollbar="false"
						:enable-flex="true"
					>
						<view
							class="category-list"
							:class="{ 'category-list-spread': level1Categories.length <= 4 }"
						>
							<view
								v-for="category in level1Categories"
								:key="category.value"
								class="category-item"
								:class="{ 'category-item-active': currentLevel1 === category.value }"
								hover-class="category-item-pressed"
								@click="selectLevel1Category(category.value)"
							>
								<view class="category-pill">
									<text class="category-text">{{ category.label }}</text>
								</view>
							</view>
						</view>
					</scroll-view>

					<scroll-view
						v-if="level2Categories.length > 0"
						class="subcategory-scroll"
						scroll-x
						:show-scrollbar="false"
					>
						<view class="subcategory-list">
							<view
								v-for="category in level2Categories"
								:key="category.value"
								class="subcategory-item"
								:class="{ 'subcategory-item-active': currentLevel2 === category.value }"
								@click="selectLevel2Category(category.value)"
							>
								<text class="subcategory-text">{{ category.label }}</text>
							</view>
						</view>
					</scroll-view>

					<view v-if="!loading" class="sort-bar">
						<text class="result-count">共 {{ filteredProducts.length }} 件商品</text>
						<view
							class="sort-control"
							hover-class="sort-control-pressed"
							role="button"
							:aria-label="
								sortType === 'asc'
									? '积分从低到高'
									: sortType === 'desc'
										? '积分从高到低'
										: '按积分排序'
							"
							@click="toggleSortType"
						>
							<text class="sort-text">积分</text>
							<view
								class="sort-arrow"
								:class="{ 'sort-arrow-up': sortType === 'asc' }"
								aria-hidden="true"
							></view>
						</view>
					</view>

					<view v-if="loading && products.length === 0" class="skeleton-grid" aria-label="商品加载中">
						<view v-for="index in 6" :key="index" class="skeleton-card">
							<view class="skeleton-image shimmer"></view>
							<view class="skeleton-info">
								<view class="skeleton-line skeleton-line-title shimmer"></view>
								<view class="skeleton-line skeleton-line-desc shimmer"></view>
								<view class="skeleton-line skeleton-line-points shimmer"></view>
							</view>
						</view>
					</view>

					<view v-else-if="!loading && filteredProducts.length === 0" class="empty-state">
						<view class="empty-medallion">
							<uni-icons type="shop" size="32" color="#d4933e"></uni-icons>
						</view>
						<text class="empty-text">暂无商品</text>
					</view>

					<scroll-view
						v-else
						class="product-list"
						scroll-y
						:show-scrollbar="false"
					>
						<view class="product-grid">
							<view
								v-for="product in sortedProducts"
								:key="product._id"
								class="product-item"
								:class="{ 'product-item-wide': wideProductImages[product._id] }"
								hover-class="product-item-pressed"
								@click="toProductDetail(product._id)"
							>
								<image
									class="product-image"
									:src="product.images?.[0]"
									mode="widthFix"
									:draggable="false"
									@load="handleProductImageLoad(product._id, $event)"
								></image>
								<view v-if="product.stock <= 0" class="sold-out-label">
									<text class="sold-out-text">已兑完</text>
								</view>
								<view class="product-info">
									<text class="product-name">{{ product.name }}</text>
									<text class="product-desc">{{ product.description }}</text>
									<view class="product-footer">
										<view class="product-points">
											<text class="points-number">{{ product.score_cost }}</text>
											<text class="points-unit">积分</text>
										</view>
										<text class="exchange-count">已兑{{ product.sales_count || 0 }}</text>
									</view>
								</view>
							</view>
						</view>
						<view class="product-list-end"></view>
					</scroll-view>
				</view>
			</view>

			<app-tabbar current="mall"></app-tabbar>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true });

export default {
	data() {
		return {
			statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
			lastUserId: uniCloud.getCurrentUserInfo().uid || '',
			// 用户积分
			userPoints: "-",

			// 多级分类
			level1Categories: [
				{ label: '全部', value: 'all', children: [] }
			],
			level2Categories: [],
			currentLevel1: 'all',
			currentLevel2: '',

			// 排序
			sortType: 'default', // default: 后端顺序, asc/desc: 按积分排序

			// 商品列表（由后端加载）
			products: [],
			// 分页
			pageIndex: 1,
			pageSize: 200,
			loading: true,
			// 缓存当前列表，用于详情页读取
			mallProductsCache: [],
			// 宽幅商品图使用更紧凑的信息区
			wideProductImages: {}
		}
	},
	computed: {
		heroLayoutStyle() {
			const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
			const heroHeight = 170 + safeAreaOffset

			return {
				'--mall-status-bar-height': `${this.statusBarHeight}px`,
				'--mall-balance-top': `${103 + safeAreaOffset}px`,
				height: `${heroHeight}px`,
				flexBasis: `${heroHeight}px`
			}
		},

		userPointsStyle() {
			const length = String(this.userPoints).length
			const fontSize = Math.min(31, Math.max(8, Math.floor(100 / length)))
			return { fontSize: `${fontSize}px` }
		},

		// 过滤后的商品（后端已按分类过滤，前端直接返回）
		filteredProducts() {
			return this.products
		},

		// 排序后的商品
		sortedProducts() {
			const products = [...this.filteredProducts]
			if (this.sortType === 'asc') {
				return products.sort((a, b) => a.score_cost - b.score_cost)
			} else if (this.sortType === 'desc') {
				return products.sort((a, b) => b.score_cost - a.score_cost)
			}
			return products
		}
	},
	onLoad() {
		this.loadUserPoints()
		this.loadCategoriesAndProducts()
	},
	onShow() {
		uni.hideTabBar({
			animation: false
		})
		const currentUserId = uniCloud.getCurrentUserInfo().uid || ''
		const loggedInAfterReturn = currentUserId && currentUserId !== this.lastUserId
		this.lastUserId = currentUserId

		if (loggedInAfterReturn) {
			getApp().globalData.pointsNeedRefresh = false
			this.loadUserPoints()
			this.loadCategoriesAndProducts()
			return
		}

		if (getApp().globalData.pointsNeedRefresh) {
			getApp().globalData.pointsNeedRefresh = false
			this.loadUserPoints()
		}
	},
	methods: {
		/**
		 * 加载用户积分
		 */
		async loadUserPoints() {
			try {
				const res = await db.collection("uni-id-scores")
					.where('"user_id" == $env.uid')
					.field('score,balance')
					.orderBy("create_date", "desc")
					.limit(1)
					.get()

				if (res.result.data && res.result.data.length > 0) {
					this.userPoints = res.result.data[0].balance || 0
				}
			} catch (error) {
				console.error('获取积分失败:', error)
				this.userPoints = 0
			}
		},

		/**
		 * 加载分类+商品
		 */
		async loadCategoriesAndProducts() {
			await this.loadCategories()
			await this.loadProducts(true)
		},

		/**
		 * 加载分类（client/goodsCategories/getTree）
		 */
		async loadCategories() {
			try {
				const res = await sfCo.action({
					name: 'client/goodsCategories/getTree',
					data: {}
				})
				const tree = (res && res.tree) || []

				// 组装一级分类：全部 + 后端一级分类
				const level1Categories = [{ label: '全部', value: 'all', children: [] }]

				tree.forEach((c) => {
					if (c && c._id && c.name) {
						level1Categories.push({
							label: String(c.name),
							value: String(c._id),
							children: (c.children || []).map(child => ({
								label: String(child.name || ''),
								value: String(child._id || '')
							}))
						})
					}
				})

				this.level1Categories = level1Categories
				this.currentLevel1 = 'all'
				this.currentLevel2 = ''
				this.level2Categories = []
			} catch (e) {
				console.error('加载分类失败:', e)
				this.level1Categories = [{ label: '全部', value: 'all', children: [] }]
				this.currentLevel1 = 'all'
				this.currentLevel2 = ''
				this.level2Categories = []
			}
		},

		/**
		 * 加载商品（client/goods/getList）
		 */
		async loadProducts(reset) {
			this.loading = true
			try {
				if (reset) {
					this.products = []
					this.pageIndex = 1
				}

				// 优先使用二级分类，其次一级分类
				const categoryId = this.currentLevel2 || (this.currentLevel1 === 'all' ? '' : this.currentLevel1)
				const res = await sfCo.action({
					name: 'client/goods/getList',
					data: {
						pageIndex: this.pageIndex,
						pageSize: this.pageSize,
						category_id: categoryId,
						sortField: 'sort_order',
						sortOrder: 'desc'
					}
				})
				const list = (res && (res.list || (res.data && res.data.list))) || []

				// 直接使用后端返回的数据，不做映射
				let products = this.products.concat(list)
				// 根据_id去重
				const uniqueProducts = {}
				products.forEach(product => {
					uniqueProducts[product._id] = product
				})
				this.products = Object.values(uniqueProducts)
				this.mallProductsCache = this.products
				uni.setStorageSync('mall_products', this.mallProductsCache)

				if (list.length >= this.pageSize) {
          this.pageIndex = this.pageIndex + 1
				}
			} catch (e) {
				console.error('加载商品失败:', e)
				if (reset) {
					this.products = []
					uni.setStorageSync('mall_products', [])
				}
			} finally {
				this.loading = false
			}
		},

		/**
		 * 选择一级分类
		 */
		selectLevel1Category(value) {
			this.currentLevel1 = value
			this.currentLevel2 = ''

			// 更新二级分类列表
			const selected = this.level1Categories.find(c => c.value === value)
			this.level2Categories = (selected && selected.children) || []

			// 重置分页并重新加载
			this.pageIndex = 1
			this.loadProducts(true)
		},

		/**
		 * 选择二级分类
		 */
		selectLevel2Category(value) {
			this.currentLevel2 = value

			// 重置分页并重新加载
			this.pageIndex = 1
			this.loadProducts(true)
		},

		/**
		 * 切换排序
		 */
		toggleSortType() {
			this.sortType = this.sortType === 'asc' ? 'desc' : 'asc'
		},

		handleProductImageLoad(productId, event) {
			const width = Number(event && event.detail && event.detail.width)
			const height = Number(event && event.detail && event.detail.height)

			if (!productId || !width || !height) {
				return
			}

			this.wideProductImages[productId] = width / height >= 2.2
		},

		/**
		 * 跳转到商品详情
		 */
		toProductDetail(productId) {
			uni.navigateTo({
				url: `/pages/ucenter/product-detail/product-detail?id=${productId}`
			})
		},

		/**
		 * 跳转到兑换记录
		 */
		toExchangeOrder() {
			uni.navigateTo({
				url: '/pages/ucenter/exchange-order/exchange-order'
			})
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
	height: 100%;
	background: #f9e7bd;
}

.points-mall {
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #f9e7bd;
}

.mall-scene {
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

.mall-hero {
	position: relative;
	z-index: 1;
	width: 100%;
	height: 170px;
	overflow: hidden;
	flex: 0 0 170px;
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
	display: flex;
	width: 100%;
	height: 100%;
	flex-direction: column;
	padding-top: calc(8px + var(--mall-status-bar-height, 0px));
}

.hero-title-row {
	display: flex;
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
	display: flex;
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
	top: 97px;
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
	top: var(--mall-balance-top, 103px);
	right: 68px;
	left: 68px;
	z-index: 3;
	display: flex;
	height: 42px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding-left: 18px;
	border: 1px solid rgba(218, 151, 58, 0.74);
	border-radius: 21px;
	background: linear-gradient(90deg, rgba(255, 250, 232, 0.92), rgba(255, 246, 221, 0.82));
	box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.72), 0 3px 7px rgba(120, 68, 20, 0.13);
}

.balance-info {
	display: flex;
	height: 100%;
	min-width: 0;
	flex: 1;
	flex-direction: row;
	align-items: center;
}

.balance-label {
	flex-shrink: 0;
	margin-right: 6px;
	color: #6a2b18;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	font-weight: 700;
	line-height: 18px;
	white-space: nowrap;
}

.balance-number-wrap {
	display: flex;
	height: 100%;
	flex: 1;
	min-width: 0;
	align-items: center;
}

.balance-number {
	display: block;
	color: #ec4a17;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 31px;
	font-weight: 700;
	line-height: 1;
	transform: translateY(-3px);
	white-space: nowrap;
}

.order-link {
	position: relative;
	display: flex;
	width: 111px;
	height: 38px;
	flex: 0 0 111px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-right: -52px;
	border: 2px solid #f0b45a;
	border-radius: 19px;
	background: linear-gradient(180deg, #f38b31 0%, #df661d 100%);
	box-shadow: inset 0 0 0 1px rgba(255, 232, 172, 0.74), inset 0 -2px 4px rgba(133, 49, 4, 0.16), 0 2px 4px rgba(117, 57, 12, 0.17);
	transition: opacity 120ms ease, transform 120ms ease;
}

.order-link::before,
.order-link::after {
	position: absolute;
	top: 50%;
	width: 5px;
	height: 5px;
	border: 1px solid rgba(255, 222, 151, 0.94);
	content: '';
	transform: translateY(-50%) rotate(45deg);
}

.order-link::before {
	left: 8px;
}

.order-link::after {
	right: 8px;
}

.order-link-pressed {
	opacity: 0.86;
	transform: scale(0.98);
}

.order-text {
	margin-left: 8px;
	color: #fffdf5;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 16px;
	font-weight: 700;
	line-height: 22px;
	text-shadow: 0 1px 1px rgba(116, 42, 3, 0.28);
	white-space: nowrap;
}

.mall-panel {
	position: relative;
	z-index: 3;
	display: flex;
	min-height: 0;
	flex: 1;
	flex-direction: column;
	margin: -25px 16px 0;
	overflow: hidden;
	border: 2px solid #dfa153;
	border-radius: 25px 25px 0 0;
	background: rgba(254, 248, 235, 0.97);
	box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.92), inset 0 0 0 4px rgba(218, 151, 58, 0.2), 0 5px 13px rgba(125, 66, 19, 0.16);
}

.mall-panel::before {
	position: absolute;
	top: 7px;
	right: 7px;
	bottom: 0;
	left: 7px;
	z-index: 0;
	border: 1px solid rgba(223, 164, 82, 0.25);
	border-bottom: 0;
	border-radius: 18px 18px 0 0;
	content: '';
	pointer-events: none;
}

.panel-inner {
	position: relative;
	z-index: 1;
	display: flex;
	width: 100%;
	height: 100%;
	min-height: 0;
	flex: 1;
	flex-direction: column;
}

.category-scroll {
	display: block;
	width: calc(100% - 28px);
	height: 38px;
	flex: 0 0 38px;
	margin: 8px 14px 0;
	overflow: hidden;
	border: 1px solid rgba(232, 191, 126, 0.54);
	border-radius: 19px;
	background: rgba(253, 242, 222, 0.82);
	box-shadow: inset 0 1px 3px rgba(136, 77, 26, 0.04);
	white-space: nowrap;
}

.category-list {
	display: flex;
	height: 100%;
	min-width: 100%;
	flex-direction: row;
	align-items: center;
	padding: 2px 4px;
}

.category-list-spread .category-item {
	min-width: 0;
	flex: 1;
}

.category-item {
	display: inline-flex;
	min-width: 88px;
	height: 34px;
	flex: 0 0 auto;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	transition: opacity 120ms ease, transform 120ms ease;
}

.category-item-pressed {
	opacity: 0.8;
	transform: scale(0.98);
}

.category-pill {
	position: relative;
	display: flex;
	width: calc(100% - 6px);
	height: 31px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid transparent;
	border-radius: 16px;
}

.category-text {
	display: block;
	max-width: calc(100% - 10px);
	overflow: hidden;
	color: #571f13;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 16px;
	font-weight: 600;
	line-height: 23px;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.category-item-active .category-pill {
	width: 82px;
	max-width: calc(100% - 6px);
	border: 2px solid #efa950;
	background: linear-gradient(180deg, #f2551d 0%, #e33e0f 100%);
	box-shadow: inset 0 0 0 1px rgba(255, 203, 100, 0.7), 0 2px 5px rgba(141, 54, 9, 0.19);
}

.category-item-active .category-pill::before,
.category-item-active .category-pill::after {
	position: absolute;
	top: 50%;
	width: 6px;
	height: 6px;
	border: 1px solid #ffd177;
	background: #e94915;
	content: '';
	transform: translateY(-50%) rotate(45deg);
}

.category-item-active .category-pill::before {
	left: -4px;
}

.category-item-active .category-pill::after {
	right: -4px;
}

.category-item-active .category-text {
	color: #fffdf5;
	font-weight: 700;
	text-shadow: 0 1px 1px rgba(112, 36, 3, 0.22);
}

.subcategory-scroll {
	display: block;
	width: calc(100% - 36px);
	height: 31px;
	flex: 0 0 31px;
	margin: 5px 18px 0;
	overflow: hidden;
	white-space: nowrap;
}

.subcategory-list {
	display: flex;
	height: 100%;
	flex-direction: row;
	align-items: center;
}

.subcategory-item {
	display: inline-flex;
	height: 27px;
	flex: 0 0 auto;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-right: 7px;
	padding: 0 13px;
	border: 1px solid rgba(224, 168, 89, 0.44);
	border-radius: 14px;
	background: rgba(255, 250, 237, 0.78);
}

.subcategory-item-active {
	border-color: #d9943a;
	background: #f2ddb7;
}

.subcategory-text {
	color: #805138;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	line-height: 19px;
	white-space: nowrap;
}

.subcategory-item-active .subcategory-text {
	color: #a94718;
	font-weight: 700;
}

.sort-bar {
	display: flex;
	width: 100%;
	height: 34px;
	flex: 0 0 34px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 0 17px;
}

.result-count {
	color: #76412d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	line-height: 21px;
	white-space: nowrap;
}

.sort-control {
	display: flex;
	width: 67px;
	height: 30px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid #ebc98d;
	border-radius: 10px;
	background: rgba(255, 248, 233, 0.9);
	transition: opacity 120ms ease, transform 120ms ease;
}

.sort-control-pressed {
	opacity: 0.76;
	transform: scale(0.97);
}

.sort-text {
	margin-right: 9px;
	color: #ad4d1d;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 14px;
	font-weight: 700;
	line-height: 20px;
}

.sort-arrow {
	width: 0;
	height: 0;
	border-top: 6px solid #c7792e;
	border-right: 5px solid transparent;
	border-left: 5px solid transparent;
	transition: transform 160ms ease;
}

.sort-arrow-up {
	transform: rotate(180deg);
}

.product-list {
	display: block;
	width: 100%;
	height: 0;
	min-height: 0;
	flex: 1;
}

.product-grid,
.skeleton-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 10px;
	row-gap: 7px;
	padding: 0 14px 12px;
}

.product-item {
	position: relative;
	display: flex;
	min-width: 0;
	align-self: start;
	flex-direction: column;
	overflow: hidden;
	border: 1px solid rgba(226, 180, 107, 0.74);
	border-radius: 8px;
	background: #fdf8ec;
	box-shadow: 0 2px 5px rgba(125, 66, 19, 0.12);
	transition: opacity 120ms ease, transform 120ms ease;
}

.product-item-pressed {
	opacity: 0.86;
	transform: scale(0.985);
}

.sold-out-label {
	position: absolute;
	top: 8px;
	right: 0;
	z-index: 2;
	display: flex;
	height: 24px;
	flex-direction: row;
	align-items: center;
	padding: 0 9px;
	border-radius: 12px 0 0 12px;
	background: rgba(83, 37, 20, 0.86);
	box-shadow: 0 1px 3px rgba(70, 30, 13, 0.18);
}

.sold-out-text {
	color: #fff8e9;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 12px;
	font-weight: 700;
	line-height: 18px;
	white-space: nowrap;
}

.product-image {
	display: block;
	width: 100%;
	min-height: 56px;
	flex-shrink: 0;
	background: #f6e9cf;
}

.product-info {
	display: flex;
	min-width: 0;
	flex-direction: column;
	padding: 4px 7px;
}

.product-name,
.product-desc {
	display: block;
	width: 100%;
	overflow: hidden;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.product-name {
	color: #4b170d;
	font-size: 15px;
	font-weight: 700;
	line-height: 19px;
}

.product-desc {
	margin-top: 0;
	color: #89624c;
	font-size: 12px;
	font-weight: 500;
	line-height: 16px;
}

.product-footer {
	display: flex;
	width: 100%;
	min-width: 0;
	flex-direction: row;
	align-items: flex-end;
	justify-content: space-between;
	margin-top: 1px;
}

.product-points {
	display: flex;
	min-width: 0;
	flex-direction: row;
	align-items: baseline;
}

.points-number {
	display: block;
	max-width: 75px;
	overflow: hidden;
	color: #e94818;
	font-family: Georgia, 'Songti SC', 'STSong', serif;
	font-size: 18px;
	font-weight: 700;
	line-height: 19px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.points-unit {
	flex-shrink: 0;
	margin-left: 4px;
	color: #e94818;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 13px;
	font-weight: 600;
	line-height: 18px;
	white-space: nowrap;
}

.exchange-count {
	flex-shrink: 0;
	margin-left: 5px;
	color: #866552;
	font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
	font-size: 12px;
	line-height: 18px;
	white-space: nowrap;
}

.product-item-wide .product-image {
	min-height: 0;
}

.product-item-wide .product-info {
	padding: 2px 7px 3px;
}

.product-item-wide .product-name {
	line-height: 17px;
}

.product-item-wide .product-desc {
	line-height: 15px;
}

.product-item-wide .product-footer {
	margin-top: 0;
}

.product-item-wide .points-number {
	line-height: 18px;
}

.product-item-wide .points-unit,
.product-item-wide .exchange-count {
	line-height: 16px;
}

.product-list-end {
	width: 100%;
	height: 8px;
}

.empty-state {
	display: flex;
	min-height: 0;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-bottom: 24px;
}

.empty-medallion {
	display: flex;
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

.skeleton-grid {
	min-height: 0;
	flex: 1;
	overflow: hidden;
}

.skeleton-card {
	height: 144px;
	overflow: hidden;
	border: 1px solid rgba(226, 180, 107, 0.45);
	border-radius: 8px;
	background: rgba(253, 248, 236, 0.92);
}

.skeleton-image {
	width: 100%;
	height: 82px;
}

.skeleton-info {
	padding: 8px;
}

.skeleton-line {
	height: 8px;
	margin-top: 6px;
	border-radius: 4px;
}

.skeleton-line-title {
	width: 72%;
	margin-top: 0;
}

.skeleton-line-desc {
	width: 88%;
}

.skeleton-line-points {
	width: 43%;
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
	animation: mall-shimmer 1.35s ease-in-out infinite;
}

@keyframes mall-shimmer {
	to {
		left: 120%;
	}
}

@media (min-width: 431px) {
	.mall-scene {
		box-shadow: 0 0 28px rgba(107, 59, 17, 0.18);
	}
}

@media (max-width: 390px) {
	.balance-strip {
		right: 54px;
		left: 54px;
	}

	.order-link {
		width: 104px;
		flex-basis: 104px;
		margin-right: -38px;
	}

	.category-text {
		font-size: 14px;
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
}

@media (prefers-reduced-motion: reduce) {
	.order-link,
	.category-item,
	.sort-control,
	.product-item,
	.sort-arrow {
		transition: none;
	}

	.shimmer::after {
		animation: none;
	}
}
</style>
