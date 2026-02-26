const {
  postRegister,
  preRegisterWithPassword
} = require('../../lib/utils/register')
const {
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  CAPTCHA_SCENE
} = require('../../common/constants')

/**
 * 注册普通用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#register-user
 * @param {Object} params
 * @param {String} params.username    用户名
 * @param {String} params.password    密码
 * @param {String} params.captcha     图形验证码
 * @param {String} params.nickname    昵称
 * @param {String} params.inviteCode  邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    username: 'username',
    password: 'password',
    captcha: 'string',
    nickname: {
      required: false,
      type: 'nickname'
    },
    inviteCode: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)
  const {
    username,
    password,
    nickname,
    captcha,
    inviteCode
  } = params

  await verifyCaptcha.call(this, {
    captcha,
    scene: CAPTCHA_SCENE.REGISTER
  })

  const {
    user,
    extraData
  } = await preRegisterWithPassword.call(this, {
    user: {
      username
    },
    password
  })
  return postRegister.call(this, {
    user,
    extraData: {
      ...extraData,
      nickname
    },
    inviteCode
  })
}
