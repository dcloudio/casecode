import {
	formatDate
} from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'

function formatBytes(bytes) {
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
	if (bytes == 0) {
		return 'n/a'
	}
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
	if (i == 0) {
		return bytes + ' ' + sizes[i]
	}
	return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

// #ifndef VUE3
export function initUtil(Vue) {
	Vue.prototype.$formatDate = formatDate
	Vue.prototype.$formatBytes = formatBytes
}
// #endif

// #ifdef VUE3
export function initUtil(app) {
	app.config.globalProperties.$formatDate = formatDate
	app.config.globalProperties.$formatBytes = formatBytes
}
// #endif