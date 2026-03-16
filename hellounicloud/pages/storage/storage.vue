<template>
	<view class="content">
		<view class="btn-list">
			<button type="primary" plain @click="pageTo('/pages/storage/space-storage')">空间内置云存储</button>
			<text class="tips">演示空间自带的云储存</text>
			<button type="primary" plain @click="pageTo('/pages/storage/ext-storage-qiniu')">扩展存储-七牛云</button>
			<text class="tips">演示扩展存储-七牛云</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {}
		},
		mounted() {},
		methods: {
			pageTo(url){
				uni.navigateTo({
					url
				});
			}
		}
	}
</script>

<style>
	.content {
		padding-bottom: 30px;
	}

	.tips {
		color: #999999;
		font-size: 14px;
		padding: 20px 30px;
	}

	.btn-list {
		padding: 0px 30px;
	}

	.btn-list button {
		margin-top: 20px;
	}

</style>
