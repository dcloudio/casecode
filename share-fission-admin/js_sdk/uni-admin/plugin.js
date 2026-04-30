import {
    initUtil
} from './util.js'
import {
    initError
} from './error.js'
import {
    initRequest
} from './request.js'
import {
    initFetch
} from './fetchMock.js'
import {
    initPermission
} from './permission.js'
import {
    initInterceptor
} from './interceptor.js'

import {
	initUniIdPageStore
} from "../uni-id-pages/store"

export default {
    install(Vue) {
        initUtil(Vue)
        initError(Vue)
		initUniIdPageStore(Vue)
		initRequest(Vue)
		initFetch(Vue)
        initPermission(Vue)
        initInterceptor()
    }
}
