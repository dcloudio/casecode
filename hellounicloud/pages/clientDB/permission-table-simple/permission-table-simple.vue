<template>
	<view class="page">
		<view class="top-view">
			<uniNoticeBar showIcon="true" iconType="info" text="管理员(admin)拥有任何权限,权限控制对其无效。"></uniNoticeBar>
			<uni-segmented-control @clickItem="typeIndex = $event.currentIndex" :values="types.map(({text})=>text)"></uni-segmented-control>
		</view>
		<alertCode ref="alertCode"></alertCode>
		<template v-for="(item,index) in permissionList">
			<view class="item" v-if="item.exclude !== type" >
				<view class="msg">{{item.msg}}</view>
				<text style="color: #999999;">schema路径：uniCloud/database/permission-test-{{index+1}}.schema.json\n</text>
				<view class="code">
					配置规则：
					<scroll-view scroll-x class="code-box">
						<show-code :codes="item.codes[type]"></show-code>
					</scroll-view>
					<text>含义解释：{{item.explain}}</text>
					<text>【{{typeText}}】</text>
					<text>{{item.explain_end}}</text>
				</view>
			
				<template v-if="index==3&&type != 'add'">
					<button type="primary" size="mini" @click="myFn({type:'create',index})">先为测试需要,创建数据</button>
					<button type="primary" size="mini" plain @click="myFn({type,index,where:'uid == $env.uid'})">只{{typeText}}当前角色创建的数据</button>
				</template>
			
				<template v-if="index==4&&type != 'add'">
					<button type="primary" size="mini" @click="myFn({type:'create',index})">先为测试需要,创建数据</button>
					<button type="primary" size="mini" plain @click="myFn({type,index,where:'create_time > '+(Date.now()-60000)})">只{{typeText}}1分钟内创建的数据</button>
				</template>
			
				<button type="primary" size="mini" plain @click="myFn({type,index})">
					{{typeText}}
					<text v-if="type!='create'">表全部数据</text>
					<text v-else>一条记录</text>
				</button>
			
			
				<button type="primary" size="mini" v-if="index==6" @click="myFn({type,index,action:'add_view_count'})">
					带上action
					{{typeText}}
					<text v-if="type!='create'">表全部数据</text>
					<text v-else>一条记录</text>
				</button>
			</view>
		</template>
		<set-permission @change="changePermission"></set-permission>
	</view>
</template>

<script>
	const db = uniCloud.database()
	// import uniPopup from '@/components/uni-popup/uni-popup.vue'
	// import uniPopupMessage from '@/components/uni-popup/uni-popup-message.vue'
	// import uniPopupDialog from '@/components/uni-popup/uni-popup-dialog.vue'
	import uniNoticeBar from '@/uni_modules/uni-notice-bar/components/uni-notice-bar/uni-notice-bar.vue'
	import alertCode from '@/components/alertCode/alertCode.vue';
	export default {
		components: {
			// uniPopup,
			// uniPopupMessage,
			// uniPopupDialog,
			uniNoticeBar,
			alertCode
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
				"currentRole":0,
				lll: '"permission":{',
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
					{
						text: "删除",
						value: "delete"
					}
				],
				typeIndex: 0,
				permissionList: [{
					"msg": "无任何限制",
					"code": true,
					"explain": "允许任何角色",
					"explain_end": "本表"
				}, {
					"msg": "完全拒绝",
					"code": false,
					"explain": "禁止任何角色",
					"explain_end": "，管理员角色除外"
				}, {
					"msg": "需要登陆",
					"code": '"auth.uid != null"',
					"explain": "需要登陆后，换句话说限制：未登陆游客"

				}, {
					"msg": "仅限自己创建",
					"code": '"doc.uid == auth.uid"',
					"explain": "只能",
					"explain_end": "自己创建的数据",
					"exclude": "create"
				}, {
					"msg": "表达式限制",
					"code": '"doc.create_time > (now - 60000)"',
					"explain": "只能",
					"explain_end": "1分钟内创建的数据",
					"exclude": "create"
				}, {
					"msg": "限特定角色",
					"code": '"\'AUDITOR\' in auth.role"',
					"explain": "限审核员角色"
				}, {
					"msg": "读取必须带上action",
					"code": '"\'add_view_count\' in action"',
					"explain": "数据操作",
					"explain_end": "请求同时必须同时附带执行一个action云函数，如未触发该action则权限验证失败"
				}]
			}
		},
		mounted() {
			uni.setStorageSync('uni_id_token', '')
			uni.setStorageSync('uni_id_token_expired', '')
		},
		created() {
			for (var j = 0; j < this.types.length; j++) {
				let type = this.types[j].value
				for (let i = 0; i < this.permissionList.length; i++) {
					let jsonString = `{
							"permission":{
								"${type}":${this.permissionList[i].code}
							}
					}`
					if (!this.permissionList[i].codes) this.permissionList[i].codes = {}
					this.permissionList[i].codes[type] = JSON.parse(jsonString)
				}
			}
			console.log(this.permissionList);
		},
		methods: {
			async myFn(e) { // {type:'',tableName:'',index,action:'',where:{}}
				console.log('myFun' + JSON.stringify(e));
				e.where = e.where || {}
				let item = this.permissionList[e.index]
				let tableName = item.tableName || 'permission-test-' + (e.index + 1)
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
							if (res.result.data.length == 0) {
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
						title: '错误:' + err.message + ',' + err.code,
						content: item.explain + '【' + this.typeText + '数据】' + (item.explain_end ? item.explain_end : ''),
						showCancel: false
					});
				} finally {
					uni.hideLoading()
				}
			},
			changePermission(e) {
				console.log(e, '切换完成');
				console.log("role: ",e.role);
				console.log("typeIndex: ",this.typeIndex);
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

	.msg {
		font-weight: 500;
		font-size: 16px;
	}

	.msg::before {
		content: '·';
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
