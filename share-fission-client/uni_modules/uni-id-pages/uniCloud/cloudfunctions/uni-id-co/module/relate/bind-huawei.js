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
const {initHuawei} = require("../../lib/third-party");

/**
 * 绑定华为账号
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-huawei
 * @param {Object} params
 * @param {String} params.code
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
  const huaweiApi = initHuawei.call(this)

  let accountResult
  try {
    const {accessToken} = await huaweiApi.getUserAccessToken(code)
    accountResult = await huaweiApi.getAccessTokenInfo(accessToken)
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
    openId,
    unionId
  } = accountResult

  const bindAccount = {
    huawei_openid: openId,
    huawei_unionid: unionId
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_HUAWEI
  })
  return postBind.call(this, {
    uid,
    bindAccount,
    extraData: {},
    logType: LOG_TYPE.BIND_HUAWEI
  })
}
