const {
  dbCmd,
  userCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
/**
 * 获取随机邀请码，邀请码由大写字母加数字组成，由于存在手动输入邀请码的场景，从可选字符中去除 0、1、I、O
 * @param {number} len 邀请码长度，默认6位
 * @returns {string} 随机邀请码
 */
function getRandomInviteCode (len = 6) {
  const charArr = ['2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  let code = ''
  for (let i = 0; i < len; i++) {
    code += charArr[Math.floor(Math.random() * charArr.length)]
  }
  return code
}

/**
 * 获取可用的邀请码，至多尝试十次以获取可用邀请码。从10亿可选值中随机，碰撞概率较低
 * 也有其他方案可以尝试，比如在数据库内设置一个从0开始计数的数字，每次调用此方法时使用updateAndReturn使数字加1并返回加1后的值，根据这个值生成对应的邀请码，比如（22222A + 1 == 22222B），此方式性能理论更好，但是不适用于旧项目
 * @param {object} param
 * @param {string} param.inviteCode 初始随机邀请码
 */
async function getValidInviteCode () {
  let retry = 10
  let code
  let codeValid = false
  while (retry > 0 && !codeValid) {
    retry--
    code = getRandomInviteCode()
    const getUserRes = await userCollection.where({
      my_invite_code: code
    }).limit(1).get()
    if (getUserRes.data.length === 0) {
      codeValid = true
      break
    }
  }
  if (!codeValid) {
    throw {
      errCode: ERROR.SET_INVITE_CODE_FAILED
    }
  }
  return code
}

/**
 * 根据邀请码查询邀请人
 * @param {object} param
 * @param {string} param.inviteCode 邀请码
 * @param {string} param.queryUid 受邀人id，非空时校验不可被下家或自己邀请
 * @returns
 */
async function findUserByInviteCode ({
  inviteCode,
  queryUid
} = {}) {
  if (typeof inviteCode !== 'string') {
    throw {
      errCode: ERROR.SYSTEM_ERROR
    }
  }
  // 根据邀请码查询邀请人
  let getInviterRes
  if (queryUid) {
    getInviterRes = await userCollection.where({
      _id: dbCmd.neq(queryUid),
      inviter_uid: dbCmd.not(dbCmd.all([queryUid])),
      my_invite_code: inviteCode
    }).get()
  } else {
    getInviterRes = await userCollection.where({
      my_invite_code: inviteCode
    }).get()
  }
  if (getInviterRes.data.length > 1) {
    // 正常情况下不可能进入此条件，以防用户自行修改数据库出错，在此做出判断
    throw {
      errCode: ERROR.SYSTEM_ERROR
    }
  }
  const inviterRecord = getInviterRes.data[0]
  if (!inviterRecord) {
    throw {
      errCode: ERROR.INVALID_INVITE_CODE
    }
  }
  return inviterRecord
}

/**
 * 根据邀请码生成邀请信息
 * @param {object} param
 * @param {string} param.inviteCode 邀请码
 * @param {string} param.queryUid 受邀人id，非空时校验不可被下家或自己邀请
 * @returns
 */
async function generateInviteInfo ({
  inviteCode,
  queryUid
} = {}) {
  const inviterRecord = await findUserByInviteCode({
    inviteCode,
    queryUid
  })
  // 倒叙拼接当前用户邀请链
  const inviterUid = inviterRecord.inviter_uid || []
  inviterUid.unshift(inviterRecord._id)
  return {
    inviterUid,
    inviteTime: Date.now()
  }
}

/**
 * 检查当前用户是否可以接受邀请，如果可以返回用户记录
 * @param {string} uid
 */
async function checkInviteInfo (uid) {
  // 检查当前用户是否已有邀请人
  const getUserRes = await userCollection.doc(uid).field({
    my_invite_code: true,
    inviter_uid: true
  }).get()
  const userRecord = getUserRes.data[0]
  if (!userRecord) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }
  if (userRecord.inviter_uid && userRecord.inviter_uid.length > 0) {
    throw {
      errCode: ERROR.CHANGE_INVITER_FORBIDDEN
    }
  }
  return userRecord
}

/**
 * 指定用户接受邀请码邀请
 * @param {object} param
 * @param {string} param.uid 用户uid
 * @param {string} param.inviteCode 邀请人的邀请码
 * @returns
 */
async function acceptInvite ({
  uid,
  inviteCode
} = {}) {
  await checkInviteInfo(uid)
  const {
    inviterUid,
    inviteTime
  } = await generateInviteInfo({
    inviteCode,
    queryUid: uid
  })

  if (inviterUid === uid) {
    throw {
      errCode: ERROR.INVALID_INVITE_CODE
    }
  }

  // 更新当前用户的邀请人信息
  await userCollection.doc(uid).update({
    inviter_uid: inviterUid,
    invite_time: inviteTime
  })

  // 更新当前用户邀请的用户的邀请人信息，这步可能较为耗时
  await userCollection.where({
    inviter_uid: uid
  }).update({
    inviter_uid: dbCmd.push(inviterUid)
  })

  return {
    errCode: 0,
    errMsg: ''
  }
}

module.exports = {
  acceptInvite,
  generateInviteInfo,
  getValidInviteCode
}
