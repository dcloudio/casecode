<template>
	<text class="underline" @click="navigator" :style="{color}">{{text}}</text>
</template>

<script>
	export default {
		methods:{
			navigator(){
				uni.navigateTo({
					url:"/pages/webview/webview?url="+this.url
				})
			}
		},
		props: {
			url: {
				type: String,
				default(){
					return ''
				}
			},
			text: {
				type: String,
				default(){
					return ''
				}
			},
			color: {
				type: String,
				default(){
					return '#586b95'
				}
			},
		},
	}
</script>

<style>
.underline{
	text-decoration: underline;
}
</style>
