const {
  getPhoneNumber
} = require('../../lib/utils/univerify')
const {
  LOG_TYPE
} = require('../../common/constants')
const {
  preBind,
  postBind
} = require('../../lib/utils/relate')

/**
 * 通过一键登录绑定手机号
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-univerify
 * @param {Object} params
 * @param {String} params.openid        APP端一键登录返回的openid
 * @param {String} params.access_token  APP端一键登录返回的access_token
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    openid: 'string',
    access_token: 'string'
  }
  const {
    openid,
    // eslint-disable-next-line camelcase
    access_token
  } = params
  this.middleware.validate(params, schema)
  const uid = this.authInfo.uid
  let mobile
  try {
    const phoneInfo = await getPhoneNumber.call(this, {
      // eslint-disable-next-line camelcase
      access_token,
      openid
    })
    mobile = phoneInfo.phoneNumber
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      data: {
        user_id: uid
      },
      type: LOG_TYPE.BIND_MOBILE
    })
    throw error
  }

  const bindAccount = {
    mobile
  }
  await preBind.call(this, {
    uid,
    bindAccount,
    logType: LOG_TYPE.BIND_MOBILE
  })
  await postBind.call(this, {
    uid,
    bindAccount,
    extraData: {
      mobile_confirmed: 1
    },
    logType: LOG_TYPE.BIND_MOBILE
  })
  return {
    errCode: 0
  }
}
