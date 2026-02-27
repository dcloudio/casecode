const { preLogin, postLogin } = require('../../lib/utils/login')
const { EXTERNAL_DIRECT_CONNECT_PROVIDER } = require('../../common/constants')
const { ERROR } = require('../../common/error')

/**
 * 外部用户登录
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-login
 * @param {object} params
 * @param {string} params.uid  uni-id体系用户id
 * @param {string} params.externalUid   业务系统的用户id
 * @returns {object}
 */
module.exports = async function (params = {}) {
  const schema = {
    uid: {
      required: false,
      type: 'string'
    },
    externalUid: {
      required: false,
      type: 'string'
    }
  }

  this.middleware.validate(params, schema)

  const {
    uid,
    externalUid
  } = params

  if (!uid && !externalUid) {
    throw {
      errCode: ERROR.PARAM_REQUIRED,
      errMsgValue: {
        param: 'uid or externalUid'
      }
    }
  }

  let query
  if (uid) {
    query = {
      _id: uid
    }
  } else {
    query = {
      identities: {
        provider: EXTERNAL_DIRECT_CONNECT_PROVIDER,
        uid: externalUid
      }
    }
  }

  const user = await preLogin.call(this, {
    user: query
  })

  const result = await postLogin.call(this, {
    user
  })

  return {
    errCode: result.errCode,
    newToken: result.newToken,
    uid: result.uid
  }
}
