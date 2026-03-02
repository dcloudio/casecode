function fetchMock(url) {
	// return fetch(url)
	// 	.then(response => response.json())
	// 	.then(res => {
	// 		return Promise.resolve(res)
	// 	}).catch(err => {
	// 		return Promise.resolve([])
	// 	})

	return Promise.resolve([])
}

// #ifndef VUE3
export function initFetch(Vue) {
	Vue.prototype.$fetch = fetchMock
}
// #endif

// #ifdef VUE3
export function initFetch(app) {
	app.config.globalProperties.$fetch = fetchMock
}
// #endif
