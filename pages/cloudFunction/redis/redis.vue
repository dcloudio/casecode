<template>
<view>
	<scroll-view scroll-y class="pages">
		<uni-section title="存储字符串数据" type="line"></uni-section>
		<view class="form">
			<view class="item">
				<view class="title">key</view>
				<input type="text" placeholder="请输入key的值" v-model="formData.key" />
			</view>
			<view class="item">
				<view class="title">value</view>
				<input type="text" placeholder="请输入value的值" v-model="formData.value" />
			</view>
		</view>
		<button @click="cf('set')" class="btn-box" type="primary">存储</button>
		<button @click="cf('get')" class="btn-box" type="primary">读取</button>
		<button @click="cf('del')" class="btn-box" type="primary">删除</button>
	
		<uni-section title="批量操作" subTitle="用,号隔开多个值" type="line"></uni-section>
		<view class="item">
			<view class="title">keys</view>
			<input type="text" placeholder="多个健用逗号隔开,如:a,b,c" v-model="formData.keys" />
		</view>
		<button @click="cf('mget')" class="btn-box" type="primary">读取多个健的值</button>
		<view class="item">
			<view class="title">msetData</view>
			<input type="text" placeholder="键、值的列表,如:key1,1,key2,2" v-model="formData.msetData" />
		</view>
		<button @click="cf('mset')" class="btn-box" type="primary">批量设置键值</button>
	</scroll-view>
	<alertCode ref="alertCode"></alertCode>
</view>
</template>

<script>
	export default {
		data() {
			return {
				formData: {
					key: "",
					value: "",
					keys:"",
					msetData:""
				}
			}
		},
		methods: {
			radioChange(e){
				console.log(e.target.value);
			},
			cf(action){
				console.log(action);
				if(!['mget','mset'].includes(action)){
					if(!this.formData.key){
						return uni.showToast({
							title: 'key不能为空',
							icon:'none'
						});
					}
				}
				
				if(action=='set'&&!this.formData.value){
					return uni.showToast({
						title: 'value不能为空',
						icon:'none'
					});
				}
				
				if(action=='mget'&&!this.formData.keys){
					return uni.showToast({
						title: 'keys不能为空',
						icon:'none'
					});
				}
				
				if(action=='mset'&&!this.formData.msetData){
					return uni.showToast({
						title: 'msetData不能为空',
						icon:'none'
					});
				}
				
				uniCloud.callFunction({
					name:'redis-test',
					data:{
						action,
						data:this.formData
					},
					complete: (e) => {
						console.log(e);
						this.$refs.alertCode.open(e)
					}
				})
			}
		}
	}
</script>

<style>
view{
	display: flex;
}
.pages{
	flex-direction: column;
	background-color: #eeeeee;
	height: 100vh;
}
.form{
	flex-direction: column;
}
.item{
	justify-content: space-between;
	align-items: center;
	flex-direction: row;
	background-color: #FFFFFF;
	padding: 10px 12px;
}
.item .title{
	color: #555555;
	width: 80px;
}
.item input{
	width: 600rpx;
	padding: 5px;
	border-bottom: solid 1px #edeaf0;
	margin-right: 10px;
	font-size: 12px;
}
.btn-box{
	width: 650rpx;
	margin:16rpx auto;
}
radio{
	margin: 0 10rpx;
}
</style>
