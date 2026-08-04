import pagesJson from '@/pages.json'

export default function(e = {}) {
	const {
		showToast = true, toastText = '登录成功', autoBack = true, uniIdRedirectUrl = ''
	} = e

	if (showToast) {
		uni.showToast({
			title: toastText,
			icon: 'none'
		});
	}
	if (autoBack) {
		let delta = 0; //判断需要返回几层
		let pages = getCurrentPages();
		uni.$emit('uni-id-pages-login-success',pages)
		pages.forEach((page, index) => {
			if (pages[pages.length - index - 1].route.split('/')[3] == 'login') {
				delta++
			}
		})
		if (uniIdRedirectUrl) {
			return uni.reLaunch({
				url: uniIdRedirectUrl
			})
		}
		// #ifdef H5
		if(e.loginType == 'weixin'){
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
	}
}
