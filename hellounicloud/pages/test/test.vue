<template>
	<view>
		<show-code :codes="schemaCode"></show-code>
		<!-- <alertCode ref="alertCode"></alertCode> -->
		<!-- <button @click="openFn()" type="default">alertCode</button> -->
		<!-- <view v-for="(value,key) in schemaCode">
			<text class="key">{{key}}:</text>
			<text class="value">{{value}}</text>
		</view> -->
	</view>
</template>

<script>
import schemaCode from './schemaCode.json';
	export default {
		data() {
			return {
				schemaCode:schemaCode
			}
		},
		methods: {
			openFn(){
				console.log(this.$refs.alertCode.open(this.schemaCode));
				//
			}
		}
	}
</script>

<style>
</style>
