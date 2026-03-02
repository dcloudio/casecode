<!-- 图片裁剪页 -->
<template>
	<view class="content" >
		<limeClipper :width="options.width" :scale-ratio="2" :is-lock-width="false" :is-lock-height="false" :height="options.height" :image-url="path"  
			@success="successFn" @cancel="cancel"  />
	</view>
</template>
<script>
import limeClipper from './limeClipper/limeClipper.vue';
export default {
	components: {limeClipper},
	data() {return {path: '',options:{"width":600,"height":600}}},
	onLoad({path,options}) {
		this.path = path
		// console.log('path-path-path-path',path);
		if(options){
			this.options = JSON.parse(options)
		}
	},
	methods:{
		successFn(e){
			this.getOpenerEventChannel().emit('success',e.url)
			uni.navigateBack()
		},
		cancel(){
			uni.navigateBack()
		}
	}
}
</script>

<style>
	.box{
		width: 400rpx;
	}
	.mt{
		margin-top: -10px;
	}
</style>