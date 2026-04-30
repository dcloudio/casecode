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
  initQQ
} = require('../../lib/third-party/index')
const {
  generateQQCache,
  getQQPlatform,
  saveQQUserKey
} = require('../../lib/utils/qq')

/**
 * 绑定QQ
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-qq
 * @param {Object} params
 * @param {String} params.code          小程序端QQ登录返回的code
 * @param {String} params.accessToken   APP端QQ登录返回的accessToken
 * @param {String} params.accessTokenExpired    accessToken过期时间，由App端QQ登录返回的expires_in参数计算而来，单位：毫秒
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
    }
  }
  this.middleware.validate(params, schema)
  const uid = this.authInfo.uid
  const {
    code,
    accessToken,
    accessTokenExpired
  } = params
  const qqPlatform = getQQPlatform.call(this)
  const appId = this.getUniversalClientInfo().appId
  const qqApi = initQQ.call(this)
  const clientPlatform = this.clientPlatform
  const apiName = clientPlatform === 'mp-qq' ? 'code2Session' : 'getOpenidByToken'
  let getQQAccountResult
  try {
    getQQAccountResult = await qqApi[apiName]({
      code,
      accessToken
    })
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.BIND_QQ
    })
    throw {
      errCode: ERROR.GET_THIRD_PARTY_ACCOUNT_FAILED
    }
  }

  const {
    openid,
    unionid,
    // 保存下面四个字段
    sessionKey // 微信小程序用户sessionKey
  } = getQQAccountResult

  const bindAccount = {
    qq_openid: {
      [qqPlatform]: openid
    },
    qq_unionid: unionid
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_QQ
  })
  await saveQQUserKey.call(this, {
    openid,
    sessionKey,
    accessToken,
    accessTokenExpired
  })
  return postBind.call(this, {
    uid,
    bindAccount,
    extraData: {
      qq_openid: {
        [`${qqPlatform}_${appId}`]: openid
      },
      ...generateQQCache.call(this, {
        openid,
        sessionKey
      })
    },
    logType: LOG_TYPE.BIND_QQ
  })
}
