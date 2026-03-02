<template>
	<view>
		<embed
			tag="appharmonygetphonenumber"
			:options="options"
			@clickprivacytext="onClickPrivacyText"
			@getphonenumber="onGetPhoneNumber"
			@ready="onReady"
			@close="onClose"
			@error="onError"
		></embed>
		<view @click="showGetPhoneNumberPanel">
			<slot></slot>
		</view>
	</view>
</template>

<script>
	import "@/uni_modules/uni-get-phone-number"
	import config from "@/uni_modules/uni-id-pages/config"

	const privacyConfig = ['用户服务协议', '隐私政策条款']

	export default {
		emits: ['getphonenumber', 'error'],
		data () {
			return {
				ready: false,
				options: {
					show: false,
					privacyConfig
				}
			}
		},
		methods: {
			showGetPhoneNumberPanel () {
				if (this.options.show) return

				!this.ready && uni.showLoading({
					title: '加载中...'
				})

				this.options = {
					...this.options,
					show: true
				}
			},
			onGetPhoneNumber (e) {
				console.log('getphonenumber', e.detail)
				this.$emit('getphonenumber', e)
			},
			onClickPrivacyText(e) {
				const {tag} = e.detail
				let url = ''
				switch (tag) {
					case '用户服务协议':
						url = config.agreements.privacyUrl
						break
					case '隐私政策条款':
						url = config.agreements.serviceUrl
						break
					case '华为账号用户认证协议':
						url = config.agreements.huaweiConsumerPrivacyUrl
						break
				}

				if (!url) {
					return uni.showToast({
						title: `${tag}未配置协议地址`,
						icon: 'none'
					})
				}

				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/common/webview/webview?url=' + encodeURIComponent(url) + '&title=' + tag
				});
			},
			onReady () {
				this.ready = true
				uni.hideLoading()
			},
			onClose() {
				this.options = {
					...this.options,
					show: false,
				}
				uni.hideLoading()
			},
			onError (e) {
				this.options = {
					...this.options,
					show: false,
				}
				uni.hideLoading()

				this.$emit('error', e.detail)
			},
		}
	}

</script>

