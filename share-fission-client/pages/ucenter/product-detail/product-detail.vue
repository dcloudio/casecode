<template>
	<view class="product-detail">
		<!-- 轮播图 -->
		<view class="swiper-container">
			<swiper class="swiper" :indicator-dots="true" :autoplay="true" :circular="true">
				<swiper-item v-for="(image, index) in product.images" :key="index">
					<image class="swiper-image" :src="image" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>

		<!-- 商品信息 -->
		<view class="product-info-card">
			<view class="product-header">
				<view class="product-title-section">
					<text class="product-name">{{ product.name }}</text>
					<text class="product-desc">{{ product.description }}</text>
				</view>
			</view>

			<view class="product-stats">
				<view class="stat-item">
					<text class="stat-label">已兑换</text>
					<text class="stat-value">{{ product.sales_count || 0 }}</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-label">库存</text>
					<text class="stat-value" :class="{ low: product.stock <= 10 }">{{ product.stock }}</text>
				</view>
			</view>
		</view>

		<!-- 商品详情 -->
		<view class="product-detail-card" v-if="product.detail_images?.length > 0">
			<view class="detail-header">
				<text class="detail-title">商品详情</text>
			</view>
			<view class="detail-content">
				<image class="detail-image" :src="product.detail_images?.[0]" mode="aspectFill"></image>

			</view>
		</view>

		<!-- 兑换须知 -->
		<view class="notice-card">
			<view class="notice-header">
				<uni-icons type="info" size="18" color="#007AFF"></uni-icons>
				<text class="notice-title">兑换须知</text>
			</view>
			<view class="notice-list">
				<view class="notice-item">
					<text class="notice-dot">•</text>
					<text class="notice-text">兑换后积分将立即扣除，不可退换</text>
				</view>
				<view class="notice-item">
					<text class="notice-dot">•</text>
					<text class="notice-text">虚拟商品兑换成功后，卡密将在订单详情中显示</text>
				</view>
				<view class="notice-item">
					<text class="notice-dot">•</text>
					<text class="notice-text">请在有效期内使用，过期无法退款</text>
				</view>
				<view class="notice-item">
					<text class="notice-dot">•</text>
					<text class="notice-text">如有问题请联系客服处理</text>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="user-points">
				<text class="points-label">兑换所需</text>
				<text class="points-value">{{ product.score_cost }} 积分</text>
			</view>
			<button
				class="exchange-btn"
				:disabled="!canExchange"
				@click="confirmExchange"
			>
				<text class="btn-text">{{ exchangeBtnText }}</text>
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
			productId: '',
			product: {
				id: '',
				name: '',
				desc: '',
				score_cost: "-",
				stock: 0,
				sales_count: 0,
				image: '',
				images: [],
				detail: ''
			},
			userPoints: 0,
			exchanging: false
		}
	},
	computed: {
		// 是否可以兑换
		canExchange() {
			return this.userPoints >= this.product.score_cost && this.product.stock > 0 && !this.exchanging
		},

		// 兑换按钮文本
		exchangeBtnText() {
			if (this.exchanging) {
				return '兑换中...'
			}
			if (this.product.stock <= 0) {
				return '已售罄'
			}
			if (this.userPoints < this.product.score_cost) {
				return '积分不足'
			}
			return '立即兑换'
		}
	},
	onLoad(options) {
		this.productId = options.id
		this.loadProductDetail()
		this.loadUserPoints()
	},
	methods: {
		/**
		 * 加载商品详情
		 */
		async loadProductDetail() {
			try {
				// 优先从缓存读取
				const products = uni.getStorageSync('mall_products') || []
				const cachedProduct = products.find(p => p.id === this.productId)

				if (cachedProduct) {
					this.product = cachedProduct
				}

				// 从后端获取最新数据
				const res = await sfCo.action({
					name: 'client/goods/getById',
					data: {
						_id: this.productId
					}
				})

				if (res && !res.errCode) {
					// 直接使用后端返回的数据，不做映射
					this.product = res
				} else if (!cachedProduct) {
					uni.showToast({
						title: '商品不存在',
						icon: 'none'
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (error) {
				console.error('加载商品详情失败:', error)
				// 如果后端获取失败但有缓存，继续使用缓存
				if (!this.product.id) {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			}
		},

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
		 * 确认兑换
		 */
		confirmExchange() {
			if (!this.canExchange) {
				return
			}

			uni.showModal({
				title: '确认兑换',
				content: `确认使用${this.product.score_cost}积分兑换【${this.product.name}】？`,
				success: (res) => {
					if (res.confirm) {
						this.processExchange()
					}
				}
			})
		},

		/**
		 * 处理兑换
		 */
		async processExchange() {
			if (this.exchanging) return
			this.exchanging = true

			uni.showLoading({
				title: '兑换中...',
				mask: true
			})

			try {
				const result = await sfCo.action({
					name: 'client/orders/create',
					data: {
						goods_id: this.productId
					}
				})

				uni.hideLoading()

				if (result?.errCode && result.errCode !== 0) {
					uni.showToast({
						title: result.errMsg || '兑换失败',
						icon: 'none'
					})
					return
				}

				// 更新本地积分和库存
				this.userPoints -= this.product.score_cost
				this.product.stock -= 1
				this.product.soldCount += 1

				uni.showModal({
					title: '兑换成功',
					content: '请在兑换记录中查看卡密',
					showCancel: false,
					success: () => {
						uni.navigateTo({
							url: '/pages/ucenter/exchange-order/exchange-order'
						})
					}
				})
			} catch (error) {
				uni.hideLoading()
				console.error('兑换失败:', error)
				uni.showToast({
					title: error.message || '兑换失败，请重试',
					icon: 'none'
				})
			} finally {
				this.exchanging = false
			}
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

.product-detail {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 140rpx;
}

/* 轮播图 */
.swiper-container {
	width: 750rpx;
	height: 750rpx;
	background: #FFFFFF;
}

.swiper {
	width: 100%;
	height: 100%;
}

.swiper-image {
	width: 100%;
	height: 100%;
}

/* 商品信息卡片 */
.product-info-card {
	background: #FFFFFF;
	margin-top: 20rpx;
	padding: 30rpx;
}

.product-header {
	flex-direction: row;
	justify-content: space-between;
	padding-bottom: 24rpx;
	border-bottom: 1px solid #f0f0f0;
}

.product-title-section {
	flex: 1;
}

.product-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 12rpx;
	line-height: 1.4;
}

.product-desc {
	font-size: 26rpx;
	color: #999999;
}


.product-stats {
	flex-direction: row;
	align-items: center;
	padding-top: 24rpx;
}

.stat-item {
	flex: 1;
	align-items: center;
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: #e0e0e0;
}

.stat-label {
	font-size: 24rpx;
	color: #999999;
	margin-bottom: 8rpx;
}

.stat-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.stat-value.low {
	color: #ff6b6b;
}

/* 商品详情卡片 */
.product-detail-card {
	background: #FFFFFF;
	margin-top: 20rpx;
	padding: 30rpx;
}

.detail-header {
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1px solid #f0f0f0;
}

.detail-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.detail-content {

}

.detail-text {
	font-size: 28rpx;
	color: #666666;
	line-height: 1.8;
}

/* 兑换须知 */
.notice-card {
	background: #FFFFFF;
	margin-top: 20rpx;
	padding: 30rpx;
}

.notice-header {
	flex-direction: row;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1px solid #f0f0f0;
}

.notice-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-left: 8rpx;
}

.notice-list {

}

.notice-item {
	flex-direction: row;
	margin-bottom: 16rpx;
}

.notice-item:last-child {
	margin-bottom: 0;
}

.notice-dot {
	font-size: 28rpx;
	color: #007AFF;
	margin-right: 12rpx;
	line-height: 1.6;
}

.notice-text {
	flex: 1;
	font-size: 26rpx;
	color: #666666;
	line-height: 1.6;
}

/* 底部操作栏 */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	padding: 20rpx 30rpx;
	flex-direction: row;
	align-items: center;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.user-points {
	flex: 1;
	margin-right: 20rpx;
}

.points-label {
	font-size: 24rpx;
	color: #999999;
	margin-bottom: 8rpx;
}

.points-value {
	font-size: 36rpx;
	font-weight: bold;
	color: #ff6b6b;
}

.exchange-btn {
	width: 300rpx;
	height: 88rpx;
	background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
	border-radius: 8px;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(91, 143, 249, 0.25);
}

.exchange-btn[disabled] {
	opacity: 0.5;
}

.exchange-btn::after {
	border: none;
}

.btn-text {
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: 600;
}
</style>
