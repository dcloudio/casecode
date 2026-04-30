<template>
	<view class="fix-window">
		<top-window class="fix-window-top" />
		<view class="fix-window-button" @click="tiggerWindow"></view>
		<view v-show="visible" class="fix-window--mask" @click="tiggerWindow"></view>
		<left-window v-show="visible" class="fix-window--popup" />
	</view>
</template>

<script>
	import topWindow from '../../windows/topWindow.vue'
	import leftWindow from '../../windows/leftWindow.vue'
	export default {
		components: {
			topWindow,
			leftWindow
		},
		data() {
			return {
				visible: false
			};
		},
		methods: {
			tiggerWindow() {
				this.visible = !this.visible
			}
		}
	}
</script>

<style>
	.fix-window-button {
		width: 30px;
		height: 30px;
		opacity: 0.5;
		position: fixed;
		top: 40px;
		left: 20px;
		z-index: 999;
	}

	.fix-window-top {
		width: 100%;
		position: fixed;
		top: 25px;
		left: 0;
		z-index: 999;
	}

	.fix-window--mask {
		position: fixed;
		bottom: 0px;
		top: 25px;
		left: 0px;
		right: 0px;
		background-color: rgba(0, 0, 0, 0.4);
		transition-duration: 0.3s;
		z-index: 997;
	}

	.fix-window--popup {
		position: fixed;
		top: 85px;
		left: 0;
		/* transform: translate(-50%, -50%); */
		transition-duration: 0.3s;
		z-index: 998;
	}
</style>
