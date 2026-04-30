<template>
	<view>
		<web-view :src="url"></web-view>
	</view>
</template>

<script>
	export default {
		async onLoad({url,title}) {
			this.url = url;
			title?uni.setNavigationBarTitle({title}):'';
		},
		data() {
			return {
				url: ''
			}
		}
	}
</script>


