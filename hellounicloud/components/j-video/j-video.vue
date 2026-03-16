<template>
<view class="root" :style="{width,height}">
	<image :style="{width,height}" class="posterImg" :src="posterUrl" mode="aspectFit"></image>
	<view :style="{width,height}" @click="play" class="box">
		<image class="playIcon" src="../../static/play.png" mode="widthFix"></image>
	</view>
	<video
		id="myVideo"
		style="width: 1px;height: 1px;"
		:src="src"
		@timeupdate="timeupdate"
		@fullscreenchange="fullscreenchange"
	></video>
</view>
</template>

<script>
var videoContext;
	export default {
		mounted() {
			videoContext = uni.createVideoContext('myVideo',this)
		},
		computed:{
			posterUrl(){
				if(this.poster) return this.poster
				return this.src + '?x-oss-process=video/snapshot,t_'+(parseInt(this.currentTime*1000))+',f_jpg,w_800,m_fast'
			}
		},
		methods:{
			fullscreenchange(e){
				console.log(e.detail.fullScreen);
				this.state = e.detail.fullScreen
				if(!e.detail.fullScreen){
					videoContext.pause()
				}
			},
			timeupdate(e){
				// console.log(e.detail);
				this.duration = e.detail.duration
				this.currentTime = e.detail.currentTime
			},
			play(){
				videoContext.play()
				videoContext.requestFullScreen({direction:this.direction})
			}
		},
		watch: {
		},
		data() {
			return {
				state:false,
				currentTime:0,
				duration:0,
				videoId:''
			};
		},
		props: {
			poster: {
				type: [String,Boolean],
				default(){
					return 'https://web-assets.dcloud.net.cn/unidoc/zh/schema2code-poster.jpg'
				}
			},
			src: {
				type: String,
				default(){
					return ''
				}
			},
			title: {
				type: String,
				default(){
					return ''
				}
			},
			direction: {
				type: Number,
				default(){
					return -90
				}
			},
			width: {
				type: String,
				default(){
					return "750rpx";
				}
			},
			height: {
				type: String,
				default(){
					return "450rpx";
				}
			}
		},
	}
</script>

<style scoped>
.root{
	position:relative;
	width: 750rpx;
	height: 300px;
	overflow: hidden;
}
.posterImg,.video,.box{
	display: flex;
	width: 750rpx;
	height: 300px;
	position:absolute;
}
.posterImg{
}
.box{
	justify-content: center;
	align-items: center;
}
.playIcon{
	width: 100rpx;
}
</style>
