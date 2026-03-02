const WxAccount = require('./weixin/account/index')
const QQAccount = require('./qq/account/index')
const AliAccount = require('./alipay/account/index')
const AppleAccount = require('./apple/account/index')
const HuaweiAccount = require('./huawei/account/index')

const createApi = require('./share/create-api')

module.exports = {
  initWeixin: function () {
    const oauthConfig = this.configUtils.getOauthConfig({ provider: 'weixin' })
    return createApi(WxAccount, {
      appId: oauthConfig.appid,
      secret: oauthConfig.appsecret
    })
  },
  initQQ: function () {
    const oauthConfig = this.configUtils.getOauthConfig({ provider: 'qq' })
    return createApi(QQAccount, {
      appId: oauthConfig.appid,
      secret: oauthConfig.appsecret
    })
  },
  initAlipay: function () {
    const oauthConfig = this.configUtils.getOauthConfig({ provider: 'alipay' })
    return createApi(AliAccount, {
      appId: oauthConfig.appid,
      // 三方应用授权token
      appAuthToken: oauthConfig.appAuthToken,
      // 私钥
      privateKey: oauthConfig.privateKey,
      // 证书模式
      appCertPath: oauthConfig.appCertPath, // 应用公钥证书
      alipayRootCertPath: oauthConfig.alipayRootCertPath // 支付宝根证书
    })
  },
  initApple: function () {
    const oauthConfig = this.configUtils.getOauthConfig({ provider: 'apple' })
    return createApi(AppleAccount, {
      bundleId: oauthConfig.bundleId
    })
  },
  initHuawei: function () {
    const oauthConfig = this.configUtils.getOauthConfig({ provider: 'huawei' })
    return createApi(HuaweiAccount, {
      clientId: oauthConfig.clientId,
      clientSecret: oauthConfig.clientSecret
    })
  }
}
