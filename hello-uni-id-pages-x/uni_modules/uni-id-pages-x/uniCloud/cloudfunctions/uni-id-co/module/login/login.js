const {
  preLoginWithPassword,
  postLogin
} = require('../../lib/utils/login')
const {
  getNeedCaptcha,
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  CAPTCHA_SCENE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

/**
 * 用户名密码登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login
 * @param {Object} params
 * @param {String} params.username  用户名
 * @param {String} params.mobile    手机号
 * @param {String} params.email     邮箱
 * @param {String} params.password  密码
 * @param {String} params.captcha   图形验证码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    username: {
      required: false,
      type: 'username'
    },
    mobile: {
      required: false,
      type: 'mobile'
    },
    email: {
      required: false,
      type: 'email'
    },
    password: 'password',
    captcha: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)
  const {
    username,
    mobile,
    email,
    password,
    captcha
  } = params
  if (!username && !mobile && !email) {
    throw {
      errCode: ERROR.INVALID_USERNAME
    }
  } else if (
    (username && email) ||
    (username && mobile) ||
    (email && mobile)
  ) {
    throw {
      errCode: ERROR.INVALID_PARAM
    }
  }
  const needCaptcha = await getNeedCaptcha.call(this, {
    username,
    mobile,
    email
  })
  if (needCaptcha) {
    await verifyCaptcha.call(this, {
      captcha,
      scene: CAPTCHA_SCENE.LOGIN_BY_PWD
    })
  }
  const {
    user,
    extraData
  } = await preLoginWithPassword.call(this, {
    user: {
      username,
      mobile,
      email
    },
    password
  })
  return postLogin.call(this, {
    user,
    extraData
  })
}
