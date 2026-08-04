<template>
	<view class="uni-breadcrumb-x">
		<uni-breadcrumb separator="/">
			<uni-breadcrumb-item v-for="(route, index) in routes" :key="index" :to="route.to && route.to.path||''">{{route.name}}</uni-breadcrumb-item>
		</uni-breadcrumb>
	</view>
</template>

<script>
	import {
		mapState
	} from 'vuex'

	export default {
		name: "uni-stat-breadcrumb",
		data() {
			return {

			};
		},
		computed: {
			...mapState('app', ['routes'])
		}
	}
</script>

<style>
	.uni-breadcrumb-x {
		flex: 1;
		display: flex;
		padding: 0 5px;
		min-height: 55px;
		line-height: 55px;
		align-items: center;
	}
</style>
