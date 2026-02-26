const {
  initWeixin
} = require('../../lib/third-party/index')
const {
  ERROR
} = require('../../common/error')
const {
  preUnifiedLogin,
  postUnifiedLogin
} = require('../../lib/utils/unified-login')
const {
  generateWeixinCache,
  getWeixinPlatform,
  saveWeixinUserKey,
  saveSecureNetworkCache
} = require('../../lib/utils/weixin')
const {
  LOG_TYPE
} = require('../../common/constants')
const url = require('url')

/**
 * 微信登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-weixin
 * @param {Object} params
 * @param {String} params.code          微信登录返回的code
 * @param {String} params.inviteCode    邀请码
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
    inviteCode,
    // 内部参数，暂不暴露
    secureNetworkCache = false
  } = params
  const {
    appId
  } = this.getUniversalClientInfo()
  const weixinApi = initWeixin.call(this)
  const weixinPlatform = getWeixinPlatform.call(this)
  let apiName
  switch (weixinPlatform) {
    case 'mp':
      apiName = 'code2Session'
      break
    case 'app':
    case 'h5':
    case 'web':
      apiName = 'getOauthAccessToken'
      break
    default:
      throw new Error('Unsupported weixin platform')
  }
  let getWeixinAccountResult
  try {
    getWeixinAccountResult = await weixinApi[apiName](code)
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
    openid,
    unionid,
    // 保存下面四个字段
    sessionKey, // 微信小程序用户sessionKey
    accessToken, // App端微信用户accessToken
    refreshToken, // App端微信用户refreshToken
    expired: accessTokenExpired // App端微信用户accessToken过期时间
  } = getWeixinAccountResult

  if (secureNetworkCache) {
    if (weixinPlatform !== 'mp') {
      throw new Error('Unsupported weixin platform, expect mp-weixin')
    }
    await saveSecureNetworkCache.call(this, {
      code,
      openid,
      unionid,
      sessionKey
    })
  }

  const {
    type,
    user
  } = await preUnifiedLogin.call(this, {
    user: {
      wx_openid: {
        [weixinPlatform]: openid
      },
      wx_unionid: unionid
    }
  })
  const extraData = {
    wx_openid: {
      [`${weixinPlatform}_${appId}`]: openid
    },
    wx_unionid: unionid
  }
  if (type === 'register' && weixinPlatform !== 'mp') {
    const {
      nickname,
      avatar
    } = await weixinApi.getUserInfo({
      accessToken,
      openid
    })

    if (avatar) {
      // eslint-disable-next-line n/no-deprecated-api
      const avatarPath = url.parse(avatar).pathname
      const extName = avatarPath.indexOf('.') > -1 ? url.parse(avatar).pathname.split('.').pop() : 'jpg'
      const cloudPath = `user/avatar/${openid.slice(-8) + Date.now()}-avatar.${extName}`
      const getAvatarRes = await uniCloud.httpclient.request(avatar)
      if (getAvatarRes.status >= 400) {
        throw {
          errCode: ERROR.GET_THIRD_PARTY_USER_INFO_FAILED
        }
      }

      const {
        fileID
      } = await uniCloud.uploadFile({
        cloudPath,
        fileContent: getAvatarRes.data
      })

      extraData.avatar_file = {
        name: cloudPath,
        extname: extName,
        url: fileID
      }
    }

    extraData.nickname = nickname
  }
  await saveWeixinUserKey.call(this, {
    openid,
    sessionKey,
    accessToken,
    refreshToken,
    accessTokenExpired
  })
  return postUnifiedLogin.call(this, {
    user,
    extraData: {
      ...extraData,
      ...generateWeixinCache.call(this, {
        openid,
        sessionKey, // 微信小程序用户sessionKey
        accessToken, // App端微信用户accessToken
        refreshToken, // App端微信用户refreshToken
        accessTokenExpired // App端微信用户accessToken过期时间
      })
    },
    isThirdParty: true,
    type,
    inviteCode
  })
}
