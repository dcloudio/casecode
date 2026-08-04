const {
  ERROR
} = require('../../common/error')
const {
  getNeedCaptcha,
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  verifyMobileCode
} = require('../../lib/utils/verify-code')
const {
  userCollection,
  SMS_SCENE,
  CAPTCHA_SCENE,
  LOG_TYPE
} = require('../../common/constants')
const {
  findUser
} = require('../../lib/utils/account')
const PasswordUtils = require('../../lib/utils/password')

/**
 * 通过短信验证码重置密码
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#reset-pwd-by-sms
 * @param {object} params
 * @param {string} params.mobile   手机号
 * @param {string} params.mobile   短信验证码
 * @param {string} params.password 密码
 * @param {string} params.captcha  图形验证码
 * @returns {object}
 */
module.exports = async function (params = {}) {
  const schema = {
    mobile: 'mobile',
    code: 'string',
    password: 'password',
    captcha: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)
  const {
    mobile,
    code,
    password,
    captcha
  } = params

  const needCaptcha = await getNeedCaptcha.call(this, {
    mobile,
    type: LOG_TYPE.RESET_PWD_BY_SMS
  })
  if (needCaptcha) {
    await verifyCaptcha.call(this, {
      captcha,
      scene: CAPTCHA_SCENE.RESET_PWD_BY_SMS
    })
  }
  try {
    // 验证手机号验证码，验证不通过时写入失败日志
    await verifyMobileCode({
      mobile,
      code,
      scene: SMS_SCENE.RESET_PWD_BY_SMS
    })
  } catch (error) {
    await this.middleware.uniIdLog({
      data: {
        mobile
      },
      type: LOG_TYPE.RESET_PWD_BY_SMS,
      success: false
    })
    throw error
  }
  // 根据手机号查找匹配的用户
  const {
    total,
    userMatched
  } = await findUser.call(this, {
    userQuery: {
      mobile
    },
    authorizedApp: [this.getUniversalClientInfo().appId]
  })
  if (userMatched.length === 0) {
    if (total > 0) {
      throw {
        errCode: ERROR.ACCOUNT_NOT_EXISTS_IN_CURRENT_APP
      }
    }
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  } else if (userMatched.length > 1) {
    throw {
      errCode: ERROR.ACCOUNT_CONFLICT
    }
  }
  const { _id: uid } = userMatched[0]
  const {
    passwordHash,
    version
  } = new PasswordUtils({
    clientInfo: this.getUniversalClientInfo(),
    passwordSecret: this.config.passwordSecret
  }).generatePasswordHash({
    password
  })
  // 更新用户密码
  await userCollection.doc(uid).update({
    password: passwordHash,
    password_secret_version: version,
    valid_token_date: Date.now()
  })

  // 写入成功日志
  await this.middleware.uniIdLog({
    data: {
      mobile
    },
    type: LOG_TYPE.RESET_PWD_BY_SMS
  })
  return {
    errCode: 0
  }
}
