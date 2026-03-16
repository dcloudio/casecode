const {
  initWeixin
} = require('../../lib/third-party/index')
const {
  getWeixinAccessToken
} = require('../../lib/utils/weixin')
const {
  ERROR
} = require('../../common/error')
const {
  preUnifiedLogin,
  postUnifiedLogin
} = require('../../lib/utils/unified-login')
const {
  LOG_TYPE
} = require('../../common/constants')
const {
  preBind,
  postBind
} = require('../../lib/utils/relate')

/**
 * 微信授权手机号登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-weixin-mobile
 * @param {Object} params
 * @param {String} params.phoneCode 微信手机号返回的code
 * @param {String} params.inviteCode 邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    phoneCode: 'string',
    inviteCode: {
      type: 'string',
      required: false
    }
  }

  this.middleware.validate(params, schema)

  const { phoneCode, inviteCode } = params

  const weixinApi = initWeixin.call(this)
  let mobile

  try {
    const accessToken = await getWeixinAccessToken.call(this)
    const mobileRes = await weixinApi.getPhoneNumber(accessToken, phoneCode)
    mobile = mobileRes.purePhoneNumber
  } catch (error) {
    console.error(error)
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.LOGIN
    })
    throw {
      errCode: ERROR.GET_THIRD_PARTY_ACCOUNT_FAILED
    }
  }

  const { type, user } = await preUnifiedLogin.call(this, {
    user: {
      mobile
    }
  })

  let extraData = {
    mobile_confirmed: 1
  }

  if (type === 'login') {
    // 绑定手机号
    if (!user.mobile_confirmed) {
      const bindAccount = {
        mobile
      }
      await preBind.call(this, {
        uid: user._id,
        bindAccount,
        logType: LOG_TYPE.BIND_MOBILE
      })
      await postBind.call(this, {
        uid: user._id,
        bindAccount,
        extraData: {
          mobile_confirmed: 1
        },
        logType: LOG_TYPE.BIND_MOBILE
      })
      extraData = {
        ...extraData,
        ...bindAccount
      }
    }
  }

  return postUnifiedLogin.call(this, {
    user,
    extraData: {
      ...extraData
    },
    isThirdParty: false,
    type,
    inviteCode
  })
}
