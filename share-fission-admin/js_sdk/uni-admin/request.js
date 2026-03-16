import store from '@/store/index.js'
import config from '@/admin.config.js'
const debugOptions = config.navBar.debug

const db = uniCloud.database()

export function request (action, params, options) {
	const {objectName, functionName, showModal, ...objectOptions} = Object.assign({
		objectName: 'uni-id-co',
		functionName: '',
		showModal: false,

		customUI: true,
		loadingOptions: {
			title: 'xxx'
		},
	}, options)

	// 兼容 云函数 与 云对象 请求，默认为云对象
	let call
	if (functionName) {
		call = uniCloud.callFunction({
			name: functionName,
			data: {
				action,
				params
			}
		})
	} else {
		const uniCloudObject = uniCloud.importObject(objectName, objectOptions)
		call = uniCloudObject[action](params)
	}

	return call.then(result => {
		result = functionName ? result.result: result
		if (!result) {
			return Promise.resolve(result)
		}

		if (result.errCode) {
			return Promise.reject(result)
		}

		return Promise.resolve(result)

	}).catch(err => {
		showModal && uni.showModal({
			content: err.errMsg || '请求服务失败',
			showCancel: false
		})
		// #ifdef H5
		const noDebugPages = ['/uni_modules/uni-id-pages/pages/login/login-withpwd', '/uni_modules/uni-id-pages/pages/register/register']
		const path = location.hash.split('#')[1]
		if (debugOptions && debugOptions.enable === true && noDebugPages.indexOf(path) === -1) {
			store.dispatch('error/add', {
				err: err.toString(),
				info: '$request("' + action + '")',
				route: '',
				time: new Date().toLocaleTimeString()
			})
		}
		// #endif
		return Promise.reject(err)
	})
}

// #ifndef VUE3
export function initRequest(Vue) {
	Vue.prototype.$request = request
}
// #endif

// #ifdef VUE3
export function initRequest(app) {
	app.config.globalProperties.$request = request
}
// #endif
