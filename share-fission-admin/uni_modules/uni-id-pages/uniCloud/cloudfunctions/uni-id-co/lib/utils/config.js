const {
  getWeixinPlatform
} = require('./weixin')
const createConfig = require('uni-config-center')

const requiredConfig = {
  'web.weixin-h5': ['appid', 'appsecret'],
  'web.weixin-web': ['appid', 'appsecret'],
  'app.weixin': ['appid', 'appsecret'],
  'mp-weixin.weixin': ['appid', 'appsecret'],
  'app.qq': ['appid', 'appsecret'],
  'mp-alipay.alipay': ['appid', 'privateKey'],
  'app.apple': ['bundleId']
}

const uniIdConfig = createConfig({
  pluginId: 'uni-id'
})

class ConfigUtils {
  constructor({
    context
  } = {}) {
    this.context = context
    this.clientInfo = context.getUniversalClientInfo()
    const {
      appId,
      uniPlatform
    } = this.clientInfo
    this.appId = appId
    switch (uniPlatform) {
      case 'app':
      case 'app-plus':
      case 'app-android':
      case 'app-ios':
        this.platform = 'app'
        break
      case 'web':
      case 'h5':
        this.platform = 'web'
        break
      default:
        this.platform = uniPlatform
        break
    }
  }

  getConfigArray() {
    let configContent
    try {
      configContent = require('uni-config-center/uni-id/config.json')
    } catch (error) {
      throw new Error('Invalid config file\n' + error.message)
    }
    if (configContent[0]) {
      return Object.values(configContent)
    }
    configContent.isDefaultConfig = true
    return [configContent]
  }

  getAppConfig() {
    const configArray = this.getConfigArray()
    return configArray.find(item => item.dcloudAppid === this.appId) || configArray.find(item => item.isDefaultConfig)
  }

  getPlatformConfig() {
    const appConfig = this.getAppConfig()
    if (!appConfig) {
      throw new Error(
        `Config for current app (${this.appId}) was not found, please check your config file or client appId`)
    }
    const platform = this.platform
    if (
      (this.platform === 'app' && appConfig['app-plus']) ||
      (this.platform === 'web' && appConfig.h5)
    ) {
      throw new Error(
        `Client platform is ${this.platform}, but ${this.platform === 'web' ? 'h5' : 'app-plus'} was found in config. Please refer to: https://doc.dcloud.net.cn/uniCloud/uni-id/cloud-object.html#m-to-co`
      )
    }
    
    const defaultConfig = {
      tokenExpiresIn: 7200,
      tokenExpiresThreshold: 1200,
      passwordErrorLimit: 6,
      passwordErrorRetryTime: 3600
    }
    return Object.assign(defaultConfig, appConfig, appConfig[platform])
  }

  getOauthProvider({
    provider
  } = {}) {
    const clientPlatform = this.platform
    let oatuhProivder = provider
    if (provider === 'weixin' && clientPlatform === 'web') {
      const weixinPlatform = getWeixinPlatform.call(this.context)
      if (weixinPlatform === 'h5' || weixinPlatform === 'web') {
        oatuhProivder = 'weixin-' + weixinPlatform // weixin-h5 公众号，weixin-web pc端
      }
    }
    return oatuhProivder
  }

  getOauthConfig({
    provider
  } = {}) {
    const config = this.getPlatformConfig()
    const clientPlatform = this.platform
    const oatuhProivder = this.getOauthProvider({
      provider
    })
    const requireConfigKey = requiredConfig[`${clientPlatform}.${oatuhProivder}`] || []
    if (!config.oauth || !config.oauth[oatuhProivder]) {
      throw new Error(`Config param required: ${clientPlatform}.oauth.${oatuhProivder}`)
    }
    const oauthConfig = config.oauth[oatuhProivder]
    requireConfigKey.forEach((item) => {
      if (!oauthConfig[item]) {
        throw new Error(`Config param required: ${clientPlatform}.oauth.${oatuhProivder}.${item}`)
      }
    })
    return oauthConfig
  }

  getHooks() {
    if (uniIdConfig.hasFile('hooks/index.js')) {
      return require(
        uniIdConfig.resolve('hooks/index.js')
      )
    }
    return {}
  }
}

module.exports = ConfigUtils