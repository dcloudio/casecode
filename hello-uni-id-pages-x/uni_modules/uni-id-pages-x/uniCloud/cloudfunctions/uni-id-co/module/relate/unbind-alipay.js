const {
  preUnBind,
  postUnBind
} = require('../../lib/utils/relate')
const {
  LOG_TYPE, dbCmd
} = require('../../common/constants')

/**
 * 解绑支付宝
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-alipay
 * @returns
 */
module.exports = async function () {
  const { uid } = this.authInfo

  await preUnBind.call(this, {
    uid,
    unBindAccount: {
      ali_openid: dbCmd.exists(true)
    },
    logType: LOG_TYPE.UNBIND_ALIPAY
  })

  return await postUnBind.call(this, {
    uid,
    unBindAccount: {
      ali_openid: dbCmd.remove()
    },
    logType: LOG_TYPE.UNBIND_ALIPAY
  })
}
