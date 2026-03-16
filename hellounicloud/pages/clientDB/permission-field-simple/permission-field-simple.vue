<template>
	<view class="page">
		<view class="top-view">
			<uniNoticeBar showIcon="true" iconType="info" text="管理员(admin)拥有任何权限,权限控制对其无效。"></uniNoticeBar>
			<uni-segmented-control @clickItem="typeIndex = $event.currentIndex" :values="types.map(({text})=>text)"></uni-segmented-control>
		</view>
		<alertCode ref="alertCode"></alertCode>
		<template v-for="(item,index) in permissionList">
			<view class="item"  v-if="item.exclude !== type">
				<view class="msg">{{item.msg}}</view>
				<text style="color: #999999;">schema路径：uniCloud/database/permission-test-{{index+10}}.schema.json\n</text>
				<view class="code">
					配置规则
					<scroll-view scroll-x class="code-box">
						<show-code :codes="item.codes[type]"></show-code>
					</scroll-view>
					<text>含义解释：{{item.explain}}</text>
					<text>【{{typeText}}】</text>
					<text>{{item.explain_end}}</text>
				</view>
			
				<button type="primary" size="mini" plain @click="myFn({type,index})">
					{{typeText}}
					<text v-if="type!='create'">记录全部字段</text>
					<text v-else>一条记录</text>
				</button>
				<template v-if="[0,1,2].includes(index)">
					<button type="primary" size="mini" @click="myFn({type,index,field:'_id,state,create_time,text'})">{{typeText}}不含字段{{item.field}}的记录</button>
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
		data() {
			return {
				currentRole:0,
				types: [{
						text: "创建",
						value: "create"
					},
					{
						text: "读取",
						value: "read"
					},
					{
						text: "更新",
						value: "update"
					},
					/* {
						text: "删除",
						value: "delete"
					} */
				],
				typeIndex: 0,
				permissionList: [
					{
						"msg": "直接禁止",
						"field":"ip",
						"code": false,
						"explain": "禁止任何角色",
						"explain_end": "含字段ip的记录，管理员角色除外"
					},
					{
						"msg": "需要登陆",
						"field":"ip",
						"code": "auth.uid != null",
						"explain": "禁止未登陆的游客",
						"explain_end": "含字段ip的记录"
					},
					{
						"msg": "指定角色",
						"field":"ip",
						"code": "'AUDITOR' in auth.role",
						"explain": "限角色为审核",
						"explain_end": "含字段【ip】的记录"
					}
				]
			}
		},
		created() {
			for (var j = 0; j < this.types.length; j++) {
				let type = this.types[j].value
				console.log(type);
				for (let i = 0; i < this.permissionList.length; i++) {
					let jsonString = `{
							"properties":{
								"${this.permissionList[i].field}":{
									"permission":{
										"${type}":"${this.permissionList[i].code}"
									}
								}
							}
					}`
					if(!this.permissionList[i].codes) this.permissionList[i].codes = {}
					this.permissionList[i].codes[type] = JSON.parse(jsonString)
				}
			}
			console.log(this.permissionList);
		},
		mounted() {
			uni.setStorageSync('uni_id_token', '')
			uni.setStorageSync('uni_id_token_expired', '')
		},
		methods: {
			async myFn(e) { // {type:'',tableName:'',index,action:'',where:{}}
				console.log('myFun' + JSON.stringify(e));
				e.where = e.where || {}
				e.field = e.field || '_id,state,create_time,text,ip'
				let item = this.permissionList[e.index]
				let tableName = item.tableName || 'permission-test-' + (e.index + 10)
				uni.showLoading({
					mask: true
				});
				
				let hasIp = {}
				if(e.field.indexOf('ip') != -1){
					hasIp = {"ip":"虚拟ip"+Date.now()};
				}

				console.log(
					'表名称：' + tableName +
					',操作：' + this.typeText +
					'\n 条件：' + JSON.stringify(e.where),
					'\n field:'+ e.field,
					'\n data:'+ JSON.stringify({
									"text": "数据" + Date.now(),
									...hasIp
								}),
				);

				let res;
				try {
					switch (e.type) {
						case 'read':
							res = await db.action(e.action).collection(tableName).where(e.where).field(e.field).get()
							break;
						case 'create':
							res = await db.action(e.action).collection(tableName)
								.add({
									"text": "默认写入的数据" + Date.now(),
									...hasIp
								})
							break;
						case 'update':
							res = await db.action(e.action).collection(tableName).where(e.where)
								.update({
									"text": "更新后的数据" + Date.now(),
									...hasIp
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
						content: item.explain +'【'+ this.typeText+'字段'+item.field+'】' + (item.explain_end?item.explain_end:''),
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
	.top-view {
		background-color: #FFFFFF;
		position: sticky;
		top: 0;
		/* #ifdef H5 */
		top: 44px;
		/* #endif */
		left: 0;
		z-index: 999;
	}
	.top-view .segmented-control {
		padding: 0 20rpx;
	}
	.item {
		padding: 20rpx 20rpx 0 20rpx;
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
		padding: 5px 30rpx;
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

	button {
		margin: 8rpx 16rpx;
	}
	
	
</style>
