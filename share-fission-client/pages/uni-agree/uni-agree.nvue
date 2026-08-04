<template>
    <view class="page">
        <view>
            <text class="title">个人信息保护指引</text>
        </view>
        <view class="text-item">
            <text class="tl">1.在浏览使用时，我们会收集、使用设备标识信息用于推荐。</text>
        </view>
        <view class="text-item">
            <text class="tl">2.我们可能会申请位置权限，用于演示 uni-app 的地图、定位能力。</text>
        </view>
        <view class="text-item">
            <text class="tl">3.你可以查看完整版</text>
        </view>
        <view class="text-item flex-r">
            <text class="tl hl" @click="openprotocol">《用户协议》</text>
            <text class="tl"> 和 </text>
            <text class="tl hl" @click="openPrivacyPolicy">《隐私政策》</text>
        </view>
        <view class="text-item">
            <text class="tl">以便了解我们收集、使用、共享、存储信息的情况，以及对信息的保护措施。</text>
        </view>
        <view class="text-item">
            <text class="service">如果你同意请点击下面的按钮以接受我们的服务</text>
        </view>
        <view class="text-item confirm">
            <button class="btn-privacy" type="primary" @click="agree">同意</button>
			<button class="btn-privacy btn-disagree" @click="disagree">暂不使用</button>
        </view>
        <view class="exit-area">
            
        </view>
    </view>
</template>

<script>
import config from '@/uni-starter.config.js';
const { about } = config
    export default {
        data() {
            return {
            }
        },
        onLoad() {
            this._canBack = false;
        },
        onBackPress() {
            return !this._canBack;
        },
        methods: {
            openprotocol(e) {
                uni.navigateTo({
                    url: "/uni_modules/uni-id-pages/pages/common/webview/webview?url="+about.agreements[0].url
                })
            },
				openPrivacyPolicy(e) {
					 uni.navigateTo({
						  url: "/uni_modules/uni-id-pages/pages/common/webview/webview?url="+about.agreements[1].url
					 })
				},
            agree(e) {
                var saveStatus = uni.setStorageSync("userprotocol", 1);
                this._canBack = true;
                setTimeout(() => {
                    uni.navigateBack({
                        animationDuration: 0
                    });
                }, 100)
            },
            disagree() {
					// #ifdef APP-PLUS
					plus.runtime.quit();
					// #endif
					// #ifdef H5
					uni.showModal({
						content: '确定退出本应用？',
						cancelText:"退出",
						confirmText:"取消",
						success: (e) => {
							if(!e.confirm){
								window.location.href="about:blank";
								window.close();
							}
						}
					});
					// #endif
            }
        }
    }
</script>

<style>
    .page {
        padding: 80px 30px;
    }

    .title {
        font-size: 18px;
        line-height: 30px;
        margin-bottom: 20px;
    }

    .flex-r {
        flex-direction: row;
        flex-wrap: wrap;
    }

    .text-item {
        margin-bottom: 5px;
    }

    .tl {
        font-size: 14px;
        line-height: 20px;
    }

    .hl {
        color: #007AFF;
    }

    .service {
        font-size: 16px;
        line-height: 20px;
        margin-top: 20px;
    }

    .confirm {
        margin-top: 50px;
		flex-direction: row;
    }

    .btn-privacy {
       flex: 1;
    }

    .btn-disagree {
        margin-left: 20px;
    }
</style>