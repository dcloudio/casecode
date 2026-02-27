<template>
	<view class="page">
		<alertCode ref="alertCode"></alertCode>
		<uniNoticeBar showIcon="true" iconType="info" text="管理员(admin)拥有任何权限,权限控制对其无效。"></uniNoticeBar>
		
		<view class="uni-title tip">
			一、示例简介
			<text>\n 演示了：
			1.用户可以编辑自己的个人资料。
			2.审核员，审核资料的username字段。
			3.审核期间用户不能修改username字段。
			4.未登陆的游客看不到用户的phone字段 \n \n</text>
			二、需要的资源，schema路径:
			<text>\n uniCloud/database/permission-test.schema.json \n \n</text>
			三、数据的介绍，表字段:
			<text>\n username(姓名), state(审核状态), nickname(昵称), phone(手机号码)</text>
		</view>
		<button @click="toDemo" plain type="primary">查看示例</button>
		
		
		<view class="tips">
			<text>DB Schema的permission规则，分为两部分，一边是对操作数据的指定，一边是对角色的指定，规则中对两者进行关联，匹配则校验通过。</text>
		</view>
		<page-head title="表级权限控制" subTitle="包括增删改查四种权限，分别称为：create、delete、update、read"></page-head>
		<uni-section title="根据true和false控制数据库的相关操作" type="circle" ></uni-section>
			<view class="uni-title pl10">
				配置规则：
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"permission":{
							"read":true
						}
					}'></show-code>
				</scroll-view>
				<text>含义解释：允许任何账户读取本表</text>
			</view>
			<button @click="getFn('uid,username,nickname,state')" plain type="primary">读取表全部数据</button>
			<view  class="uni-title pl10">
				配置规则：
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"permission":{
							"delete":false
						}
					}'></show-code>
				</scroll-view>
				<text>含义解释： 禁止任何账户执行删除表中的记录操作</text>
				<text>\n 但管理员账号不受schema限制，可在底部工具条切换成管理员角色体验</text>
			</view>
			<button @click="removeFn" plain type="primary">删除全部记录数据</button>
			<!-- 你可以尝试切换任何账号，点击如上：读取和删除按钮体验。 -->
		<uni-section title="根据操作的用户id、角色和权限数组" type="circle" ></uni-section>
			<view  class="uni-title pl10">
				配置规则：
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"permission":{
							"create":"auth.uid != null"
						}
					}'></show-code>
				</scroll-view>
				<text>含义解释：表示仅已登陆后的用户才能执行创建操作</text>
			</view>
			<button @click="addFn()" plain type="primary">创建一条数据</button>
		<uni-section title="根据数据库中的目标数据记录"
			type="circle"
		></uni-section>
			<view  class="uni-title pl10 uni-common-mt">
				配置规则：
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"permission":{
							"create":"auth.uid==doc.uid || AUDITOR in auth.role || UPDATE_USER_INFO in auth.permission"
						}
					}'></show-code>
				</scroll-view>
				<!-- 
					<text>{</text>
					<text space="emsp">\n "permission":{</text>
					<text space="emsp">\n  "update":</text>
					<text class="light2" space="ensp">\n        </text>
					<text space="emsp">\n }\n</text>
					<text space="emsp">}</text>
				</view> -->
				<text>含义解释：\n 1.数据创建者 \n 2.角色为审核员 \n 3.拥有编辑权限; \n 三种情况，拥有字段更新权限
				</text>
			</view>
			<button @click="updateFn({nickname:'新昵称'},'uid == $env.uid')" plain type="primary"><text>更新nickname="新昵称"\n（仅当前用户为创建者的数据）</text></button>
			<button @click="updateFn({nickname:'新昵称'})" plain type="primary"><text>更新nickname="新昵称"\n（表中全部数据）</text></button>
		<page-head title="字段级权限控制"></page-head>
		<uni-section title="修改指定字段需要特殊角色" type="circle" ></uni-section>
			<view  class="uni-title pl10 uni-common-mt">
				配置规则：
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"properties":{
							"state":{
								"permission":{
									"write":"AUDITOR in auth.role"
								}
							}
						}
					}'></show-code>
				</scroll-view>
				<!-- <view class="code-box">
					<text space="emsp">"properties":{</text>
					<text space="emsp">\n "state":{</text>
					<text space="emsp">\n  "permission":{ </text>
					<text space="emsp">\n   "write":</text>
					<text class="light2">"AUDITOR' in auth.role"</text>
					<text space="emsp">\n  }</text>
					<text space="emsp">\n }</text>
					<text space="emsp">\n}</text>
				</view> -->
			</view>
				<button @click="updateFn({state:1})" plain type="primary"><text>更新 state = 1</text></button>
			<view  class="uni-title pl10 uni-common-mt">
				<text>含义解释：限角色为审核员才能更新，字段state</text>
			</view>
			
		<uni-section title="修改指定字段时,当前记录的某个字段应当满足某种条件" type="circle" ></uni-section>
			<view class="uni-title pl10 uni-common-mt">
				<view>配置规则：</view><!-- 字段的: -->
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"properties":{
							"username":{
								"permission":{
									"write":"doc.state != 0"
								}
							}
						}
					}'></show-code>
				</scroll-view>
				<!-- <view class="code-box">
					<text space="emsp">"properties":{</text>
					<text space="emsp">\n "username":{</text>
					<text space="emsp">\n  "permission":{ </text>
					<text space="emsp">\n   "write":</text>
					<text class="light2">"doc.state != 0"</text>
					<text space="emsp">\n  }</text>
					<text space="emsp">\n }</text>
					<text space="emsp">\n}</text>
				</view> -->
				<text>含义解释：表示执行该操作需要满足，update的表级权限控制外，还需要满足正在被操作的记录的字段state!=0</text>
			</view>
			<button @click='updateFn({username:"新姓名"})' plain type="primary"><text>更新 username:'新姓名' \n(表中全部数据)</text></button>
			<button @click='updateFn({username:"新姓名"},"uid == $env.uid")' plain type="primary"><text>更新 username:'新姓名' \n(仅当前角色为创建者的数据)</text></button>
			<!-- <view class="uni-title pl10 uni-common-mt">
				<view>注意：</view>
				<text>新创建的数据，默认字段state=0，\n</text>
				<text>通过按钮3，新建1条数据。然后通过按钮5执行本操作，你会得到被拒绝的提示。\n</text>
				<text>如果你执行步骤改为，按钮3-4-5将会顺利执行当前操作：修改username</text>
			</view> -->
		
		<uni-section title="控制特殊字段不可读" type="circle"></uni-section>
			<view  class="uni-title pl10 uni-common-mt">
				配置规则：<!-- phone字段的read:"auth.uid != null" -->
				<scroll-view scroll-x class="code-box">
					<show-code :codes='{
						"properties":{
							"phone":{
								"permission":{
									"read":"auth.uid != null"
								}
							}
						}
					}'></show-code>
				</scroll-view>
				<!-- <view class="code-box">
					<text space="emsp">"properties":{</text>
					<text space="emsp">\n "phone":{</text>
					<text space="emsp">\n  "permission":{ </text>
					<text space="emsp">\n   "read":</text>
					<text class="light2">"auth.uid != null"</text>
					<text space="emsp">\n  }</text>
					<text space="emsp">\n }</text>
					<text space="emsp">\n}</text>
				</view> -->
				<text>含义解释：综合表级任何用户可读的条件下，新增了未登录游客不能读取phone字段</text>
			</view>
			<button  @click="getFn('uid,username,nickname,state')" plain type="primary">读不带phone字段的数据</button>
			<button  @click="getFn('uid,username,nickname,state,phone')" plain type="primary">读带phone字段的数据</button>
		<set-permission ref="set-permission" @change="changePermission"></set-permission>
	</view>
</template>

<script>
	//import db from '@/js_sdk/uni-clientDB/index.js'
	const db = uniCloud.database()
  let ptDb;
	import alertCode from '@/components/alertCode/alertCode.vue';
	import uniNoticeBar from '@/uni_modules/uni-notice-bar/components/uni-notice-bar/uni-notice-bar.vue'
	export default {
		components: {
			uniNoticeBar,alertCode
		},
		data() {
			return {
				currentRole:""
			}
		},
		mounted() {
			uni.setStorageSync('uni_id_token', '')
			uni.setStorageSync('uni_id_token_expired', '')
      ptDb = db.collection('permission-test')
		},
		onShow() {
			this.$nextTick(()=>{
				this.$refs['set-permission'].init(0)
			})
		},
		methods: {
			toDemo(){
				uni.navigateTo({
					url:"./permission-demo"
				})
			},
			previewImage(url){
				uni.previewImage({
					urls:[url]
				})
			},
			addFn(){
				uni.showLoading({mask:true})
				ptDb.add({
					nickname:"默认昵称",
					username:"默认姓名",
					phone:"18888888888"
				}).then(e=>{
					console.log(e);
					uni.showModal({
						content: '成功写入一条数据：\n{ "nickname":"默认昵称",\n "username":"默认姓名",\n "phone":"18888888888" }',
						showCancel: false,
						confirmText:"知道了"
					});
				}).catch(err=>{
					console.log(err);
					uni.showModal({
						title:"未登录游客不能写入数据",
						content: "请在底部工具条切换其他角色重试",
						showCancel: false,
						confirmText:"知道了"
					});
				}).finally(() => {
					uni.hideLoading()
				})
			},
			removeFn(){
				uni.showLoading({mask:true})
				ptDb.remove().then(e=>{
					console.log(e,"123");
					uni.showModal({
						content: JSON.stringify(e.result),
						showCancel: false,
						confirmText:"知道了"
					});
				}).catch(err=>{
					console.log(JSON.stringify(err));
					uni.showModal({
						title:"当前角色没有该权限",
						content: `管理员角色不受schema限制，请在底部工具条切换为管理员角色重试`,
						showCancel: false,
						confirmText:"知道了"
					});
				}).finally(() => {
					uni.hideLoading()
				})
			},
			updateNickname(self){
				
			},
			updateFn(data,where={}){
				console.log(data);
				uni.showLoading({mask:true})
				ptDb.where(where).update(data)
				.then(e=>{
					console.log(e);
					uni.showModal({
						content: JSON.stringify(e.result),
						showCancel: false,
						confirmText:"知道了"
					});
				}).catch(err=>{
					if('nickname' in data){
						uni.showModal({
							title:"被拒绝，普通用户角色，只能更新自己创建的数据。",
							content: '请在底部工具条切换为审核员角色重试',
							showCancel: false,
							confirmText:"知道了"
						});
					}else if('state' in data){
						uni.showModal({
							title:"当前角色无该操作权限",
							content: '请在底部工具条切换为审核员角色重试',
							showCancel: false,
							confirmText:"知道了"
						});
					}else if("username" in data){
						if(Object.keys(where).length === 0){
							uni.showModal({
								title:"根据表级updat权限设置，普通用户角色限更新自己的数据",
								content:"请在底部工具条切换为审核员角色重试",
								showCancel:false,
								confirmText:"知道了"
							})
						}else{
							uni.showModal({
								title:"被拒绝，更新的数据含字段state==0的数据",
								content:"请在底部工具条切换为审核员角色，将全部数据的state更新为1后重试",
								showCancel:false,
								confirmText:"知道了"
							});
						}
					}else{
						uni.showModal({
							title:err.message,
							showCancel: false,
							confirmText:"知道了"
						});
					}
					console.log("错误------",err);
					/* uni.showModal({
						title:"执行更新操作失败！",
						content: "schema配置了，更新该字段限：\n 1、数据创建者，2、审核员，3、当然还有无任何权限限制的管理员",
						showCancel: false,
						confirmText:"知道了"
					}); */
				}).finally(() => {
					uni.hideLoading()
				})
			},
			getFn(field='uid,username,nickname,state'){
				// console.time('getFn');
				uni.showLoading({mask:true})
				ptDb.field(field).get()
				.then(e=>{
					// console.timeEnd('getFn');
					console.log(e);
					if(e.result.data.length){
						this.$refs.alertCode.open(e.result.data)
					}else{
						uni.showModal({
							title:"查询执行成功",
							content:"但目前数据库为空,\n 请滚动页面找到【创建一条数据】点击后重试!",
							showCancel: false,
							confirmText:"知道了"
						});
					}
				}).catch(err=>{
					// console.timeEnd('getFn');
					console.log(err,"err---");
					uni.showModal({
						title:"当前角色无权访问含phone字段数据",
						content: "请在底部工具条切换其他角色重试",
						showCancel: false,
						confirmText:"知道了"
					});
				}).finally(() => {
					uni.hideLoading()
				})
			},
			changePermission(e){
				console.log(e, '切换完成');
				this.currentRole = e.role
			}
		}
	}
</script>

<style scoped>
.code-box{
	background-color:#fffae7;
	padding:5px 15px;
	width: 600rpx;
}
.navigator{
	padding: 16rpx;
	color: #586b95;
}
.page{
	padding-bottom: 100px;
	background-color: #FFFFFF;font-size: 12px;
}
.tip{
	border: dashed 1px #EEEEEE;
	border-radius: 5px;
}
.uni-title {
	width: 700rpx;
	margin:0 25rpx;
	font-size:12px;
	font-weight:500;
	padding:8rpx 20rpx;
	line-height:1.5;
}
.uni-title text{
	font-size:24rpx;
	color:#888;
	word-break: break-word;
}

.pl10{
	padding-left: 20rpx;
}
.title {
	color: #555555;
	font-size: 16px;
	padding:10px 10px;
}
.tips {
	color: #444;
	font-size: 14px;
	padding:10px 20px;
}
.btn-box{
}
button{
	width: 480rpx;
	margin:10px auto;
	font-size: 14px;
	text-align: center;
	line-height: 22px;
	padding: 10rpx;
}
</style>
