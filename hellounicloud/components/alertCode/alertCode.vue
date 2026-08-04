<template>
	<!-- #ifdef MP -->
	<view class="box isShow" @click="closeMe" v-if="isShow">
		<!-- #endif -->
		<!-- #ifndef MP -->
		<view class="box" @click="closeMe" :class="{isShow:isShow}">
			<!-- #endif -->
			<!-- 小程序存在动画切换的bug本版本先用 v-if="isShow" 处理 -->
			<scroll-view scroll-x scroll-y @click.stop="tapCode" class="scroll-view" style="overflow: auto;">
				<show-code :codes="codes"></show-code>
			</scroll-view>
		</view>
</template>
<script>
	function getType(val) {
		return Object.prototype.toString.call(val).slice(8, -1).toLowerCase()
	}

	function purifyCodes(codes) {
		codes = JSON.parse(JSON.stringify(codes))
		const codesType = getType(codes)
		switch (codesType) {
			case 'object':
				if ('affectedDocs' in codes) {
					delete codes.affectedDocs
				}
				for (let key in codes) {
					codes[key] = purifyCodes(codes[key])
				}
				break;
			case 'array':
				for (let i = 0; i < codes.length; i++) {
					codes[i] = purifyCodes(codes[i])
				}
				break;
			default:
				return codes
		}
		return codes
	}
	export default {
		data() {
			return {
				codes: {},
				isShow: false
			}
		},
		methods: {
			open(codes) {
        if('errCode' in codes){
          // 为过滤警告，不在弹出请求返回的code message
          try{
            delete codes.code
            delete codes.message
            delete codes.affectedDocs
          }catch(e){
            // console.log(e);
          }
        }
				this.codes = purifyCodes(codes)
				this.isShow = true
			},
			tapCode(e) {
				console.log(e);
				e.stopPropagation()
			},
			closeMe(e) {
				this.isShow = false
			}
		}
	}
</script>
<style scoped>
	.box {
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.2);
		position: fixed;
		top: 0;
		left: 100vw;
		z-index: 999;
		opacity: 0;
		transition: opacity 0.3s;
		justify-content: center;
		align-items: center;
		display: flex;
	}

	.scroll-view {
		background-color: #FFFAE7;
		padding: 14px 18rpx;
		width: 610rpx;
		max-height: 60vh;
	}

	.isShow {
		opacity: 1;
		left: 0;
	}
</style>
