<template>
	<view class="error-page">
		<view class="error-container">
			<view class="error-code">404</view>
			<view class="error-title">页面未找到</view>
			<view class="error-msg" v-if="errMsg">{{errMsg}}</view>
		</view>
		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	export default {
		data() {
			return {
				errMsg: ''
			}
		},
		onLoad(query) {
			this.errMsg = query.errMsg || ''
		}
	}
</script>

<style scoped>
	page {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f7fa;
	}

	.error-container {
		text-align: center;
		padding: 40px 20px;
	}

	.error-code {
		font-size: 120px;
		font-weight: 700;
		color: #409eff;
		line-height: 1;
		margin-bottom: 20px;
	}

	.error-title {
		font-size: 24px;
		color: #303133;
		margin-bottom: 12px;
	}

	.error-msg {
		font-size: 14px;
		color: #909399;
		line-height: 1.6;
	}
</style>
