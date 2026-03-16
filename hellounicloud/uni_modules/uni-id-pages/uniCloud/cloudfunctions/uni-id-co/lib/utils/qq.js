const {
  userCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

function getQQPlatform () {
  const platform = this.clientPlatform
  switch (platform) {
    case 'app':
    case 'app-plus':
    case 'app-android':
    case 'app-ios':
      return 'app'
    case 'mp-qq':
      return 'mp'
    default:
      throw new Error('Unsupported qq platform')
  }
}

async function saveQQUserKey ({
  openid,
  sessionKey, // QQ小程序用户sessionKey
  accessToken, // App端QQ用户accessToken
  accessTokenExpired // App端QQ用户accessToken过期时间
} = {}) {
  // 微信公众平台、开放平台refreshToken有效期均为30天（微信没有在网络请求里面返回30天这个值，务必注意未来可能出现调整，需及时更新此处逻辑）。
  // 此前QQ开放平台有调整过accessToken的过期时间：[access_token有效期由90天缩短至30天](https://wiki.connect.qq.com/%E3%80%90qq%E4%BA%92%E8%81%94%E3%80%91access_token%E6%9C%89%E6%95%88%E6%9C%9F%E8%B0%83%E6%95%B4)
  const appId = this.getUniversalClientInfo().appId
  const qqPlatform = getQQPlatform.call(this)
  const keyObj = {
    dcloudAppid: appId,
    openid,
    platform: 'qq-' + qqPlatform
  }
  switch (qqPlatform) {
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
        access_token_expired: accessTokenExpired
      }, accessTokenExpired
        ? Math.floor((accessTokenExpired - Date.now()) / 1000)
        : 30 * 24 * 60 * 60
      )
      break
    default:
      break
  }
}

function generateQQCache ({
  sessionKey, // QQ小程序用户sessionKey
  accessToken, // App端QQ用户accessToken
  accessTokenExpired // App端QQ用户accessToken过期时间
} = {}) {
  const platform = getQQPlatform.call(this)
  let cache
  switch (platform) {
    case 'app':
      cache = {
        access_token: accessToken,
        access_token_expired: accessTokenExpired
      }
      break
    case 'mp':
      cache = {
        session_key: sessionKey
      }
      break
    default:
      throw new Error('Unsupported qq platform')
  }
  return {
    third_party: {
      [`${platform}_qq`]: cache
    }
  }
}

function getQQOpenid ({
  userRecord
} = {}) {
  const qqPlatform = getQQPlatform.call(this)
  const appId = this.getUniversalClientInfo().appId
  const qqOpenidObj = userRecord.qq_openid
  if (!qqOpenidObj) {
    return
  }
  return qqOpenidObj[`${qqPlatform}_${appId}`] || qqOpenidObj[qqPlatform]
}

async function getQQCacheFallback ({
  userRecord,
  key
} = {}) {
  const platform = getQQPlatform.call(this)
  const thirdParty = userRecord && userRecord.third_party
  if (!thirdParty) {
    return
  }
  const qqCache = thirdParty[`${platform}_qq`]
  return qqCache && qqCache[key]
}

async function getQQCache ({
  uid,
  userRecord,
  key
} = {}) {
  const qqPlatform = getQQPlatform.call(this)
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
  const openid = getQQOpenid.call(this, {
    userRecord
  })
  const getCacheMethod = qqPlatform === 'mp' ? 'getSessionKey' : 'getUserAccessToken'
  const userKey = await this.uniOpenBridge[getCacheMethod]({
    dcloudAppid: appId,
    platform: 'qq-' + qqPlatform,
    openid
  })
  if (userKey) {
    return userKey[key]
  }
  return getQQCacheFallback({
    userRecord,
    key
  })
}

module.exports = {
  getQQPlatform,
  generateQQCache,
  getQQCache,
  saveQQUserKey
}
