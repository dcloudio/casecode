const {
  initQQ
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
const {
  getQQPlatform,
  generateQQCache,
  saveQQUserKey
} = require('../../lib/utils/qq')
const url = require('url')

/**
 * QQ登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-qq
 * @param {Object} params
 * @param {String} params.code                  QQ小程序登录返回的code参数
 * @param {String} params.accessToken           App端QQ登录返回的accessToken参数
 * @param {String} params.accessTokenExpired    accessToken过期时间，由App端QQ登录返回的expires_in参数计算而来，单位：毫秒
 * @param {String} params.inviteCode            邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    code: {
      type: 'string',
      required: false
    },
    accessToken: {
      type: 'string',
      required: false
    },
    accessTokenExpired: {
      type: 'number',
      required: false
    },
    inviteCode: {
      type: 'string',
      required: false
    }
  }
  this.middleware.validate(params, schema)
  const {
    code,
    accessToken,
    accessTokenExpired,
    inviteCode
  } = params
  const {
    appId
  } = this.getUniversalClientInfo()
  const qqApi = initQQ.call(this)
  const qqPlatform = getQQPlatform.call(this)
  let apiName
  switch (qqPlatform) {
    case 'mp':
      apiName = 'code2Session'
      break
    case 'app':
      apiName = 'getOpenidByToken'
      break
    default:
      throw new Error('Unsupported qq platform')
  }
  let getQQAccountResult
  try {
    getQQAccountResult = await qqApi[apiName]({
      code,
      accessToken
    })
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
    // 保存下面的字段
    sessionKey // QQ小程序用户sessionKey
  } = getQQAccountResult

  const {
    type,
    user
  } = await preUnifiedLogin.call(this, {
    user: {
      qq_openid: {
        [qqPlatform]: openid
      },
      qq_unionid: unionid
    }
  })
  const extraData = {
    qq_openid: {
      [`${qqPlatform}_${appId}`]: openid
    },
    qq_unionid: unionid
  }
  if (type === 'register' && qqPlatform !== 'mp') {
    const {
      nickname,
      avatar
    } = await qqApi.getUserInfo({
      accessToken,
      openid
    })
    if (avatar) {
      // eslint-disable-next-line n/no-deprecated-api
      const extName = url.parse(avatar).pathname.split('.').pop()
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
  await saveQQUserKey.call(this, {
    openid,
    sessionKey,
    accessToken,
    accessTokenExpired
  })
  return postUnifiedLogin.call(this, {
    user,
    extraData: {
      ...extraData,
      ...generateQQCache.call(this, {
        openid,
        sessionKey, // QQ小程序用户sessionKey
        accessToken, // App端QQ用户accessToken
        accessTokenExpired // App端QQ用户accessToken过期时间
      })
    },
    isThirdParty: true,
    type,
    inviteCode
  })
}
