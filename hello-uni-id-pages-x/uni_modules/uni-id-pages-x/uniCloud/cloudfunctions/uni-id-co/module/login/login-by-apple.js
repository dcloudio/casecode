const {
  initApple
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

/**
 * 苹果登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-apple
 * @param {Object} params
 * @param {String} params.identityToken 苹果登录返回的identityToken
 * @param {String} params.nickname      用户昵称
 * @param {String} params.inviteCode    邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    identityToken: 'string',
    nickname: {
      required: false,
      type: 'nickname'
    },
    inviteCode: {
      required: false,
      type: 'string'
    }
  }
  this.middleware.validate(params, schema)
  const {
    identityToken,
    nickname,
    inviteCode
  } = params
  const appleApi = initApple.call(this)
  let verifyResult
  try {
    verifyResult = await appleApi.verifyIdentityToken(identityToken)
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
    openid
  } = verifyResult

  const {
    type,
    user
  } = await preUnifiedLogin.call(this, {
    user: {
      apple_openid: openid
    }
  })
  return postUnifiedLogin.call(this, {
    user,
    extraData: {
      nickname
    },
    isThirdParty: true,
    type,
    inviteCode
  })
}
