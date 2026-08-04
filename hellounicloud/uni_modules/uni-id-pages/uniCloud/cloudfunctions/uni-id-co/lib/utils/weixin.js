const crypto = require('crypto')
const {
  userCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  getRedisEnable
} = require('./utils')
const {
  openDataCollection
} = require('../../common/constants')

function decryptWeixinData ({
  encryptedData,
  sessionKey,
  iv
} = {}) {
  const oauthConfig = this.configUtils.getOauthConfig({
    provider: 'weixin'
  })
  const decipher = crypto.createDecipheriv(
    'aes-128-cbc',
    Buffer.from(sessionKey, 'base64'),
    Buffer.from(iv, 'base64')
  )
  // 设置自动 padding 为 true，删除填充补位
  decipher.setAutoPadding(true)
  let decoded
  decoded = decipher.update(encryptedData, 'base64', 'utf8')
  decoded += decipher.final('utf8')
  decoded = JSON.parse(decoded)
  if (decoded.watermark.appid !== oauthConfig.appid) {
    throw new Error('Invalid wechat appid in decode content')
  }
  return decoded
}

function getWeixinPlatform () {
  const platform = this.clientPlatform
  const userAgent = this.getUniversalClientInfo().userAgent
  switch (platform) {
    case 'app':
    case 'app-plus':
    case 'app-android':
    case 'app-ios':
      return 'app'
    case 'mp-weixin':
      return 'mp'
    case 'h5':
    case 'web':
      return userAgent.indexOf('MicroMessenger') > -1 ? 'h5' : 'web'
    default:
      throw new Error('Unsupported weixin platform')
  }
}

async function saveWeixinUserKey ({
  openid,
  sessionKey, // 微信小程序用户sessionKey
  accessToken, // App端微信用户accessToken
  refreshToken, // App端微信用户refreshToken
  accessTokenExpired // App端微信用户accessToken过期时间
} = {}) {
  // 微信公众平台、开放平台refreshToken有效期均为30天（微信没有在网络请求里面返回30天这个值，务必注意未来可能出现调整，需及时更新此处逻辑）。
  // 此前QQ开放平台有调整过accessToken的过期时间：[access_token有效期由90天缩短至30天](https://wiki.connect.qq.com/%E3%80%90qq%E4%BA%92%E8%81%94%E3%80%91access_token%E6%9C%89%E6%95%88%E6%9C%9F%E8%B0%83%E6%95%B4)

  const appId = this.getUniversalClientInfo().appId
  const weixinPlatform = getWeixinPlatform.call(this)
  const keyObj = {
    dcloudAppid: appId,
    openid,
    platform: 'weixin-' + weixinPlatform
  }
  switch (weixinPlatform) {
    case 'mp':
      await this.uniOpenBridge.setSessionKey(keyObj, {
        session_key: sessionKey
      }, 30 * 24 * 60 * 60)
      break
    case 'app':
    case 'h5':
    case 'web':
      await this.uniOpenBridge.setUserAccessToken(keyObj, {
        access_token: accessToken,
        refresh_token: refreshToken,
        access_token_expired: accessTokenExpired
      }, 30 * 24 * 60 * 60)
      break
    default:
      break
  }
}

async function saveSecureNetworkCache ({
  code,
  openid,
  unionid,
  sessionKey
}) {
  const {
    appId
  } = this.getUniversalClientInfo()
  const key = `uni-id:${appId}:weixin-mp:code:${code}:secure-network-cache`
  const value = JSON.stringify({
    openid,
    unionid,
    session_key: sessionKey
  })
  // 此处存储的是code的缓存，设置有效期和token一致
  const expiredSeconds = this.config.tokenExpiresIn || 3 * 24 * 60 * 60

  await openDataCollection.doc(key).set({
    value,
    expired: Date.now() + expiredSeconds * 1000
  })
  const isRedisEnable = getRedisEnable()
  if (isRedisEnable) {
    const redis = uniCloud.redis()
    await redis.set(key, value, 'EX', expiredSeconds)
  }
}

function generateWeixinCache ({
  sessionKey, // 微信小程序用户sessionKey
  accessToken, // App端微信用户accessToken
  refreshToken, // App端微信用户refreshToken
  accessTokenExpired // App端微信用户accessToken过期时间
} = {}) {
  const platform = getWeixinPlatform.call(this)
  let cache
  switch (platform) {
    case 'app':
    case 'h5':
    case 'web':
      cache = {
        access_token: accessToken,
        refresh_token: refreshToken,
        access_token_expired: accessTokenExpired
      }
      break
    case 'mp':
      cache = {
        session_key: sessionKey
      }
      break
    default:
      throw new Error('Unsupported weixin platform')
  }
  return {
    third_party: {
      [`${platform}_weixin`]: cache
    }
  }
}

function getWeixinOpenid ({
  userRecord
} = {}) {
  const weixinPlatform = getWeixinPlatform.call(this)
  const appId = this.getUniversalClientInfo().appId
  const wxOpenidObj = userRecord.wx_openid
  if (!wxOpenidObj) {
    return
  }
  return wxOpenidObj[`${weixinPlatform}_${appId}`] || wxOpenidObj[weixinPlatform]
}

async function getWeixinCacheFallback ({
  userRecord,
  key
} = {}) {
  const platform = getWeixinPlatform.call(this)
  const thirdParty = userRecord && userRecord.third_party
  if (!thirdParty) {
    return
  }
  const weixinCache = thirdParty[`${platform}_weixin`]
  return weixinCache && weixinCache[key]
}

async function getWeixinCache ({
  uid,
  userRecord,
  key
} = {}) {
  const weixinPlatform = getWeixinPlatform.call(this)
  const appId = this.getUniversalClientInfo().appId
  if (!userRecord) {
    const getUserRes = await userCollection.doc(uid).get()
    userRecord = getUserRes.data[0]
  }
  if (!userRecord) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }
  const openid = getWeixinOpenid.call(this, {
    userRecord
  })
  const getCacheMethod = weixinPlatform === 'mp' ? 'getSessionKey' : 'getUserAccessToken'
  const userKey = await this.uniOpenBridge[getCacheMethod]({
    dcloudAppid: appId,
    platform: 'weixin-' + weixinPlatform,
    openid
  })
  if (userKey) {
    return userKey[key]
  }
  return getWeixinCacheFallback({
    userRecord,
    key
  })
}

async function getWeixinAccessToken () {
  const weixinPlatform = getWeixinPlatform.call(this)
  const appId = this.getUniversalClientInfo().appId

  const cache = await this.uniOpenBridge.getAccessToken({
    dcloudAppid: appId,
    platform: 'weixin-' + weixinPlatform
  })

  return cache.access_token
}
module.exports = {
  decryptWeixinData,
  getWeixinPlatform,
  generateWeixinCache,
  getWeixinCache,
  saveWeixinUserKey,
  getWeixinAccessToken,
  saveSecureNetworkCache
}
