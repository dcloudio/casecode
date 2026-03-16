<template>
	<view class="content">
		<view class="title">基础示例-云对象</view>
		<template v-if="canUse">
			<view class="tips">
				<view>1.在uniCloud目录右键"云服务空间初始化向导..."</view>
				<view>2.没有服务空间，就点击新建创建一个</view>
				<view>3.选择要绑定的服务空间</view>
				<view>4.点击下一步，再点击开始部署</view>
			</view>
			<view class="btn-list">
				<button type="primary" @click="add">新增一条数据</button>
				<button type="primary" @click="remove">删除一条数据</button>
				<button type="primary" @click="update">修改数据</button>
				<button type="primary" @click="get">查询前10条数据</button>
				<button type="primary" @click="useCommon">使用公用模块</button>

        <!-- #ifdef APP-PLUS || MP-WEIXIN -->
        <navigator url="../secure-network/cloud-object">
          <button type="primary">安全网络</button>
        </navigator>
        <!-- #endif -->
			</view>
		</template>
		<template v-else>
			<view id="tip">
				<text>您的HBuilderX版本低于3.4.0，请升级后体验</text>
			</view>
		</template>
	</view>
</template>

<script>
	//判断当前环境是否支持云对象。云对象详情：https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
	let canUse = true,cloudObjectDemo;
	if (uniCloud.importObject) {
		cloudObjectDemo = uniCloud.importObject('cloud-object-demo');
	} else {
		canUse = false
	}
	export default {
		data() {
			return {
				canUse
			}
		},
		methods: {
			add() {
				uni.showLoading({
					title: '处理中...'
				})
				cloudObjectDemo.add({
					product: 'uniCloud',
					create_time: Date.now()
				}).then((res) => {
					console.log(res)
					uni.hideLoading()
					uni.showModal({
						content: `成功添加一条数据，文档id为：${res.id}`,
						showCancel: false
					})
				}).catch((err) => {
					console.error(err)
					uni.hideLoading()
					uni.showModal({
						content: `添加数据失败，错误信息为：${err.message}`,
						showCancel: false
					})
				})
			},
			remove() {
				uni.showLoading({
					title: '处理中...'
				})
				cloudObjectDemo.remove().then((res) => {
					console.log(res)
					uni.hideLoading()
					uni.showModal({
						content: res.msg,
						showCancel: false
					})
				}).catch((err) => {
					uni.hideLoading()
					uni.showModal({
						content: `删除失败，错误信息为：${err.message}`,
						showCancel: false
					})
					console.error(err)
				})
			},
			update() {
				uni.showLoading({
					title: '处理中...'
				})
				cloudObjectDemo.update({
					product: 'uni-app',
					create_time: Date.now()
				}).then((res) => {
					uni.hideLoading()
					uni.showModal({
						content: res.msg,
						showCancel: false
					})
					console.log(res)
				}).catch((err) => {
					uni.hideLoading()
					uni.showModal({
						content: `更新操作执行失败，错误信息为：${err.message}`,
						showCancel: false
					})
					console.error(err)
				})
			},
			get() {
				uni.showLoading({
					title: '处理中...'
				})
				cloudObjectDemo.get().then((res) => {
					uni.hideLoading()
					uni.showModal({
						content: `查询成功，获取数据列表为：${JSON.stringify(res)}`,
						showCancel: false
					})
					console.log(res)
				}).catch((err) => {
					uni.hideLoading()
					uni.showModal({
						content: `查询失败，错误信息为：${err.message}`,
						showCancel: false
					})
					console.error(err)
				})
			},
			useCommon() {
				cloudObjectDemo.useCommon().then((res) => {
					uni.hideLoading()
					uni.showModal({
						content: '云对象使用公共模块返回结果：' + JSON.stringify(res),
						showCancel: false
					})
					console.log(res)
				}).catch((err) => {
					uni.hideLoading()
					uni.showModal({
						content: `云对象使用公共模块执行失败，错误信息为：${err.message}`,
						showCancel: false
					})
					console.error(err)
				})
			},
			toRedisPage() {
				uni.navigateTo({
					url: '/pages/cloudFunction/redis/redis'
				})
			}
		}
	}
</script>

<style>
	view {
		display: flex;
		flex-direction: column;
	}

	.content {
		padding-bottom: 30px;
	}

	.title {
		font-weight: bold;
		align-items: center;
		padding: 20px 0px;
		font-size: 20px;
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
		margin-bottom: 20px;
	}

	.upload-preview {
		width: 100%;
	}

	#tip {
		width: 750rpx;
		align-items: center;
	}
	button{
		width: 100%;
	}
</style>
