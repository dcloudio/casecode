import config from '@/admin.config.js'

export function initInterceptor() {
	let isNavigatingToError = false

	uni.addInterceptor('navigateTo', {
		invoke({ url }) {
			isNavigatingToError = url && url.startsWith(config.error.url) ? true : false;
		},
		fail: ({ errMsg }) => {
			if (errMsg.indexOf('is not found') !== -1) {
				// 避免错误页面本身不存在时产生死循环
				if (!isNavigatingToError) {
					uni.navigateTo({
						url: config.error.url + '?errMsg=' + errMsg
					})
				}
			}
		}
	})
}
