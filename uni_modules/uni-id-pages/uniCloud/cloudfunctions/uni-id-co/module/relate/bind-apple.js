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
  initApple
} = require('../../lib/third-party/index')

/**
 * 绑定苹果账号
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-apple
 * @param {Object} params
 * @param {String} params.identityToken 苹果登录返回identityToken
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    identityToken: 'string'
  }
  this.middleware.validate(params, schema)
  const uid = this.authInfo.uid
  const {
    identityToken
  } = params
  const appleApi = initApple.call(this)
  let verifyResult
  try {
    verifyResult = await appleApi.verifyIdentityToken(identityToken)
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.BIND_APPLE
    })
    throw {
      errCode: ERROR.GET_THIRD_PARTY_ACCOUNT_FAILED
    }
  }
  const {
    openid
  } = verifyResult

  const bindAccount = {
    apple_openid: openid
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_APPLE
  })
  return postBind.call(this, {
    uid,
    bindAccount,
    extraData: {},
    logType: LOG_TYPE.BIND_APPLE
  })
}
