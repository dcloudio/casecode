const {
  userCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  findUser
} = require('../../lib/utils/account')

async function isAuthorizeApproved ({
  uid,
  appIdList
} = {}) {
  const getUserRes = await userCollection.doc(uid).get()
  const userRecord = getUserRes.data[0]
  if (!userRecord) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }
  const {
    userMatched
  } = await findUser({
    userQuery: userRecord,
    authorizedApp: appIdList
  })

  if (userMatched.some(item => item._id !== uid)) {
    throw {
      errCode: ERROR.ACCOUNT_CONFLICT
    }
  }
}

module.exports = {
  isAuthorizeApproved
}
