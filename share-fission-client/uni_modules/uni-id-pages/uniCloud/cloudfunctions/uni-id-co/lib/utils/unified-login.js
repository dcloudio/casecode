const {
  checkLoginUserRecord,
  postLogin
} = require('./login')
const {
  postRegister
} = require('./register')
const {
  findUser
} = require('./account')
const {
  ERROR
} = require('../../common/error')

async function realPreUnifiedLogin (params = {}) {
  const {
    user,
    type
  } = params
  const appId = this.getUniversalClientInfo().appId
  const {
    total,
    userMatched
  } = await findUser({
    userQuery: user,
    authorizedApp: appId
  })
  if (userMatched.length === 0) {
    if (type === 'login') {
      if (total > 0) {
        throw {
          errCode: ERROR.ACCOUNT_NOT_EXISTS_IN_CURRENT_APP
        }
      }
      throw {
        errCode: ERROR.ACCOUNT_NOT_EXISTS
      }
    }
    return {
      type: 'register',
      user
    }
  } if (userMatched.length === 1) {
    if (type === 'register') {
      throw {
        errCode: ERROR.ACCOUNT_EXISTS
      }
    }
    const userRecord = userMatched[0]
    checkLoginUserRecord(userRecord)
    return {
      type: 'login',
      user: userRecord
    }
  } else if (userMatched.length > 1) {
    throw {
      errCode: ERROR.ACCOUNT_CONFLICT
    }
  }
}

async function preUnifiedLogin (params = {}) {
  try {
    const result = await realPreUnifiedLogin.call(this, params)
    return result
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false
    })
    throw error
  }
}

async function postUnifiedLogin (params = {}) {
  const {
    user,
    extraData = {},
    isThirdParty = false,
    type,
    inviteCode
  } = params
  let result
  if (type === 'login') {
    result = await postLogin.call(this, {
      user,
      extraData,
      isThirdParty
    })
  } else if (type === 'register') {
    result = await postRegister.call(this, {
      user,
      extraData,
      isThirdParty,
      inviteCode
    })
  }
  return {
    ...result,
    type
  }
}

module.exports = {
  preUnifiedLogin,
  postUnifiedLogin
}
