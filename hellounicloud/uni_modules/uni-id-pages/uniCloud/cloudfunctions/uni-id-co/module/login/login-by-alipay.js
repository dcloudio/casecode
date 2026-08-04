const {
  initAlipay
} = require('../../lib/third-party/index')
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

/**
 * 支付宝登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-alipay
 * @param {Object} params
 * @param {String} params.code        支付宝小程序客户端登录返回的code
 * @param {String} params.inviteCode  邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    code: 'string',
    inviteCode: {
      type: 'string',
      required: false
    }
  }
  this.middleware.validate(params, schema)
  const {
    code,
    inviteCode
  } = params
  const alipayApi = initAlipay.call(this)
  let getAlipayAccountResult
  try {
    getAlipayAccountResult = await alipayApi.code2Session(code)
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

  const {
    openid
  } = getAlipayAccountResult

  const {
    type,
    user
  } = await preUnifiedLogin.call(this, {
    user: {
      ali_openid: openid
    }
  })
  return postUnifiedLogin.call(this, {
    user,
    extraData: {},
    isThirdParty: true,
    type,
    inviteCode
  })
}
