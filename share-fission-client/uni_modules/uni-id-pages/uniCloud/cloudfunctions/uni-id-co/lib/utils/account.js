const {
  dbCmd,
  userCollection
} = require('../../common/constants')
const {
  USER_IDENTIFIER
} = require('../../common/constants')
const {
  batchFindObjctValue,
  getType,
  isMatchUserApp
} = require('../../common/utils')

/**
 * 查询满足条件的用户
 * @param {Object} params
 * @param {Object} params.userQuery 用户唯一标识组成的查询条件
 * @param {Object} params.authorizedApp 用户允许登录的应用
 * @returns userMatched 满足条件的用户列表
 */
async function findUser (params = {}) {
  const {
    userQuery,
    authorizedApp = []
  } = params
  const condition = getUserQueryCondition(userQuery)
  if (condition.length === 0) {
    throw new Error('Invalid user query')
  }
  const authorizedAppType = getType(authorizedApp)
  if (authorizedAppType !== 'string' && authorizedAppType !== 'array') {
    throw new Error('Invalid authorized app')
  }

  let finalQuery

  if (condition.length === 1) {
    finalQuery = condition[0]
  } else {
    finalQuery = dbCmd.or(condition)
  }
  const userQueryRes = await userCollection.where(finalQuery).get()
  return {
    total: userQueryRes.data.length,
    userMatched: userQueryRes.data.filter(item => {
      return isMatchUserApp(item.dcloud_appid, authorizedApp)
    })
  }
}

function getUserIdentifier (userRecord = {}) {
  const keys = Object.keys(USER_IDENTIFIER)
  return batchFindObjctValue(userRecord, keys)
}

function getUserQueryCondition (userRecord = {}) {
  const userIdentifier = getUserIdentifier(userRecord)
  const condition = []
  for (const key in userIdentifier) {
    const value = userIdentifier[key]
    if (!value) {
      // 过滤所有value为假值的条件，在查询用户时没有意义
      continue
    }
    const queryItem = {
      [key]: value
    }
    // 为兼容用户老数据用户名及邮箱需要同时查小写及原始大小写数据
    if (key === 'mobile') {
      queryItem.mobile_confirmed = 1
    } else if (key === 'email') {
      queryItem.email_confirmed = 1
      const email = userIdentifier.email
      if (email.toLowerCase() !== email) {
        condition.push({
          email: email.toLowerCase(),
          email_confirmed: 1
        })
      }
    } else if (key === 'username') {
      const username = userIdentifier.username
      if (username.toLowerCase() !== username) {
        condition.push({
          username: username.toLowerCase()
        })
      }
    } else if (key === 'identities') {
      queryItem.identities = dbCmd.elemMatch(value)
    }
    condition.push(queryItem)
  }
  return condition
}

module.exports = {
  findUser,
  getUserIdentifier
}
