<template>
	<view class="uni-menu-item"
		:class="{
			'is-active':active,
			'is-disabled':disabled
		}"
		:style="{
			paddingLeft:paddingLeft,
			'background-color':active?activeBackgroundColor:''
		}"
	 @click="onClickItem">
		<slot></slot>
	</view>
</template>

<script>
	import rootParent from '../uni-nav-menu/mixins/rootParent.js'
	export default {
		name: 'uniMenuItem',
		mixins: [rootParent],
		props: {
			// 唯一标识
			index: {
				type: [String,Object],
				default(){
					return ''
				}
			},
			// TODO 是否禁用
			disabled: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				active: false,
				activeTextColor: '#42B983',
				textColor: '#303133',
				activeBackgroundColor: ''
			};
		},
		computed: {
			paddingLeft() {
				let subMenu = this.rootMenu && this.rootMenu.SubMenu && this.rootMenu.SubMenu.length || 0;
				return 20 + 20 * subMenu + 'px'
			}
		},
		created() {
			this.init()
		},
		destroyed() {
			if (this.$menuParent) {
				const menuIndex = this.$menuParent.itemChildrens.findIndex(item => item === this)
				this.$menuParent.itemChildrens.splice(menuIndex, 1)
			}
		},
		methods: {
			init() {
				this.rootMenu = {
					NavMenu: [],
					SubMenu: []
				}
				this.indexPath = []
				// 获取直系的所有父元素实例
				this.getParentAll('SubMenu', this)
				// 获取最外层父元素实例
				this.$menuParent = this.getParent('uniNavMenu', this)
				this.$subMenu = this.rootMenu.SubMenu

				this.activeTextColor = this.$menuParent.activeTextColor
				this.textColor = this.$menuParent.textColor
				this.activeBackgroundColor = this.$menuParent.activeBackgroundColor

				// 将当前插入到menu数组中
				if (this.$menuParent) {
					this.$menuParent.itemChildrens.push(this)
					this.$menuParent.isActive(this)
				}
			},

			// 点击 menuItem
			onClickItem(e) {
				if (this.disabled) return
				// 关闭其他已经选中的 itemMenu
				this.$menuParent.closeOtherActive(this)
				this.active = true
				this.indexPath.unshift(this.index)
				this.indexPath.reverse()
				if(e !== 'init'){
					// this.$menuParent.activeIndex=this.index
					this.$menuParent.select(this.index, this.indexPath)
				}
			}

		}
	}
</script>

<style lang="scss">
	.uni-menu-item {
		display: flex;
		align-items: center;
		padding: 0 20px;
		height: 56px;
		line-height: 56px;
		color: #303133;
		transition: all 0.3s;
		cursor: pointer;
		// border-bottom: 1px #f5f5f5 solid;
	}

	.uni-menu-item:hover {
		outline: none;
		background-color: #EBEBEB;
		transition: all 0.3s;
	}

	.is-active {
		color: $uni-color-primary;
		// background-color: #ecf8f3;
	}

	.is-disabled {
		// background-color: #f5f5f5;
		color: #999;
	}

	.uni-menu-item.is-disabled:hover {
		background-color: inherit;
		color: #999;
		cursor: not-allowed;
	}
</style>
