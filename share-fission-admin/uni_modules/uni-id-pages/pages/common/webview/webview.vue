<!-- 网络链接内容展示页（uni-id-pages中用于展示隐私政策协议内容） -->
<template>
	<view>
		<web-view v-if="url" :src="url"></web-view>
	</view>
</template>

<script>
	export default {
		onLoad({url,title}) {
			if(url.substring(0, 4) != 'http'){
				uni.showModal({
					title:"错误",
					content: '不是一个有效的网站链接,'+'"'+url+'"',
					showCancel: false,
					confirmText:"知道了",
					complete: () => {
						uni.navigateBack()
					}
				});
				title = "页面路径错误"
			}else{
				this.url = url;
			}
			if(title){
				uni.setNavigationBarTitle({title});
			}
		},
		data() {
			return {
				url:null
			};
		}
	}
</script>
