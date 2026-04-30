const {
  isAuthorizeApproved
} = require('./utils')
const {
  dbCmd,
  userCollection
} = require('../../common/constants')

/**
 * 授权用户登录应用
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#authorize-app-login
 * @param {Object} params
 * @param {String} params.uid   用户id
 * @param {String} params.appId 授权的应用的AppId
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    uid: 'string',
    appId: 'string'
  }
  this.middleware.validate(params, schema)
  const {
    uid,
    appId
  } = params
  await isAuthorizeApproved({
    uid,
    appIdList: [appId]
  })
  await userCollection.doc(uid).update({
    dcloud_appid: dbCmd.push(appId)
  })
  return {
    errCode: 0
  }
}
