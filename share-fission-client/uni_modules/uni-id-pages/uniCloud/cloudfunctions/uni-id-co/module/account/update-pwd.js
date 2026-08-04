const {
  userCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const PasswordUtils = require('../../lib/utils/password')
/**
 * 更新密码
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#update-pwd
 * @param {object} params
 * @param {string} params.oldPassword 旧密码
 * @param {string} params.newPassword 新密码
 * @returns {object}
 */
module.exports = async function (params = {}) {
  const schema = {
    oldPassword: 'string', // 防止密码规则调整导致旧密码无法更新
    newPassword: 'password'
  }
  this.middleware.validate(params, schema)
  const uid = this.authInfo.uid
  const getUserRes = await userCollection.doc(uid).get()
  const userRecord = getUserRes.data[0]
  if (!userRecord) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }
  const {
    oldPassword,
    newPassword
  } = params
  const passwordUtils = new PasswordUtils({
    userRecord,
    clientInfo: this.getUniversalClientInfo(),
    passwordSecret: this.config.passwordSecret
  })

  const {
    success: checkPasswordSuccess
  } = passwordUtils.checkUserPassword({
    password: oldPassword,
    autoRefresh: false
  })

  if (!checkPasswordSuccess) {
    throw {
      errCode: ERROR.PASSWORD_ERROR
    }
  }

  const {
    passwordHash,
    version
  } = passwordUtils.generatePasswordHash({
    password: newPassword
  })

  await userCollection.doc(uid).update({
    password: passwordHash,
    password_secret_version: version,
    valid_token_date: Date.now() // refreshToken时会校验，如果创建token时间在此时间点之前，则拒绝下发新token，返回token失效错误码
  })
  // 执行更新密码操作后客户端应将用户退出重新登录
  return {
    errCode: 0
  }
}
