import {
	uniAdminCacheKey
} from '../constants.js'

// #ifndef VUE3
const statConfig = require('uni-stat-config').default || require('uni-stat-config');
// #endif

export default {
	namespaced: true,
	state: {
		inited: false,
		navMenu: [],
		routes: [],
		theme: uni.getStorageSync(uniAdminCacheKey.theme) || 'default',
		// #ifndef VUE3
		appName: process.env.VUE_APP_NAME || '',
		appid: statConfig && statConfig.appid || '',
		// #endif
		// #ifdef VUE3
		appName: process.env.UNI_APP_NAME || '',
		appid: process.env.UNI_APP_ID || ''
		// #endif
	},
	mutations: {
		SET_APP_NAME: (state, appName) => {
			state.appName = appName
		},
		SET_NAV_MENU: (state, navMenu) => {
			state.inited = true
			state.navMenu = navMenu
		},
		SET_ROUTES: (state, routes) => {
			state.routes = routes
		},
		SET_THEME: (state, theme) => {
			// #ifdef H5
			document
				.getElementsByTagName('body')[0]
				.setAttribute('data-theme', theme)
			// #endif
			uni.setStorageSync(uniAdminCacheKey.theme, theme)
			state.theme = theme
		}
	},
	actions: {
		init({
			commit,
			dispatch
		}) {
			// 初始化获取用户信息
			dispatch('user/getUserInfo', null, {
				root: true
			})
		},
		setAppName({
			commit
		}, appName) {
			commit('SET_APP_NAME', appName)
		},
		setRoutes({
			commit
		}, routes) {
			commit('SET_ROUTES', routes)
		}
	}
}
