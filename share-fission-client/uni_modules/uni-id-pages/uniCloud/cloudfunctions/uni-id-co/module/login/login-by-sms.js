const {
  getNeedCaptcha,
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  verifyMobileCode
} = require('../../lib/utils/verify-code')
const {
  preUnifiedLogin,
  postUnifiedLogin
} = require('../../lib/utils/unified-login')
const {
  CAPTCHA_SCENE,
  SMS_SCENE,
  LOG_TYPE
} = require('../../common/constants')

/**
 * 短信验证码登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-sms
 * @param {Object} params
 * @param {String} params.mobile      手机号
 * @param {String} params.code        短信验证码
 * @param {String} params.captcha     图形验证码
 * @param {String} params.inviteCode  邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    mobile: 'mobile',
    code: 'string',
    captcha: {
      required: false,
      type: 'string'
    },
    inviteCode: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)
  const {
    mobile,
    code,
    captcha,
    inviteCode
  } = params

  const needCaptcha = await getNeedCaptcha.call(this, {
    mobile
  })

  if (needCaptcha) {
    await verifyCaptcha.call(this, {
      captcha,
      scene: CAPTCHA_SCENE.LOGIN_BY_SMS
    })
  }

  try {
    await verifyMobileCode({
      mobile,
      code,
      scene: SMS_SCENE.LOGIN_BY_SMS
    })
  } catch (error) {
    console.log(error, {
      mobile,
      code,
      type: SMS_SCENE.LOGIN_BY_SMS
    })
    await this.middleware.uniIdLog({
      success: false,
      data: {
        mobile
      },
      type: LOG_TYPE.LOGIN
    })
    throw error
  }

  const {
    type,
    user
  } = await preUnifiedLogin.call(this, {
    user: {
      mobile
    }
  })
  return postUnifiedLogin.call(this, {
    user,
    extraData: {
      mobile_confirmed: 1
    },
    isThirdParty: false,
    type,
    inviteCode
  })
}
