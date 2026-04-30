function isMobileCodeSupported () {
  const config = this.config
  return !!(config.service && config.service.sms && config.service.sms.smsKey)
}

function isUniverifySupport () {
  return true
}

function isWeixinSupported () {
  this.configUtils.getOauthConfig({
    provider: 'weixin'
  })
  return true
}

function isQQSupported () {
  this.configUtils.getOauthConfig({
    provider: 'qq'
  })
  return true
}

function isAppleSupported () {
  this.configUtils.getOauthConfig({
    provider: 'apple'
  })
  return true
}

function isAlipaySupported () {
  this.configUtils.getOauthConfig({
    provider: 'alipay'
  })
  return true
}

const loginTypeTester = {
  'mobile-code': isMobileCodeSupported,
  univerify: isUniverifySupport,
  weixin: isWeixinSupported,
  qq: isQQSupported,
  apple: isAppleSupported,
  alipay: isAlipaySupported
}

/**
 * 获取支持的登录方式
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-supported-login-type
 * @returns
 */
module.exports = async function () {
  const supportedLoginType = [
    'username-password',
    'mobile-password',
    'email-password'
  ]
  for (const type in loginTypeTester) {
    try {
      if (loginTypeTester[type].call(this)) {
        supportedLoginType.push(type)
      }
    } catch (error) { }
  }
  return {
    errCode: 0,
    errMsg: '',
    supportedLoginType
  }
}
