<template name="page-head">
<view>
	<view class="uni-page-heads">
		<view class="uni-page-heads-title">{{title}}</view>
	</view>
	<view class="row">
		<view class="">{{subTitle}}</view>
	</view>
</view>
</template>
<script>
	export default {
		name: "page-head",
		props: {
			title: {
				type: String,
				default: ""
			},
			subTitle: {
				type: String,
				default: ""
			}
		}
	}
</script>
<style lang="scss" scoped>
	.uni-page-heads{
		padding:35rpx;
		text-align: center;
	}
	.uni-page-heads-title {
		display: inline-block;
		padding: 0 40rpx;
		font-size: 30rpx;
		height: 88rpx;
		line-height: 88rpx;
		color: #5c5b5d;
		box-sizing: border-box;
		border-bottom: 2rpx solid #D8D8D8;
	}
	.row{
		width: 750rpx;
		text-align: center;
		margin-top: -30rpx;
		color: #999999;
	}
</style>
