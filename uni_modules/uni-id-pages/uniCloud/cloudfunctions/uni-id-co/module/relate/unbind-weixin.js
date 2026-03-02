const {
  preUnBind,
  postUnBind
} = require('../../lib/utils/relate')
const {
  LOG_TYPE, dbCmd
} = require('../../common/constants')
const {
  getWeixinPlatform
} = require('../../lib/utils/weixin')

/**
 * 解绑微信
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-weixin
 * @returns
 */
module.exports = async function () {
  const { uid } = this.authInfo
  // const weixinPlatform = getWeixinPlatform.call(this)

  await preUnBind.call(this, {
    uid,
    unBindAccount: {
      wx_openid: dbCmd.exists(true),
      wx_unionid: dbCmd.exists(true)
    },
    logType: LOG_TYPE.UNBIND_WEIXIN
  })

  return await postUnBind.call(this, {
    uid,
    unBindAccount: {
      wx_openid: dbCmd.remove(),
      wx_unionid: dbCmd.remove()
    },
    logType: LOG_TYPE.UNBIND_WEIXIN
  })
}
