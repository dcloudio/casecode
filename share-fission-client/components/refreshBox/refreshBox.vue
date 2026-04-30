<template>
	<refresh @refresh="refresh" @pullingdown="onpullingdown" :display="showRefresh ? 'show' : 'hide'">
		<view class="refreshBox">
			<!-- 可以自己添加图片路径或base64实现图片 <image class="refreshImg" :src="config[state].img" mode="widthFix" resize="cover"></image> -->
			<text class="refreshText">{{config[state].text}}</text>
		</view>
	</refresh>
</template>
<script>
	export default {
		data() {
			return {
				showRefresh:false,
				state:0
			}
		},
		methods:{
			onpullingdown({pullingDistance,viewHeight}) {
				if(pullingDistance < viewHeight){
					this.state = 0
				}else{
					this.state = 1
				}
			},
			refresh(){
				// console.log('refresh');
				this.showRefresh = true
				this.state = 2
				this.$emit('refresh')
			}
		},
		watch: {
			loading(loading, oldValue) {
				if(!loading){
					this.showRefresh = false
					this.state = 3
				}
			}
		},
		props: {
			loading: {
				type:Boolean,
				default(){
					return false
				}
			},
			config: {
				type: Array,
				default(){
					return [
						{
							text:"继续下拉执行刷新",
							img:""//可以自己添加图片路径或base64实现图片
						},
						{
							text:"释放立即刷新",
							img:""//可以自己添加图片路径或base64实现图片
						},
						{
							text:"正在疯狂的加载中",
							img:""//可以自己添加图片路径或base64实现图片
						},
						{
							text:"加载成功",
							img:""//可以自己添加图片路径或base64实现图片
						}
					]
				}
			},
		},
	}
</script>

<style lang="scss" scoped>
.refreshBox{
	width: 750rpx;
	height: 50px;
	justify-content: center;
	align-items: center;
	flex-direction: row;
	/* #ifndef APP-PLUS */
	margin-top: -50px;
	/* #endif */
}
.refreshImg{
	width: 55rpx;
	height: 55rpx;
	z-index: 111;
}
.refreshText{
	font-size: 26rpx;
	color: #999999;
	padding-left: 6rpx;
}
</style>
