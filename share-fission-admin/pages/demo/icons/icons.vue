<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<!-- 显示标题 -->
				<view class="uni-title">{{$t('demo.icons.title')}}（uni-icons）</view>
				<!-- 显示描述 -->
				<view class="uni-sub-title">{{$t('demo.icons.describle')}}</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="icons">
				<!-- 循环显示图标 -->
				<view v-for="(icon,index) in icons" :key="index" class="icon-item pointer">
					<view @click="setClipboardData('tag',icon)" :class="'uni-icons-'+icon"></view>
					<text @click="setClipboardData('class',icon)" class="icon-text">uni-icons-{{icon}}</text>
				</view>
			</view>
		</view>
		<!-- 在非H5环境下显示fix-window组件 -->
		<!-- #ifndef H5 -->
		<fix-window v-if="fixWindow" />
		<!-- #endif -->
	</view>
</template>

<script>
	// 导入名为 "icons" 的模块，路径为 './uni-icons.js'
	import icons from './uni-icons.js'

	// 导出默认模块
	export default {
		// 数据属性
		data() {
			return {
				// 数据属性：icons
				icons
			}
		},

		// 属性
		props:{
			// 属性：tag
			tag: {
				// 类型为布尔型
				type: Boolean,
				// 默认值为 true
				default: true
			},
			// 属性：fixWindow
			fixWindow: {
				// 类型为布尔型
				type: Boolean,
				// 默认值为 true
				default: true
			}
		},

		// 方法
		methods: {
			// 方法：setClipboardData，参数为 type 和 icon
			setClipboardData(type, icon) {
				// 定义变量 data，值为 'uni-icons-' 加上 icon 参数
				let data = 'uni-icons-' + icon

				// 如果 this.tag 为真且 type 等于 'tag'
				if (this.tag && type === 'tag') {
					// 将 data 的值修改为带有 class 属性的字符串
					data = '<view class="' + data + '"></view>'
					}

				// 调用 uni.setClipboardData 函数
				uni.setClipboardData({
					// 数据为变量 data 的值
					data,

					// 成功回调函数
					success(res) {
						// 调用 uni.showToast 函数
						uni.showToast({
							// 图标为 'none'
							icon: 'none',
							// 提示信息为 '复制 ' 加上 data 的值，再加上 ' 成功！'
							title: '复制 ' + data + ' 成功！'
						})
					},

					// 失败回调函数
					fail(res) {
						// 调用 uni.showModal 函数
						uni.showModal({
							// 弹窗内容为 '复制 ' 加上 data 的值，再加上 ' 失败！'
							content: '复制 ' + data + ' 失败！',
							// 不显示取消按钮
							showCancel: false
						})
					}
				})
			}
		}
	}
</script>


<style lang="scss">
	/* #ifndef H5 */
	page {
		padding-top: 85px;
	}
	/* #endif */
	.icons {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}

	.icon-item {
		display: flex;
		width: 16.6%;
		height: 120px;
		font-size: 30px;
		text-align: center;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}

	.icon-item:hover,
	.icon-item:hover .icon-text {
		color: $uni-color-primary;
	}

	.icon-text {
		color: #99a9bf;
		font-size: 12px;
		text-align: center;
		height: 1em;
		line-height: 1em;
		margin-top: 15px;
	}

	/* #ifdef H5 */
	@media only screen and (max-width: 500px) {
		.icon-item {
			width: 33.3%;
		}
	}
	/* #endif */
</style>
