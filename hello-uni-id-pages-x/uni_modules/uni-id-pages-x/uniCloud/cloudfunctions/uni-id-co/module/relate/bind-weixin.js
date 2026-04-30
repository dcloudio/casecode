const {
  preBind,
  postBind
} = require('../../lib/utils/relate')
const {
  LOG_TYPE
} = require('../../common/constants')
const {
  generateWeixinCache,
  saveWeixinUserKey,
  getWeixinPlatform
} = require('../../lib/utils/weixin')
const {
  initWeixin
} = require('../../lib/third-party/index')
const {
  ERROR
} = require('../../common/error')

/**
 * 绑定微信
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-weixin
 * @param {Object} params
 * @param {String} params.code  微信登录返回的code
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
  const weixinPlatform = getWeixinPlatform.call(this)
  const appId = this.getUniversalClientInfo().appId

  const weixinApi = initWeixin.call(this)
  const clientPlatform = this.clientPlatform
  const apiName = clientPlatform === 'mp-weixin' ? 'code2Session' : 'getOauthAccessToken'
  let getWeixinAccountResult
  try {
    getWeixinAccountResult = await weixinApi[apiName](code)
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.BIND_WEIXIN
    })
    throw {
      errCode: ERROR.GET_THIRD_PARTY_ACCOUNT_FAILED
    }
  }

  const {
    openid,
    unionid,
    // 保存下面四个字段
    sessionKey, // 微信小程序用户sessionKey
    accessToken, // App端微信用户accessToken
    refreshToken, // App端微信用户refreshToken
    expired: accessTokenExpired // App端微信用户accessToken过期时间
  } = getWeixinAccountResult

  const bindAccount = {
    wx_openid: {
      [weixinPlatform]: openid
    },
    wx_unionid: unionid
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_WEIXIN
  })
  await saveWeixinUserKey.call(this, {
    openid,
    sessionKey,
    accessToken,
    refreshToken,
    accessTokenExpired
  })
  return postBind.call(this, {
    uid,
    bindAccount,
    extraData: {
      wx_openid: {
        [`${weixinPlatform}_${appId}`]: openid
      },
      ...generateWeixinCache.call(this, {
        openid,
        sessionKey, // 微信小程序用户sessionKey
        accessToken, // App端微信用户accessToken
        refreshToken, // App端微信用户refreshToken
        accessTokenExpired // App端微信用户accessToken过期时间
      })
    },
    logType: LOG_TYPE.BIND_WEIXIN
  })
}
