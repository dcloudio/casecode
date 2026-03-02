import pagesJson from '@/pages.json'
import config from '@/uni_modules/uni-id-pages/config.js'

const uniIdCo = uniCloud.importObject("uni-id-co")
const db = uniCloud.database();
const usersTable = db.collection('uni-id-users')

let hostUserInfo = uni.getStorageSync('uni-id-pages-userInfo')||{}

const data = {
	userInfo: hostUserInfo,
	hasLogin: Object.keys(hostUserInfo).length != 0
}

// 定义 mutations, 修改属性
export const mutations = {
	// data不为空，表示传递要更新的值(注意不是覆盖是合并),什么也不传时，直接查库获取更新
	async updateUserInfo(data = false) {
		if (data) {
			usersTable.where('_id==$env.uid').update(data).then(e => {
				// console.log(e);
				if (e.result.updated) {
					uni.showToast({
						title: "更新成功",
						icon: 'none',
						duration: 3000
					});
					this.setUserInfo(data)
				} else {
					uni.showToast({
						title: "没有改变",
						icon: 'none',
						duration: 3000
					});
				}
			})

		} else {
      // 不等待联网查询，立即更新用户_id确保store.userInfo中的_id是最新的
      const _id = uniCloud.getCurrentUserInfo().uid
      this.setUserInfo({_id},{cover:true})
      // 查库获取用户信息，更新store.userInfo
			const uniIdCo = uniCloud.importObject("uni-id-co", {
				customUI: true
			})
			try {
				let res = await usersTable.where("'_id' == $cloudEnv_uid")
					.field('mobile,nickname,username,email,avatar_file')
					.get()

				const realNameRes = await uniIdCo.getRealNameInfo()

				// console.log('fromDbData',res.result.data);
				this.setUserInfo({
					...res.result.data[0],
					realNameAuth: realNameRes
				})
			} catch (e) {
				this.setUserInfo({},{cover:true})
				console.error(e.message, e.errCode);
			}
		}
	},
	setUserInfo(data, {cover}={cover:false}) {
		// console.log('set-userInfo', data);
		let userInfo = cover?data:Object.assign(store.userInfo,data)
		store.userInfo = Object.assign({},userInfo)
		store.hasLogin = Object.keys(store.userInfo).length != 0
		// console.log('store.userInfo', store.userInfo);
		uni.setStorageSync('uni-id-pages-userInfo', store.userInfo)
		return data
	},
	async logout() {
		// 1. 已经过期就不需要调用服务端的注销接口	2.即使调用注销接口失败，不能阻塞客户端
		if(uniCloud.getCurrentUserInfo().tokenExpired > Date.now()){
			try{
				await uniIdCo.logout()
			}catch(e){
				console.error(e);
			}
		}
		uni.removeStorageSync('uni_id_token');
		uni.setStorageSync('uni_id_token_expired', 0)
    this.setUserInfo({},{cover:true})
    uni.$emit('uni-id-pages-logout')
		uni.redirectTo({
			url: `/${pagesJson.uniIdRouter && pagesJson.uniIdRouter.loginPage ? pagesJson.uniIdRouter.loginPage: 'uni_modules/uni-id-pages/pages/login/login-withoutpwd'}`,
		});
	},
	loginBack (e = {}) {
		const {uniIdRedirectUrl = ''} = e
		let delta = 0; //判断需要返回几层
		let pages = getCurrentPages();
		// console.log(pages);
		pages.forEach((page, index) => {
			if (pages[pages.length - index - 1].route.split('/')[3] == 'login') {
				delta++
			}
		})
		// console.log('判断需要返回几层:', delta);
		if (uniIdRedirectUrl) {
			return uni.redirectTo({
				url: uniIdRedirectUrl,
				fail: (err1) => {
					uni.switchTab({
						url:uniIdRedirectUrl,
						fail: (err2) => {
							console.log(err1,err2)
						}
					})
				}
			})
		}
		// #ifdef H5
		if (e.loginType == 'weixin') {
			// console.log('window.history', window.history);
			return window.history.go(-3)
		}
		// #endif

		if (delta) {
			const page = pagesJson.pages[0]
			return uni.reLaunch({
				url: `/${page.path}`
			})
		}

		uni.navigateBack({
			delta
		})
	},
	loginSuccess(e = {}){
		const {
			showToast = true, toastText = '登录成功', autoBack = true, uniIdRedirectUrl = '', passwordConfirmed
		} = e
		// console.log({toastText,autoBack});
		if (showToast) {
			uni.showToast({
				title: toastText,
				icon: 'none',
				duration: 3000
			});
		}
    // 异步调用（更新用户信息）防止获取头像等操作阻塞页面返回
		this.updateUserInfo()

		uni.$emit('uni-id-pages-login-success')

		if (config.setPasswordAfterLogin && !passwordConfirmed) {
			return uni.redirectTo({
				url: uniIdRedirectUrl ? `/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd?uniIdRedirectUrl=${uniIdRedirectUrl}&loginType=${e.loginType}`: `/uni_modules/uni-id-pages/pages/userinfo/set-pwd/set-pwd?loginType=${e.loginType}`,
				fail: (err) => {
					console.log(err)
				}
			})
		}

		if (autoBack) {
			this.loginBack({uniIdRedirectUrl})
		}
	}

}

// #ifdef VUE2
import Vue from 'vue'
// 通过Vue.observable创建一个可响应的对象
export const store = Vue.observable(data)
// #endif

// #ifdef VUE3
import {
	reactive
} from 'vue'
// 通过Vue.observable创建一个可响应的对象
export const store = reactive(data)
// #endif
