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
 * 解绑h华为
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-huawei
 * @returns
 */
module.exports = async function () {
  const { uid } = this.authInfo
  // const weixinPlatform = getWeixinPlatform.call(this)

  await preUnBind.call(this, {
    uid,
    unBindAccount: {
      huawei_openid: dbCmd.exists(true),
      huawei_unionid: dbCmd.exists(true)
    },
    logType: LOG_TYPE.UNBIND_HUAWEI
  })

  return await postUnBind.call(this, {
    uid,
    unBindAccount: {
      huawei_openid: dbCmd.remove(),
      huawei_unionid: dbCmd.remove()
    },
    logType: LOG_TYPE.UNBIND_HUAWEI
  })
}
