const {
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  EMAIL_SCENE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
/**
 * 发送邮箱验证码，可用于登录、注册、绑定邮箱、修改密码等操作
 * @tutorial
 * @param {Object} params
 * @param {String} params.email     邮箱
 * @param {String} params.captcha   图形验证码
 * @param {String} params.scene     使用场景
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    email: 'email',
    captcha: 'string',
    scene: 'string'
  }
  this.middleware.validate(params, schema)

  const {
    email,
    captcha,
    scene
  } = params

  if (!(Object.values(EMAIL_SCENE).includes(scene))) {
    throw {
      errCode: ERROR.INVALID_PARAM
    }
  }

  await verifyCaptcha.call(this, {
    scene: 'send-email-code',
    captcha
  })

  // -- 测试代码
  await require('../../lib/utils/verify-code')
    .setEmailVerifyCode.call(this, {
      email,
      code: '123456',
      expiresIn: 180,
      scene
    })
  return {
    errCode: 'uni-id-invalid-mail-template',
    errMsg: `已启动测试模式，直接使用：123456作为邮箱验证码即可。\n如果是正式项目，需自行实现发送邮件的相关功能`
  }
  // -- 测试代码


  //发送邮件--需自行实现
}
