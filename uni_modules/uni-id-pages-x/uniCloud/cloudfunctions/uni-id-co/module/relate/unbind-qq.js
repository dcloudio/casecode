const {
  preUnBind,
  postUnBind
} = require('../../lib/utils/relate')
const {
  LOG_TYPE, dbCmd
} = require('../../common/constants')
/**
 * 解绑QQ
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-qq
 * @returns
 */
module.exports = async function () {
  const { uid } = this.authInfo

  await preUnBind.call(this, {
    uid,
    unBindAccount: {
      qq_openid: dbCmd.exists(true),
      qq_unionid: dbCmd.exists(true)
    },
    logType: LOG_TYPE.UNBIND_QQ
  })

  return await postUnBind.call(this, {
    uid,
    unBindAccount: {
      qq_openid: dbCmd.remove(),
      qq_unionid: dbCmd.remove()
    },
    logType: LOG_TYPE.UNBIND_QQ
  })
}
