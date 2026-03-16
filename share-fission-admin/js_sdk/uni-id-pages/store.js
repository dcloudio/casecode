import * as uniIdPagesStore from '@/uni_modules/uni-id-pages/common/store'

// #ifndef VUE3
export function initUniIdPageStore(Vue) {
	Vue.prototype.$uniIdPagesStore = uniIdPagesStore
}
// #endif

// #ifdef VUE3
export function initUniIdPageStore(app) {
	app.config.globalProperties.$uniIdPagesStore = uniIdPagesStore
}
// #endif
