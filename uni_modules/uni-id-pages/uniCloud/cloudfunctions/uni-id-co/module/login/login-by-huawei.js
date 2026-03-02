const {
  ERROR
} = require('../../common/error')
const {
  preUnifiedLogin,
  postUnifiedLogin
} = require('../../lib/utils/unified-login')
const {
  getHuaweiPlatform,
} = require('../../lib/utils/huawei')
const {
  LOG_TYPE
} = require('../../common/constants')
const url = require('url')
const {initHuawei} = require("../../lib/third-party");

/**
 * 华为登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-huawei
 * @param {Object} params
 * @param {String} params.code          华为登录返回的code
 * @param {String} params.inviteCode    邀请码
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    code: {
      type: 'string',
      required: false
    },
    phoneCode: {
      type: 'string',
      required: false
    },
    inviteCode: {
      type: 'string',
      required: false
    }
  }
  this.middleware.validate(params, schema)

  const {
    inviteCode
  } = params

  if (!params.code && !params.phoneCode) {
    throw {
      errCode: ERROR.PARAM_REQUIRED,
      errMsgValue: {
        param: 'code or phoneCode'
      }
    }
  }

  const {
    appId
  } = this.getUniversalClientInfo()
  const huaweiPlatform = getHuaweiPlatform.call(this)
  const code = params.code || params.phoneCode
  const huaweiApi = initHuawei.call(this)

  let accessToken
  try {
    const res = await huaweiApi.getUserAccessToken(code)

    if (res.errCode !== 0) {
      console.error(res)
      throw new Error(res.errMsg)
    }

    accessToken = res.accessToken
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
    openID: openId,
    unionID: unionId,
    purePhoneNumber: mobile,
    displayName: nickname,
    headPictureURL: avatar,
  } = await huaweiApi.getUserInfo(accessToken)

  const {
    type,
    user
  } = await preUnifiedLogin.call(this, {
    user: {
      huawei_openid: {
        [huaweiPlatform]: openId
      },
      huawei_unionid: unionId,
      mobile
    }
  })

  const extraData = {
    huawei_openid: {
      [`${huaweiPlatform}_${appId}`]: openId
    },
    huawei_unionid: unionId
  }

  if (mobile) {
    extraData.mobile = mobile
    extraData.mobile_confirmed = 1
  }

  if (type === 'register') {
    if (avatar) {
      // eslint-disable-next-line n/no-deprecated-api
      const avatarPath = url.parse(avatar).pathname
      const extName = avatarPath.indexOf('.') > -1 ? url.parse(avatar).pathname.split('.').pop() : 'jpg'
      const cloudPath = `user/avatar/${openId.slice(-8) + Date.now()}-avatar.${extName}`
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

  return postUnifiedLogin.call(this, {
    user,
    extraData,
    isThirdParty: true,
    type,
    inviteCode
  })
}
