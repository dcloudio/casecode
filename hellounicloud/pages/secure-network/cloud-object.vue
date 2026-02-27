<template>
	<view class="container">
		<view class="title">请求数据</view>
		<input class="input" v-model="inputValue" />

		<view class="group">
			<view class="secret-type">
				secretType: "both"
			</view>
			<view class="secret-type-comment">
				客户端和服务器上行下行数据都加密数据
			</view>
			<button type="primary" @click="getBySecretType('both')">get</button>
		</view>

		<view class="group">
			<view class="secret-type">
				secretType: "request"
			</view>
			<view class="secret-type-comment">
				只加密客户端请求时的上行数据，服务器下发数据不加密
			</view>
			<button type="primary" @click="getBySecretType('request')">get</button>
		</view>

		<view class="group">
			<view class="secret-type">
				secretType: "response"
			</view>
			<view class="secret-type-comment">
				客户端请求时不加密数据，只加密服务器下发的数据
			</view>
			<button type="primary" @click="getBySecretType('response')">get</button>
		</view>

		<view class="tips">
			提示:
			<view class="tips-item">
				当前请求的云对象强制校验 secretType: "both"，返回值为请求的数据
			</view>
			<view class="tips-item">
				不管是客户端接收云端数据、还是云端接受客户端数据，开发者的代码拿到的数据永远都是解密后的数据
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				inputValue: 'uniCloud-secure-network'
			}
		},
		methods: {
			getBySecretType(secretType) {
				uni.showLoading({
					title: '处理中...'
				})
				const secureNetworkObject = uniCloud.importObject('secure-network-object', {
					secretMethods: {
						'get': secretType
					}
				});
				secureNetworkObject.get(this.inputValue).then((res) => {
					uni.hideLoading()
					uni.showModal({
						content: JSON.stringify(res),
						showCancel: false
					})
				}).catch((err) => {
					uni.hideLoading()
					console.error(err)
				})
			}
		}
	}
</script>

<style>
	@import url("css.css");
</style>
