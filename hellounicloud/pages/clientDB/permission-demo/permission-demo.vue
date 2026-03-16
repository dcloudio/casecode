<template>
	<view class="page">
		<view class="uni-container">
			<uni-forms ref="form" :value="formData" validate-trigger="submit" err-show-type="toast">
				<uni-forms-item name="nickname" label="昵称">
					<uni-easyinput :disabled="rulo_index!=1" v-model="formData.nickname" />
				</uni-forms-item>
				<uni-forms-item name="username" label="姓名">
					<uni-easyinput @click.native="formData.state==0?showTip():''" :disabled="rulo_index!=1||formData.state==0" v-model="formData.username" />
				</uni-forms-item>
				<uni-forms-item name="state" label="状态" v-if="rulo_index>0">
					<uni-data-checkbox v-if="rulo_index>1" @change="setState" :value="formData.state" :multiple="false" :localdata='stateOption' />
					<text class="tip">{{states}}</text>
					<template v-if="rulo_index==1">
						<text class="tip" v-if="formData.state">
							\n你可以修改“姓名”数据，然后会再次进入“审核中”状态。审核期间，用户名不能修改。
						</text>
						<text class="tip" v-else>
							\n审核期间，用户名不能修改。
							你可以切换到管理员角色,更改审核状态后再来更新姓名内容。
							但审核期间你可以更新你的昵称和电话数据
						</text>
					</template>
					<text class="tip" v-if="rulo_index>1">
						<text v-if="formData.state">
							可以在底部工具条切换其他为用户角色,更新编辑姓名字段
						</text>
						<text v-else>你可以点击checkbox编辑审核状态</text>
					</text>
				</uni-forms-item>
				<uni-forms-item name="phone" label="电话">
					<uni-easyinput :disabled="!rulo_index===1" v-if="formData.phone" v-model="formData.phone" />
					<text v-else class="tip">未登陆，账号获取不到phone字段，可以在底部工具条切换其他为用户角色查看</text>
				</uni-forms-item>

				<view class="uni-button-group" v-if="rulo_index===1&&formData._id">
					<button type="primary" class="uni-button" @click="submit">更新</button>
				</view>
			</uni-forms>
		</view>
		<set-permission ref="set-permission" @change="changePermission"></set-permission>
	</view>
</template>

<script>
	import validator from '@/js_sdk/validator/permission-test.js';
	//import db from '@/js_sdk/uni-clientDB/index.js'
	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'permission-test';

	function getValidator(fields) {
		let reuslt = {}
		for (let key in validator) {
			if (fields.indexOf(key) > -1) {
				reuslt[key] = validator[key]
			}
		}
		return reuslt
	}

	export default {
		data() {
			return {
				formData: {
					"_id": false,
					"nickname": "",
					"username": "",
					"state": 0,
					"phone": ""
				},
				formOptions: {},
				rules: {
					...getValidator(["nickname", "username", "state", "phone"])
				},
				stateOption: [
					//	{text:"审核中",value:0},
					{
						text: "审核通过",
						value: 1
					},
					{
						text: "审核拒绝",
						value: -1
					}
				],
				rulo_index: 0,
				role:''
			}
		},
		mounted() {
			this.$refs['set-permission'].init(1)
		},
		computed: {
			states() {
				let _text;
				[{
						text: "审核中",
						value: 0
					},
					{
						text: "审核通过",
						value: 1
					},
					{
						text: "审核拒绝",
						value: -1
					}
				].forEach(({
					text,
					value
				}) => {
					if (value == this.formData.state) {
						_text = text
					}
				})
				return "当前为"+_text+"状态。\n"
			}
		},
		methods: {
			setState(e){
				console.log(e.detail.value,dbCollectionName);
				db.collection(dbCollectionName).update({
					state:e.detail.value
				}).then((res) => {
					console.log("res: ",res);
					this.formData.state = e.detail.value
					uni.showToast({
						icon: 'none',
						title: '更新成功'
					})
				}).catch((err) => {
					console.log(JSON.stringify(err));
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			showTip() {
				uni.showToast({
					title: '审核中不能编辑',
					icon: 'none'
				});
			},
			changePermission({role,index}){
				console.log('index', index);
				console.log('role', role);
				this.role = role
				this.rulo_index = index
				let field = "_id,username,nickname,state";
				let where = {}
				if (index>0) {
					field += ',phone';
				}
				if (index==1) {
					where = "uid == $env.uid"
				}
				db.collection('permission-test')
					.where(where)
					.field(field).get().then(e => {
						console.log(e);
						if (e.result.data[0]){
							this.formData = e.result.data[0]
						}else{
							uni.showLoading({
								title: '正在初始化数据',
								mask: false
							});
							this.addDefaultData()
						}
					}).catch((errors) => {
						console.log(errors);
						uni.hideLoading()
					})
			},
			/**
			 * 触发表单提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.submit().then((res) => {
					this.submitForm(res)
				}).catch((e) => {
					uni.hideLoading()
				})
			},
			addDefaultData() {
				console.log("dbCollectionName: ",dbCollectionName);
				db.collection(dbCollectionName).add({
					"nickname":"默认昵称",
					"username":"默认姓名",
					"phone":"1888888888"
				}).then((res) => {
					console.log(res);
					this.formData._id = res.result.id
					uni.showToast({
						icon: 'none',
						title: '新增成功'
					})
					this.$refs['set-permission'].init(0)
				}).catch((err) => {
					console.log(err);
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			submitForm(value) {
				// 使用 uni-clientDB 提交数据
				if (this.formData._id) {
					console.log(this.formData.state);
					if(this.formData.state===0){
						delete value.username
					}
					if (this.rulo_index <= 1) { //非管理员提交数据。state只能=0，即改状态为审核中，否则会被权限拒绝
						delete value.state
					}
					console.log(value);
					db.action('permission_test_update')
						.collection(dbCollectionName)
						.where("uid == $env.uid")
						.update(value)
						.then((res) => {
							console.log( JSON.stringify(res.result) );
							if (this.rulo_index <= 1 && res.result.changeState) { //非管理员提交数据。state只能=0，即改状态为审核中，否则会被权限拒绝
								this.formData.state = 0
							}
							uni.showToast({
								icon: 'none',
								title: '更新成功'
							})
						}).catch((err) => {
							console.log(JSON.stringify(err));
							uni.showModal({
								content: err.message || '请求服务失败',
								showCancel: false
							})
						}).finally(() => {
							uni.hideLoading()
						})
				} else {
					console.log('err 9527');
				}

			}
		}
	}
</script>

<style>
	.uni-container {
		padding: 15px;
	}
	.uni-input-border,
	.uni-textarea-border {
		width: 100%;
		font-size: 14px;
		color: #666;
		border: 1px #e5e5e5 solid;
		border-radius: 5px;
		box-sizing: border-box;
	}

	.uni-input-border {
		padding: 0 10px;
		height: 35px;

	}

	.uni-textarea-border {
		padding: 10px;
		height: 80px;
	}

	.uni-button-group {
		margin-top: 50px;
		display: flex;
		justify-content: center;
	}

	.uni-button {
		width: 184px;
		padding: 12px 20px;
		font-size: 14px;
		border-radius: 4px;
		line-height: 1;
		margin: 0;
	}
	.tip{
		color: #DD524D;
	}
</style>
