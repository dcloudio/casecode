const {
  ERROR
} = require('../../common/error')

async function getNeedCaptcha ({
  uid,
  username,
  mobile,
  email,
  type = 'login',
  limitDuration = 7200000, // 两小时
  limitTimes = 3 // 记录次数
} = {}) {
  const db = uniCloud.database()
  const dbCmd = db.command
  // 当用户最近“2小时内(limitDuration)”登录失败达到3次(limitTimes)时。要求用户提交验证码
  const now = Date.now()
  const uniIdLogCollection = db.collection('uni-id-log')
  const userIdentifier = {
    user_id: uid,
    username,
    mobile,
    email
  }

  let totalKey = 0; let deleteKey = 0
  for (const key in userIdentifier) {
    totalKey++
    if (!userIdentifier[key] || typeof userIdentifier[key] !== 'string') {
      deleteKey++
      delete userIdentifier[key]
    }
  }

  if (deleteKey === totalKey) {
    throw new Error('System error') // 正常情况下不会进入此条件，但是考虑到后续会有其他开发者修改此云对象，在此处做一个判断
  }

  const {
    data: recentRecord
  } = await uniIdLogCollection.where({
    ip: this.getUniversalClientInfo().clientIP,
    ...userIdentifier,
    type,
    create_date: dbCmd.gt(now - limitDuration)
  })
    .orderBy('create_date', 'desc')
    .limit(limitTimes)
    .get()
  return recentRecord.length === limitTimes && recentRecord.every(item => item.state === 0)
}

async function verifyCaptcha (params = {}) {
  const {
    captcha,
    scene
  } = params
  if (!captcha) {
    throw {
      errCode: ERROR.CAPTCHA_REQUIRED
    }
  }
  const payload = await this.uniCaptcha.verify({
    deviceId: this.getUniversalClientInfo().deviceId,
    captcha,
    scene
  })
  if (payload.errCode) {
    throw payload
  }
}

module.exports = {
  getNeedCaptcha,
  verifyCaptcha
}
