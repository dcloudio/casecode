const {
  findUser
} = require('./account')
const {
  ERROR
} = require('../../common/error')
const {
  userCollection, dbCmd, USER_IDENTIFIER
} = require('../../common/constants')
const {
  getUserIdentifier
} = require('../../lib/utils/account')

const {
  batchFindObjctValue
} = require('../../common/utils')
const {
  merge
} = require('../npm/index')

/**
 *
 * @param {object} param
 * @param {string} param.uid 用户id
 * @param {string} param.bindAccount 要绑定的三方账户、手机号或邮箱
 */
async function preBind ({
  uid,
  bindAccount,
  logType
} = {}) {
  const {
    userMatched
  } = await findUser({
    userQuery: bindAccount,
    authorizedApp: this.getUniversalClientInfo().appId
  })
  if (userMatched.length > 0) {
    await this.middleware.uniIdLog({
      data: {
        user_id: uid
      },
      type: logType,
      success: false
    })
    throw {
      errCode: ERROR.BIND_CONFLICT
    }
  }
}

async function postBind ({
  uid,
  extraData = {},
  bindAccount,
  logType
} = {}) {
  await userCollection.doc(uid).update(merge(bindAccount, extraData))
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: logType
  })
  return {
    errCode: 0
  }
}

async function preUnBind ({
  uid,
  unBindAccount,
  logType
}) {
  const notUnBind = ['username', 'mobile', 'email']
  const userIdentifier = getUserIdentifier(unBindAccount)
  const condition = Object.keys(userIdentifier).reduce((res, key) => {
    if (userIdentifier[key]) {
      if (notUnBind.includes(key)) {
        throw {
          errCode: ERROR.UNBIND_NOT_SUPPORTED
        }
      }

      res.push({
        [key]: userIdentifier[key]
      })
    }

    return res
  }, [])
  const currentUnBindAccount = Object.keys(userIdentifier).reduce((res, key) => {
    if (userIdentifier[key]) {
      res.push(key)
    }
    return res
  }, [])
  const { data: users } = await userCollection.where(dbCmd.and(
    { _id: uid },
    dbCmd.or(condition)
  )).get()

  if (users.length <= 0) {
    await this.middleware.uniIdLog({
      data: {
        user_id: uid
      },
      type: logType,
      success: false
    })
    throw {
      errCode: ERROR.UNBIND_FAIL
    }
  }

  const [user] = users
  const otherAccounts = batchFindObjctValue(user, Object.keys(USER_IDENTIFIER).filter(key => !notUnBind.includes(key) && !currentUnBindAccount.includes(key)))
  let hasOtherAccountBind = false

  for (const key in otherAccounts) {
    if (otherAccounts[key]) {
      hasOtherAccountBind = true
      break
    }
  }

  // 如果没有其他第三方登录方式
  if (!hasOtherAccountBind) {
    // 存在用户名或者邮箱但是没有设置过没密码就提示设置密码
    if ((user.username || user.email) && !user.password) {
      throw {
        errCode: ERROR.UNBIND_PASSWORD_NOT_EXISTS
      }
    }
    // 账号任何登录方式都没有就优先绑定手机号
    if (!user.mobile) {
      throw {
        errCode: ERROR.UNBIND_MOBILE_NOT_EXISTS
      }
    }
  }
}

async function postUnBind ({
  uid,
  unBindAccount,
  logType
}) {
  await userCollection.doc(uid).update(unBindAccount)
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: logType
  })
  return {
    errCode: 0
  }
}

module.exports = {
  preBind,
  postBind,
  preUnBind,
  postUnBind
}
