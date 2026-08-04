const { userCollection } = require('../../common/constants')
const { ERROR } = require('../../common/error')
const { decryptData } = require('../../common/sensitive-aes-cipher')
const { dataDesensitization } = require('../../common/utils')

/**
 * 获取实名信息
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-realname-info
 * @param {Object} params
 * @param {Boolean} params.decryptData 是否解密数据
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    decryptData: {
      required: false,
      type: 'boolean'
    }
  }

  this.middleware.validate(params, schema)

  const { decryptData: isDecryptData = true } = params

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

  const { realname_auth: realNameAuth = {} } = userRecord

  return {
    errCode: 0,
    type: realNameAuth.type,
    authStatus: realNameAuth.auth_status,
    realName: isDecryptData ? dataDesensitization(decryptData.call(this, realNameAuth.real_name), { onlyLast: true }) : realNameAuth.real_name,
    identity: isDecryptData ? dataDesensitization(decryptData.call(this, realNameAuth.identity)) : realNameAuth.identity
  }
}
