const {
  getNeedCaptcha,
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  LOG_TYPE,
  SMS_SCENE,
  CAPTCHA_SCENE
} = require('../../common/constants')
const {
  verifyMobileCode
} = require('../../lib/utils/verify-code')
const {
  preBind,
  postBind
} = require('../../lib/utils/relate')

/**
 * 通过短信验证码绑定手机号
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-sms
 * @param {Object} params
 * @param {String} params.mobile    手机号
 * @param {String} params.code      短信验证码
 * @param {String} params.captcha   图形验证码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    mobile: 'mobile',
    code: 'string',
    captcha: {
      type: 'string',
      required: false
    }
  }
  const {
    mobile,
    code,
    captcha
  } = params
  this.middleware.validate(params, schema)
  const uid = this.authInfo.uid

  // 判断是否需要验证码
  const needCaptcha = await getNeedCaptcha.call(this, {
    uid,
    type: LOG_TYPE.BIND_MOBILE
  })
  if (needCaptcha) {
    await verifyCaptcha.call(this, {
      captcha,
      scene: CAPTCHA_SCENE.BIND_MOBILE_BY_SMS
    })
  }

  try {
    // 验证手机号验证码，验证不通过时写入失败日志
    await verifyMobileCode({
      mobile,
      code,
      scene: SMS_SCENE.BIND_MOBILE_BY_SMS
    })
  } catch (error) {
    await this.middleware.uniIdLog({
      data: {
        user_id: uid
      },
      type: LOG_TYPE.BIND_MOBILE,
      success: false
    })
    throw error
  }
  const bindAccount = {
    mobile
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_MOBILE
  })
  await postBind.call(this, {
    uid,
    bindAccount,
    extraData: {
      mobile_confirmed: 1
    },
    logType: LOG_TYPE.BIND_MOBILE
  })
  return {
    errCode: 0
  }
}
