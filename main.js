import App from './App'
import store from './store'
import plugin from './js_sdk/uni-admin/plugin'
import messages from './i18n/index.js'

const lang = uni.getLocale()
// #ifndef VUE3
import Vue from 'vue'
import VueI18n from 'vue-i18n'
Vue.config.productionTip = false
Vue.use(VueI18n)
// 通过选项创建 VueI18n 实例
const i18n = new VueI18n({
  locale: lang, // 设置地区
  messages, // 设置地区信息
})
Vue.use(plugin)
App.mpType = 'app'
const app = new Vue({
  i18n,
  store,
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createI18n } from 'vue-i18n'

// #ifdef H5
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// #endif

export function createApp() {
  const app = createSSRApp(App)
  const i18n = createI18n({
  	locale: lang,
  	messages
  })
  app.use(i18n)
  app.use(plugin)
  app.use(store)

  // #ifdef H5
  app.use(ElementPlus, { locale: zhCn })
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  // #endif

  return {
    app
  }
}
// #endif
