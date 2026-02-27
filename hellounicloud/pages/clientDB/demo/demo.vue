<template>
	<view class="page">
		<uniNoticeBar v-if="noticeData.data" showIcon="true" :text="noticeData.data"></uniNoticeBar>
		<text class="view_count">阅读量：{{noticeData.view_count}}</text>
		<view class="hader-box">
			<view class="let-box">
				<text>体验说明</text>
				<uni-icons size="14" color="#aaaaaa" @click="$refs.helpPopup.open()" type="info"></uni-icons>
			</view>
			<text @click="options.selfId?$refs.dialog.open():tipLogin()" class="comment-btn">写留言</text>
		</view>
		<unicloud-db v-if="noticeData._id" ref="udb" v-slot:default="{data, loading, error, options}" :options="options" page-data="replace"
			collection="opendb-notice-comment,uni-id-users" field="user_id{nickname,_id},text,_id,state" :where="options.where">
			<scroll-view :show-scrollbar="true" scroll-y v-if="data.length" class="comment-list">
				<view class="comment-item" v-for="(item,index) in data" :key="item._id">
					<image class="userImg" :src="'../../../static/userImg/'+item.user_id[0].nickname+'.png'" mode=""></image>
					<view class="content">
						<view style="flex-direction: column;">
							<text style="color: #666;font-size: 14px;font-weight:700;">{{item.user_id[0].nickname}}</text>
							<text style="color: #888;font-size: 14px;">{{item.text}}</text>
						</view>
						<view style="flex-direction: row;">
							<switch v-if="options.role.index>1" class="switch" :checked="item.state==1"
								@change="updateState($event,item._id)" />
							<template v-if="options.selfId == item.user_id[0]._id || options.role.index>1">
								<text class="in-review" v-if="options.role.index===1&&item.state==0">审核中</text>
								<uni-icons v-else color="#cdcfd4" class="ico" size="16" type="compose"
									@click="clickIcon(0,item)"></uni-icons>
								<uni-icons color="#cdcfd4" class="ico" size="16" type="trash"
									@click="clickIcon(1,item)"></uni-icons>
							</template>
						</view>
					</view>
				</view>
			</scroll-view>
		</unicloud-db>
		<uni-popup ref="dialog" type="dialog">
			<uni-popup-dialog mode="input" @confirm="submitComment" title="提交留言" placeholder="留言内容不能含单词test">
			</uni-popup-dialog>
		</uni-popup>

		<uni-popup ref="upDataDialog" type="dialog">
			<uni-popup-dialog mode="input" :value="defaultText" @confirm="updateComment" title="更新留言"
				placeholder="留言内容不能含单词test"></uni-popup-dialog>
		</uni-popup>
		<uni-popup ref="helpPopup" type="center">
			<uni-section title="demo说明" type="line"></uni-section>
			<uni-list-item title="发表留言" note="未登陆用户不能发表留言,你可以尝试切换账号类型为未登陆,发表留言后会被拒绝请求" />
			<uni-list-item title="敏感词过滤" note="发表留言内容含test会被拦截请求" />
			<uni-list-item title="编辑/删除留言" note="限用户编辑或删除自己发表的留言.管理员可以删除/编辑任何人的留言" />
			<uni-list-item title="公告的阅读量" note="1.读取,限登陆用户查看文章阅读量; \n 2.自增,阅读量自动增加由特殊的云函数add_view_count完成" />
			<uni-list-item title="数据查询" note="完整留言数据,由opendb-notice-comment,uni-id-users连张表,通过foreignKey联查获取" />
		</uni-popup>
		<set-permission @change="changePermission"></set-permission>
	</view>
</template>
<script>
	const db = uniCloud.database()
	import uniNoticeBar from '@/uni_modules/uni-notice-bar/components/uni-notice-bar/uni-notice-bar.vue'
	export default {
		components: {
			uniNoticeBar
		},
		data() {
			return {
        noticeData: {
        	"_id": null
        },
				currentRole: 0,
				options: {
					"selfId": "",
					"where": "",// 默认为空，在查到公告内容后设置
					role: {
						index: 0
					},
				},
				activeNoticeId: false,
				defaultText: "",
				fields: "data",
				swipeActionOptions: [{
						text: '编辑',
						style: {
							backgroundColor: '#007aff'
						}
					},
					{
						text: '删除',
						style: {
							backgroundColor: '#dd524d'
						}
					}
				],
			}
		},
		onLoad() {
			this.getNoticeData()
		},
		onReady() {},
		methods: {
			tipLogin() {
				uni.showModal({
					content: '未登陆游客不能写留言！可在底部工具条切换成其他角色体验',
					showCancel: false,
					confirmText: "知道了"
				});
			},
			changePermission(role) {
				console.log("role: ", role);
				this.options.selfId = role.uid
				switch (role.index) {
					case 0:
						this.options.where = `state == 1 && notice_id == "${this.noticeData._id}"`
						break;
					case 1:
						this.options.where = `state == 1 && notice_id == "${this.noticeData._id}" || user_id._id==$env.uid`
						break;
					case 2:
						this.options.where = {"notice_id":this.noticeData._id}
						break;
					case 3:
						this.options.where = {"notice_id":this.noticeData._id}
						break;
					default:
						break;
				}
				this.options.role = role
				this.currentRole = role.role
			},
			async getNoticeData() {
				let res = await db.action('add_view_count')
					.collection('opendb-notice')
          .doc("65365ac355b3379a66170144")
					.field('data,_id,update_time,view_count')
					.get();
					console.log("res: ",res);
				this.noticeData = res.result.data[0]
        this.options.where = `state == 1 && notice_id == "${this.noticeData._id}"`
			},
			async clickIcon(e, item) {
				if (e) {
					await this.$refs.udb.remove(item._id);
				} else {
					this.defaultText = item.text
					this.activeNoticeId = item._id
					this.$refs.upDataDialog.open()
				}
			},
			updateState(e, _id) {
				console.log(e.detail.value, _id);
				uni.showLoading({
					mask: true
				});
				db.collection('opendb-notice-comment')
					.doc(_id)
					.update({
						"state": e.detail.value / 1
					})
					.then(({code,message}) => {
						uni.showToast({
							title: '已切换为:' + (e.detail.value ? '审核通过' : '审核中'),
							icon: 'none',
							duration: 3000
						});
						console.log(code, message);
					}).catch(({code,message}) => {
						console.log(code, message);
					}).finally(e => {
						uni.hideLoading()
						this.$refs.upDataDialog.close()
					})
			},
			async updateComment(text) {
				console.log(text);
				console.log(this.activeNoticeId);
				if (this.defaultText == text) {
					uni.showToast({
						title: '内容未被修改',
						icon: 'none'
					});
					this.$refs.upDataDialog.close()
					return false
				}

				uni.showLoading({
					mask: true
				});
				await this.$refs.udb.update(this.activeNoticeId, {text}, {
					action: "up_comment",
					toastTitle: '修改成功', // toast提示语
					success: (res) => { // 更新成功后的回调
						const {
							code,
							message
						} = res
						console.log(code, message);
						//过度，后续unicloudDb的api会自动更新对应的数据
						this.$refs.udb.dataList.forEach((item, index) => {
							if (item._id == this.activeNoticeId) {
								this.$refs.udb.dataList[index].text = text
								if (this.options.role.index === 1) {
									this.$refs.udb.dataList[index].state = 0
								}
							}
						})
					},
					fail: (err) => { // 更新失败后的回调
						console.log("err: ",err);
						const {message} = err
					},
					complete: () => { // 完成后的回调
						uni.hideLoading()
						this.$refs.upDataDialog.close()
					}
				})
			},
			async submitComment(text) {
				console.log(text);
				if (!text) {
					uni.showToast({
						title: '留言内容不能为空',
						icon: 'none'
					});
					return false
				}
				this.$refs.dialog.close()
				await db.collection('opendb-notice-comment').add({
          notice_id:this.noticeData._id,
					text
				}).then(res => {
					console.log(res);
					this.getNewData()
				}).catch(({
					code,
					message
				}) => {
					if (code == 'TOKEN_INVALID_ANONYMOUS_USER') {
						uni.showModal({
							content: '未登陆游客不能写留言',
							showCancel: false
						});
					}
					if (code == 'VALIDATION_ERROR') {
						uni.showModal({
							content: message,
							showCancel: false
						});
					}
					console.log(code, message);
				})
			},
			getNewData() {
				this.$refs.udb.refresh() //{clear:true}
			},
			getUserImg(e) {
				switch (e) {
					case "admin":
						return '../../../static/userImg/2.png';
						break;
					case "user":
						return '../../../static/userImg/0.png';
						break;
					case "auditor":
						return '../../../static/userImg/1.png';
						break;
					default:
						return '../../../static/userImg/0.png';
						break;
				}
			},
		}
	}
</script>
<style scoped>
	view {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	text {
		font-size: 14px;
	}

	.icon {
		font-size: 26rpx;
	}

	.page {
		height: 100vh;
		width: 750rpx;
		overflow-x: hidden;
	}

	.row {
		background-color: #FFFFFF;
		flex-direction: row;
	}

	.let-box {
		flex-direction: row;
		color: #999999;
	}

	.let-box text,
	.let-box icon {
		line-height: 22px;
	}

	.bottom-box {
		width: 650rpx;
		padding: 0 50rpx;
		bottom: 0;
		position: fixed;
		background-color: #FFFFFF;
		flex-direction: column;
		display: flex;
	}

	.ico {
		margin-right: 10px;
	}

	.hader-box {
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}

	.add-comment-box {
		flex-direction: row;
	}

	.comment-list {
		flex: 1;
		width: 750rpx;
		padding: 16rpx;
	}

	.comment-item {
		width: 750rpx;
		margin-bottom: 20px;
		flex-direction: row;
	}

	.comment-item .content {
		flex-direction: row;
		width: 660rpx;
		justify-content: space-between;
		align-items: center;
		padding-left: 16rpx;
	}

	.userImg {
		width: 70rpx;
		height: 70rpx;
		border-radius: 100px;
		background-color: #EFEFF4;
	}

	.comment-btn {
		color: #586b95;
		font-size: 16px;
	}

	.view_count {
		font-size: 14px;
		padding: 0 16rpx;
		color: #666666;
	}

	.set-permission-box {
		position: fixed;
		width: 750rpx;
		align-items: center;
		bottom: 100px;
	}

	.switch {
		transform: scale(0.7);
	}

	.in-review {
		color: #DD524D;
		margin-right: 15rpx;
	}
</style>
