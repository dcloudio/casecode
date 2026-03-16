<template>
<view class="root">
	<view v-if="showGuide" class="guide"></view>
	<view class="box" :style="{width:170*roles.length+'rpx'}">
		<text class="roles-item" v-for="(item,index) in roles" :key="item.value"
			:class="{active:activeIndex==index}"
			@click="activeIndex=index"
			>{{item.text}}</text>
		<text class="active-box" :style="{'left':170*activeIndex+'rpx'}"></text>
		<image @click="showGuide=false" v-if="showGuide" class="guide-img" src="../../static/jian.png" mode="aspectFit"></image>
		<!-- <uni-data-checkbox style="margin: 20rpx;" v-model="role" :localdata="roles" /> -->
	</view>
</view>
</template>
<script>
	export default {
		data() {
			return {
				activeIndex:null,
				role: 0,
				roles: [{
						"value": 0,
						"text": "未登陆"
					},
					{
						"value": "user",
						"text": "用户"
					},
					{
						"value": "auditor",
						"text": "审核员"
					},
					{
						"value": "admin",
						"text": "管理员"
					}
				],
				showGuide:false
			};
		},
		watch: {
			async activeIndex(activeIndex, oldRole) {
				let role = this.roles[activeIndex].value;
				uni.showLoading({
					title: '切换账号类型中',
					mask: true
				});
				if (!activeIndex) {
					let res = await this.logout()
					console.log(res);
					uni.setStorageSync('role_index', activeIndex)
					uni.setStorageSync('uni_id_token', false)
					uni.setStorageSync('uni_id_uid', false)
					uni.setStorageSync('uni_id_token_expired',false)
					this.$emit('change',{role,index:activeIndex})
					uni.hideLoading()
					return false
				}
				uniCloud.callFunction({
					name: "user-center",
					data: {
						action: 'login',
						params: {
							username: role,
							password: "123456",
							needPermission: true
						}
					},
					complete: (res) => {
						uni.setStorageSync('role_index', activeIndex)
						uni.setStorageSync('uni_id_token', res.result.token)
						uni.setStorageSync('uni_id_uid', res.result.uid)
						uni.setStorageSync('uni_id_token_expired', res.result.tokenExpired)
						this.$emit('change',{role,index:activeIndex,uid:res.result.uid})
						uni.hideLoading()
					}
				})
			}
		},
		async beforeDestroy() {
			//uni.setStorageSync('uni_id_token', '')
			//uni.setStorageSync('uni_id_token_expired', '')
		},
		mounted() {
			this.activeIndex = uni.getStorageSync('role_index')||0;
		},
		methods: {
			async logout() {
				return await uniCloud.callFunction({
					name: 'user-center',
					data: {
						action: 'logout'
					}
				})
			},
			init(activeIndex){
				this.activeIndex = activeIndex;
			}
		},
	}
</script>
<style scoped>
	/* #ifndef APP-NVUE */
	view,text{
		display: flex;
	}
	/* #endif */
	.root{
		position: fixed;
		bottom: 20px;
		width: 750rpx;
		align-items: center;
		justify-content: center;
	}
	.box{
		position: relative;
		justify-content: space-between;
		background-color: #ffffff;
		flex-direction: row;
		flex-grow: 0;
		border-radius: 20px;
		height: 40px;
		align-items: center;
		box-shadow: 1px 1px 10px #aaa;
		z-index: 200;
		overflow: hidden;
	}
	.roles-item,.active-box{
		border-radius: 20px;
		height: 40px;
		line-height: 40px;
		color: #aaa;
		font-size: 16px;
		transition: color 0.5s;
		width: 170rpx;
		justify-content: center;
		z-index: 2;
	}
	.active{
		color: #FFFFFF;
	}
	.active-box{
		position: absolute;
		background-color: #007AFF;
		z-index: 1;
		transition: left 0.3s;
		font-size: 28rpx;
		border-radius: 0;
		height: 39.9px;
		line-height: 39.9px;
	}
	.guide{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		opacity: 0.7;
		background-color: #333333;
		z-index: 100;
	}
	.guide-img{
		position: fixed;
		width: 350rpx;
		height: 350rpx;
		bottom: 90px;
		left: 100rpx;
	}
</style>
