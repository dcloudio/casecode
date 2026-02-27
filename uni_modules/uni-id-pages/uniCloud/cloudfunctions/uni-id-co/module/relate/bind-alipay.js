const {
  preBind,
  postBind
} = require('../../lib/utils/relate')
const {
  LOG_TYPE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  initAlipay
} = require('../../lib/third-party/index')

/**
 * 绑定支付宝账号
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-alipay
 * @param {Object} params
 * @param {String} params.code  支付宝小程序登录返回的code参数
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    code: 'string'
  }
  this.middleware.validate(params, schema)
  const uid = this.authInfo.uid
  const {
    code
  } = params
  const alipayApi = initAlipay.call(this)
  let getAlipayAccountResult
  try {
    getAlipayAccountResult = await alipayApi().code2Session(code)
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.BIND_ALIPAY
    })
    throw {
      errCode: ERROR.GET_THIRD_PARTY_ACCOUNT_FAILED
    }
  }

  const {
    openid
  } = getAlipayAccountResult

  const bindAccount = {
    ali_openid: openid
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_ALIPAY
  })
  return postBind.call(this, {
    uid,
    bindAccount,
    extraData: {},
    logType: LOG_TYPE.BIND_ALIPAY
  })
}
