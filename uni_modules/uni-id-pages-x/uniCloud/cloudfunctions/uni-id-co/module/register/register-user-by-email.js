const {
  postRegister,
  preRegisterWithPassword
} = require('../../lib/utils/register')
const {
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  CAPTCHA_SCENE,
  EMAIL_SCENE,
  LOG_TYPE
} = require('../../common/constants')
const {
  verifyEmailCode
} = require('../../lib/utils/verify-code')

/**
 * 通过邮箱+验证码注册普通用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#register-user-by-email
 * @param {Object} params
 * @param {String} params.email    邮箱
 * @param {String} params.password      密码
 * @param {String} params.nickname    昵称
 * @param {String} params.code  邮箱验证码
 * @param {String} params.inviteCode  邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    email: 'email',
    password: 'password',
    nickname: {
      required: false,
      type: 'nickname'
    },
	code: 'string',
    inviteCode: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)
  const {
    email,
    password,
    nickname,
    code,
	inviteCode
  } = params
  
  try {
    // 验证邮箱验证码，验证不通过时写入失败日志
    await verifyEmailCode({
      email,
      code,
      scene: EMAIL_SCENE.REGISTER
    })
  } catch (error) {
    await this.middleware.uniIdLog({
      data: {
        email
      },
      type: LOG_TYPE.REGISTER,
      success: false
    })
    throw error
  }
  
  const {
    user,
    extraData
  } = await preRegisterWithPassword.call(this, {
    user: {
      email
    },
    password
  })
  return postRegister.call(this, {
    user,
    extraData: {
      ...extraData,
      nickname,
	  email_confirmed: 1
    },
    inviteCode
  })
}
