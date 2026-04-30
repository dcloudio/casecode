<template>
	<view @appear="appear">
		<view v-if="state.error">
			<view class="box" v-if="networkType == 'none'">
				<image class="icon-image" src="@/static/uni-load-state/disconnection.png" mode="widthFix"></image>
				<text class="tip-text">{{noNetwork}}</text>
				<view class="btn btn-default" @click="openSettings">
					<text class="btn-text">{{toSet}}</text>
				</view>
			</view>
			<text class="error" v-else>{{error}}：{{JSON.stringify(state.error)}}</text>
		</view>
		<template v-else>
			<uni-load-more class="uni-load-more" :status="state.loading?'loading':(state.hasMore?'hasMore':'noMore')"></uni-load-more>
		</template>
		
	</view>
</template>

<script>
	import {
		initVueI18n
	} from '@dcloudio/uni-i18n'
	import messages from './i18n/index.js'
	const {
		t
	} = initVueI18n(messages)

	export default {
		name: "uni-load-state",
		computed: {
			noData() {
				return t('noData')
			},
			noNetwork() {
				return t('noNetwork')
			},
			toSet() {
				return t('toSet')
			},
			error() {
				return t('error')
			}
		},
		data() {
			return {
				"networkType": ""
			};
		},
		props: {
			state: {
				type: Object,
				default () {
					return {
						"loading": true,
						"hasMore": false,
						"pagination": {
							"pages": 0
						},
						"data": [],
						"error": {}
					}
				}
			}
		},
		mounted() {
			uni.onNetworkStatusChange(({
				networkType
			}) => {
				if (this.networkType == 'none' && networkType != 'none') { //之前没网现在有了
					this.$emit('networkResume')
				}
				this.networkType = networkType;
			});
			uni.getNetworkType({
				success: ({
					networkType
				}) => {
					this.networkType = networkType;
				}
			});
		},
		methods: {
			appear() {
				if (!this.state.loading && this.state.hasMore) {
					this.$emit('loadMore')
				}
			},
			openSettings() {
				if (uni.getSystemInfoSync().platform == "ios") {
					var UIApplication = plus.ios.import("UIApplication");
					var application2 = UIApplication.sharedApplication();
					var NSURL2 = plus.ios.import("NSURL");
					var setting2 = NSURL2.URLWithString("App-prefs:root=General");
					application2.openURL(setting2);
					plus.ios.deleteObject(setting2);
					plus.ios.deleteObject(NSURL2);
					plus.ios.deleteObject(application2);
				} else {
					var Intent = plus.android.importClass("android.content.Intent");
					var Settings = plus.android.importClass("android.provider.Settings");
					var mainActivity = plus.android.runtimeMainActivity();
					var intent = new Intent(Settings.ACTION_SETTINGS);
					mainActivity.startActivity(intent);
				}
			}
		}
	}
</script>

<style scoped>
	.box {
		flex: 1;
		width: 700rpx;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.uni-load-more{
		align-items: center;
		justify-content: center;
	}
	.state-text {
		text-align: center;
		font-size: 26rpx;
		width: 690rpx;
		padding: 10rpx;
		color: #999999;
	}

	.icon-image {
		width: 300rpx;
	}

	.tip-text {
		color: #999999;
		font-size: 32rpx;
		margin-bottom: 30rpx;
	}

	.btn {
		padding: 5px 10px;
		width: 128px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.btn-text {
		color: #999999;
		font-size: 15px;
	}

	.btn-default {
		border-color: #999999;
		border-style: solid;
		border-width: 1px;
		border-radius: 3px;
	}

	.error {
		width: 690rpx;
		color: #DD524D;
	}
</style>
