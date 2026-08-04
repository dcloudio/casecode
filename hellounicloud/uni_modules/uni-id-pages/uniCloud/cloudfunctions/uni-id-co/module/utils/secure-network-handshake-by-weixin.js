const {
  ERROR
} = require('../../common/error')
const {
  initWeixin
} = require('../../lib/third-party/index')
const {
  saveWeixinUserKey,
  saveSecureNetworkCache
} = require('../../lib/utils/weixin')
const loginByWeixin = require('../login/login-by-weixin')
/**
 * 微信安全网络握手
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-push-cid
 * @param {object} params
 * @param {string} params.code                微信登录返回的code
 * @param {boolean} params.callLoginByWeixin  是否同时调用一次微信登录
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    code: 'string',
    callLoginByWeixin: {
      type: 'boolean',
      required: false
    }
  }
  this.middleware.validate(params, schema)
  let platform = this.clientPlatform
  if (platform !== 'mp-weixin') {
    throw new Error(`[secureNetworkHandshake] platform ${platform} is not supported`)
  }
  const {
    code,
    callLoginByWeixin = false
  } = params
  if (callLoginByWeixin) {
    return loginByWeixin.call(this, { 
      code,
      secureNetworkCache: true
    })
  }
  
  const weixinApi = initWeixin.call(this)
  let getWeixinAccountResult
  try {
    getWeixinAccountResult = await weixinApi.code2Session(code)
  } catch (error) {
    console.error(error)
    throw {
      errCode: ERROR.GET_THIRD_PARTY_ACCOUNT_FAILED
    }
  }
  const {
    openid,
    unionid,
    sessionKey // 微信小程序用户sessionKey
  } = getWeixinAccountResult
  await saveSecureNetworkCache.call(this, {
    code,
    openid,
    unionid,
    sessionKey
  })
  await saveWeixinUserKey.call(this, {
    openid,
    sessionKey
  })
  
  return {
    errCode: 0
  }
}
