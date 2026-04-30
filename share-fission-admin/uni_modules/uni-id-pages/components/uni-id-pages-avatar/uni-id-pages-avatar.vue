<template>
	<button open-type="chooseAvatar" @chooseavatar="bindchooseavatar" @click="uploadAvatarImg" class="box" :class="{'showBorder':border}"  :style="{width,height,lineHeight:height}">
		<cloud-image v-if="avatar_file" :src="avatar_file.url" :width="width" :height="height"></cloud-image>
		<uni-icons v-else :style="{width,height,lineHeight:height}" class="chooseAvatar" type="plusempty" size="30"
			color="#dddddd"></uni-icons>
	</button>
</template>

<script>
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	/**
	* uni-id-pages-avatar 
	* @description 用户头像组件
	* @property {String} width	图片的宽，默认为：50px
	* @property {String} height	图片的高，默认为：50px
	*/
	export default {
		data() {
			return {
				isPC: false
			}
		},
		props: {
			//头像图片宽
			width: {
				type: String,
				default () {
					return "50px"
				}
			},
			//头像图片高
			height: {
				type: String,
				default () {
					return "50px"
				}
			},
			border:{
				type: Boolean,
				default () {
					return false
				}
			}
		},
		async mounted() {
			// #ifdef H5
			this.isPC = !(['ios', 'android'].includes(uni.getSystemInfoSync().platform) || ['harmonyos'].includes(uni.getSystemInfoSync().osName));
			// #endif
		},
		computed: {
			hasLogin() {
				return store.hasLogin
			},
			userInfo() {
				return store.userInfo
			},
			avatar_file() {
				return store.userInfo.avatar_file
			}
		},
		methods: {
			setAvatarFile(avatar_file) {
				// 使用 clientDB 提交数据
				mutations.updateUserInfo({avatar_file})
			},
			async bindchooseavatar(res){
				let avatarUrl = res.detail.avatarUrl
				let avatar_file = {
					extname: avatarUrl.split('.')[avatarUrl.split('.').length - 1],
					name:'',
					url:''
				}
				//上传到服务器
				let cloudPath = this.userInfo._id + '' + Date.now()
				avatar_file.name = cloudPath
				try{
					uni.showLoading({
						title: "更新中",
						mask: true
					});
					let {
						fileID
					} = await uniCloud.uploadFile({
						filePath:avatarUrl,
						cloudPath,
						fileType: "image"
					});
					avatar_file.url = fileID
					uni.hideLoading()
				}catch(e){
					console.error(e);
				}
				console.log('avatar_file',avatar_file);
				this.setAvatarFile(avatar_file)
			},
			uploadAvatarImg(res) {
				// #ifdef MP-WEIXIN
				return false // 微信小程序走 bindchooseavatar方法
				// #endif
				
				// #ifndef MP-WEIXIN
				if(!this.hasLogin){
					return uni.navigateTo({
						url:'/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
					})
				}
				const crop = {
					quality: 100,
					width: 600,
					height: 600,
					resize: true
				};
				uni.chooseImage({
					count: 1,
					crop,
					success: async (res) => {
						let tempFile = res.tempFiles[0],
							avatar_file = {
								// #ifdef H5
								extname: tempFile.name.split('.')[tempFile.name.split('.').length - 1],
								// #endif
								// #ifndef H5
								extname: tempFile.path.split('.')[tempFile.path.split('.').length - 1]
								// #endif
							},
							filePath = res.tempFilePaths[0]
							
						//非app端剪裁头像，app端用内置的原生裁剪
						// #ifdef H5
						if (!this.isPC) {
							filePath = await new Promise((callback) => {
								uni.navigateTo({
									url: '/uni_modules/uni-id-pages/pages/userinfo/cropImage/cropImage?path=' +
										filePath + `&options=${JSON.stringify(crop)}`,
									animationType: "fade-in",
									events: {
										success: url => {
											callback(url)
										}
									},
									complete(e) {
										
									}
								});
							})
						}
						// #endif
						
						let cloudPath = this.userInfo._id + '' + Date.now()
						avatar_file.name = cloudPath
						uni.showLoading({
							title: "更新中",
							mask: true
						});
						let {
							fileID
						} = await uniCloud.uploadFile({
							filePath,
							cloudPath,
							fileType: "image"
						});
						avatar_file.url = fileID
						uni.hideLoading()
						this.setAvatarFile(avatar_file)
					}
				})
				// #endif
			}
		}
	}
</script>

<style>
	/* #ifndef APP-NVUE */
	.box{
		overflow: hidden;
	}
	/* #endif */
	.box{
		padding: 0;
	}
	
	.chooseAvatar {
		/* #ifndef APP-NVUE */
		display: inline-block;
		box-sizing: border-box;
		/* #endif */
		border-radius: 10px;
		text-align: center;
		padding: 1px;
	}
	.showBorder{
		border: solid 1px #ddd;
	}
</style>
