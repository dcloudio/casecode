<template>
	<view class="page">
		<view class="top-view">
			<uniNoticeBar showIcon="true" iconType="info" text="管理员(admin)拥有任何权限,权限控制对其无效。"></uniNoticeBar>
			<uni-segmented-control @clickItem="typeIndex = $event.currentIndex" :current="typeIndex" :values="types.map(({text})=>text)"></uni-segmented-control>
		</view>
		<alertCode ref="alertCode"></alertCode>
		<template v-for="(item,index) in permissionList">
			<view class="item" v-if="item.exclude !== type">
				<view class="msg">{{item.msg}}</view>
				<text style="color: #999999;">schema路径：uniCloud/database/permission-test-{{index+8}}.schema.json\n</text>
				<view class="code">
					配置规则：
					<scroll-view scroll-x class="code-box">
						<show-code :codes="item.codes[type]"></show-code>
					</scroll-view>
					<text>含义解释：{{item.explain}}</text>
					<text>【{{types[typeIndex].text}}】</text>
					<text>{{item.explain_end}}</text>
				</view>
				<template v-if="index===0&&type!='create'">
					<button type="primary" size="mini" @click="myFn({type:'create',index})">创建数据</button>
					<button type="primary" size="mini" @click="myFn({type:'read',index,where:'create_time > '+(Date.now()-60000)})">{{typeText}}一分钟内的数据</button>
				</template>
				<button type="primary" size="mini" plain @click="myFn({type,index})">
					{{types[typeIndex].text}}
					<text v-if="type!='create'">表全部数据</text>
					<text v-else>一条记录</text>
				</button>
				<template v-if="index===1">
					<button type="primary" size="mini" @click="myFn({type,index,action:'add_view_count'})">带action{{types[typeIndex].text}}</button>
				</template>
			</view>
		</template>
		<set-permission @change="changePermission"></set-permission>
	</view>
</template>

<script>
	const db = uniCloud.database()
	import alertCode from '@/components/alertCode/alertCode.vue';
	import uniNoticeBar from '@/uni_modules/uni-notice-bar/components/uni-notice-bar/uni-notice-bar.vue'
	export default {
		components: {
			uniNoticeBar,alertCode
		},
		computed: {
			type() {
				return this.types[this.typeIndex].value
			},
			typeText() {
				return this.types[this.typeIndex].text
			}
		},
		created() {
			for (var j = 0; j < this.types.length; j++) {
				let type = this.types[j].value
				console.log(type);
				for (let i = 0; i < this.permissionList.length; i++) {
					let jsonString = `{
							"permission":{
								"${type}":"${this.permissionList[i].code}"
							}
					}`
					if(!this.permissionList[i].codes) this.permissionList[i].codes = {}
					this.permissionList[i].codes[type] = JSON.parse(jsonString)
				}
			}
			console.log(this.permissionList);
		},
		data() {
			return {
				currentRole:0,
				types:[
					{
						text:"创建",
						value:"create"
					},
					{
						text:"读取",
						value:"read"
					},
					{
						text:"更新",
						value:"update"
					},
					{
						text:"删除",
						value:"delete"
					}
				],
				typeIndex:0,
				permissionList: [
					{
						"msg": "交集表达式",
						"code": "doc.create_time > (now - 60000) && 'AUDITOR' in auth.role",
						"explain": "限1分钟内的数据，“且”角色必须为审核员",
						"exclude":"create"
					},
					{
						"msg": "并集表达式",
						"code": "auth.uid != null || 'add_view_count' in action",
						"explain": "限非未登陆的游客，“或”带action",
						"tableName":"permission-test-9"
					}
				]
			}
		},
		mounted() {
			uni.setStorageSync('uni_id_token', '')
			uni.setStorageSync('uni_id_token_expired', '')
		},
		methods: {
			async myFn(e) { // {type:'',tableName:'',index,action:'',where:{}}
				console.log('myFun' + JSON.stringify(e));
				e.where = e.where || {}
				let item = this.permissionList[e.index]
				let tableName = item.tableName || 'permission-test-' + (e.index + 8)
				uni.showLoading({
					mask: true
				});
			
				console.log(
					'表名称：' + tableName +
					'\n 条件：' + JSON.stringify(e.where)
				);
			
				let res;
				try {
					switch (e.type) {
						case 'read':
							res = await db.action(e.action).collection(tableName).where(e.where).get()
							if(res.result.data.length == 0){
								uni.showModal({
									title: "数据为空，请先点击创建数据",
									showCancel: false
								});
								return false
							}
							break;
						case 'create':
							res = await db.action(e.action).collection(tableName).add({
								"text": "默认写入的数据" + Date.now()
							})
							break;
						case 'update':
							res = await db.action(e.action).collection(tableName).where(e.where).update({
								"text": "更新后的数据" + Date.now()
							})
							break;
						case 'delete':
							res = await db.action(e.action).collection(tableName).where(e.where).remove()
							break;
						default:
							console.log('err 未定义事件类型');
							break;
					}
					console.log("res: ",res);
					this.$refs.alertCode.open(res.result)
				} catch (err) {
					console.log('TODO handle the exception', err);
					uni.showModal({
						title: '错误:' + err.message+','+ err.code,
						content: item.explain +'【'+ this.typeText+'数据】' + (item.explain_end?item.explain_end:''),
						showCancel: false
					});
				} finally{
					uni.hideLoading()
				}
			},
			changePermission(e) {
				console.log(e, '切换完成');
				console.log("this.typeIndex: ",this.typeIndex);
				this.currentRole = e.role
			}
		}
	}
</script>

<style scoped>
	.top-view{
		background-color: #FFFFFF;
		position: sticky;
		top: 0;
	/* #ifdef H5 */
		top: 44px;
	/* #endif */
		left: 0;
		z-index: 999;
	}
	.top-view .segmented-control{
		padding: 0 20rpx;
	}
	.item {
		padding:20rpx 20rpx 0 20rpx;
		border-bottom: dashed 1px #E9E9EB;
	}
	.msg{
		font-weight: 500;
		font-size: 16px;
	}
	.msg::before{
		content:'·';
		width: 10px;
		height: 10px;
		line-height: 14px;
		top: 5px;
		position: relative;
		font-size: 30px;
	}
	.code-box {
		background-color: #fffae7;
		padding: 5px 15px;
		width: 650rpx;
	}

	.code-box text {
		font-size: 16px !important;
		color: #2b8300 !important;
	}

	.code-box .light {
		color: #0077cc !important;
	}

	.code-box .light2 {
		color: #009891 !important;
	}

	.navigator {
		padding: 16rpx;
		color: #586b95;
	}

	.page {
		padding-bottom: 100px;
		background-color: #FFFFFF;
		font-size: 14px;
	}
	
	button{
		margin: 8rpx 16rpx;
	}
</style>
