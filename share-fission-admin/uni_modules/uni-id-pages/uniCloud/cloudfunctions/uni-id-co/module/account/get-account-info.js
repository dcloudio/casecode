const {
  userCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

function isUsernameSet (userRecord) {
  return !!userRecord.username
}
function isNicknameSet (userRecord) {
  return !!userRecord.nickname
}
function isPasswordSet (userRecord) {
  return !!userRecord.password
}
function isMobileBound (userRecord) {
  return !!(userRecord.mobile && userRecord.mobile_confirmed)
}
function isEmailBound (userRecord) {
  return !!(userRecord.email && userRecord.email_confirmed)
}
function isWeixinBound (userRecord) {
  return !!(
    userRecord.wx_unionid ||
    Object.keys(userRecord.wx_openid || {}).length
  )
}
function isQQBound (userRecord) {
  return !!(
    userRecord.qq_unionid ||
    Object.keys(userRecord.qq_openid || {}).length
  )
}
function isAlipayBound (userRecord) {
  return !!userRecord.ali_openid
}
function isAppleBound (userRecord) {
  return !!userRecord.apple_openid
}

/**
 * 获取账户账户简略信息
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-account-info
 */
module.exports = async function () {
  const {
    uid
  } = this.authInfo
  const getUserRes = await userCollection.doc(uid).get()
  const userRecord = getUserRes && getUserRes.data && getUserRes.data[0]
  if (!userRecord) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }
  return {
    errCode: 0,
    isUsernameSet: isUsernameSet(userRecord),
    isNicknameSet: isNicknameSet(userRecord),
    isPasswordSet: isPasswordSet(userRecord),
    isMobileBound: isMobileBound(userRecord),
    isEmailBound: isEmailBound(userRecord),
    isWeixinBound: isWeixinBound(userRecord),
    isQQBound: isQQBound(userRecord),
    isAlipayBound: isAlipayBound(userRecord),
    isAppleBound: isAppleBound(userRecord)
  }
}
