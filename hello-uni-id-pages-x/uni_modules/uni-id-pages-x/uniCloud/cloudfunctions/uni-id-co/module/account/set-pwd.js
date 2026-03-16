const { userCollection, SMS_SCENE, LOG_TYPE, CAPTCHA_SCENE } = require('../../common/constants')
const { ERROR } = require('../../common/error')
const { verifyMobileCode } = require('../../lib/utils/verify-code')
const PasswordUtils = require('../../lib/utils/password')
const { getNeedCaptcha, verifyCaptcha } = require('../../lib/utils/captcha')

module.exports = async function (params = {}) {
  const schema = {
    password: 'password',
    code: 'string',
    captcha: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)

  const { password, code, captcha } = params
  const uid = this.authInfo.uid
  const getUserRes = await userCollection.doc(uid).get()
  const userRecord = getUserRes.data[0]
  if (!userRecord) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }

  const needCaptcha = await getNeedCaptcha.call(this, {
    mobile: userRecord.mobile
  })

  if (needCaptcha) {
    await verifyCaptcha.call(this, {
      captcha,
      scene: CAPTCHA_SCENE.SET_PWD_BY_SMS
    })
  }

  try {
    // 验证手机号验证码，验证不通过时写入失败日志
    await verifyMobileCode({
      mobile: userRecord.mobile,
      code,
      scene: SMS_SCENE.SET_PWD_BY_SMS
    })
  } catch (error) {
    await this.middleware.uniIdLog({
      data: {
        mobile: userRecord.mobile
      },
      type: LOG_TYPE.SET_PWD_BY_SMS,
      success: false
    })
    throw error
  }

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
    password_secret_version: version
  })

  await this.middleware.uniIdLog({
    data: {
      mobile: userRecord.mobile
    },
    type: LOG_TYPE.SET_PWD_BY_SMS
  })

  return {
    errCode: 0
  }
}
