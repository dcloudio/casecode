import store from '@/store'
import config from '@/admin.config.js'

// #ifndef VUE3
export function initError(Vue) {
     const debugOptions = config.navBar.debug
     if (debugOptions && debugOptions.enable === true) {
        const oldErrorHandler = Vue.config.errorHandler
        Vue.config.errorHandler = function errorHandler(err, vm, info) {
			console.error(err)
             const route = vm.$page && vm.$page.route
             store.dispatch('error/add', {
                 err: err.toString(),
				 info,
                 route,
                 time: new Date().toLocaleTimeString()
             })
            return oldErrorHandler(err, vm, info)
         }
     }
}
// #endif

// #ifdef VUE3
export function initError(app) {
    const debugOptions = config.navBar.debug
    if (debugOptions && debugOptions.enable === true) {
        const oldErrorHandler = app.config.errorHandler
        app.config.errorHandler = function errorHandler(err, vm, info) {
			console.error(err)
            const route = vm.$page && vm.$page.route
            store.dispatch('error/add', {
                err: err.toString(),
                info,
                route,
                time: new Date().toLocaleTimeString()
            })
            return oldErrorHandler && oldErrorHandler(err, vm, info)
        }
    }
}
// #endif
