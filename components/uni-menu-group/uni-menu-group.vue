<template>
	<view class="uni-menu-group">
		<view class="uni-menu-group__title" name="title" :style="{paddingLeft:paddingLeft}">{{title}}</view>
		<slot></slot>
	</view>
</template>

<script>
	import rootParent from '../uni-nav-menu/mixins/rootParent.js'
	export default {
		name: 'uniMenuGroup',
		mixins:[rootParent],
		props: {
			title: String
		},
		data() {
			return {

			};
		},
		computed: {
			paddingLeft() {
				return 20+20 * this.rootMenu.SubMenu.length + 'px'
			}
		},
		created() {
			this.init()
		},
		methods: {
			init() {
				this.rootMenu = {
					SubMenu: []
				}
				this.getParentAll('SubMenu', this)
			}
		}
	}
</script>

<style>
.uni-menu-group {
	/* border: 1px red solid; */
}
.uni-menu-group__title {
	line-height: 36px;
	font-size: 12px;
	color: #999;
}
</style>
