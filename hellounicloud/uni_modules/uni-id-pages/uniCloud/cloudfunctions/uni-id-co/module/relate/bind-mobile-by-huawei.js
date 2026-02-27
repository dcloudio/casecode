const {
  preBind,
  postBind
} = require('../../lib/utils/relate')
const {
  LOG_TYPE
} = require('../../common/constants')
const {
  decryptWeixinData,
  getWeixinCache, getWeixinAccessToken
} = require('../../lib/utils/weixin')
const {initWeixin} = require('../../lib/third-party')
const {ERROR} = require('../../common/error')
const {initHuawei} = require("../../lib/third-party");
/**
 * 通过华为账号一键登录绑定手机号
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-huawei
 * @param {Object} params
 * @param {String} params.code            华为账号一键登录获取手机号返回的code
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    code: "string"
  }
  const {
    code
  } = params
  this.middleware.validate(params, schema)

  const huaweiApi = initHuawei.call(this)
  const uid = this.authInfo.uid

  const {accessToken} = await huaweiApi.getUserAccessToken(code)
  const res = await huaweiApi.getUserInfo(accessToken)
  const mobile = res.purePhoneNumber

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
