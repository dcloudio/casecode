<template>
	<view style="position: relative;">
		<uni-icons @mouseenter.native="mouseenter" @mouseleave.native="showStableInfo = false"
			style="padding:0 10px;color: #a8a8a8;cursor: pointer;" type="info" />
		<view v-if="showStableInfo" class="show-stable" :style="{top:`${top}px`,left:`${left}px`}">
			<text>{{content}}</text>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			content: String,
			top: {
				type: [Number, String],
				default: -60
			},
			left: {
				type: [Number, String],
				default: -100
			}
		},
		data() {
			return {
				showStableInfo: false,
				arrowStyle: {}
			}
		},
		methods: {
			mouseenter(e) {
				this.showStableInfo = true
			}
		}
	}
</script>

<style lang="scss" scoped>
	$main_color: #fff;
	$main_back_color: #303133;

	.show-stable {
		width: 200px;
		position: absolute;
		padding: 5px 10px;
		background-color: $main_back_color;
		color: $main_color;
		border-radius: 4px;
		border: 1px solid #e9e9eb;
		z-index: 99999;
	}
</style>
