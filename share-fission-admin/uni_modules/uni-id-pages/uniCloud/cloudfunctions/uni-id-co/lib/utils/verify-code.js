const {
  dbCmd,
  verifyCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  getVerifyCode
} = require('../../common/utils')

async function setVerifyCode ({
  mobile,
  email,
  code,
  expiresIn,
  scene
} = {}) {
  const now = Date.now()
  const record = {
    mobile,
    email,
    scene,
    code: code || getVerifyCode(),
    state: 0,
    ip: this.getUniversalClientInfo().clientIP,
    created_date: now,
    expired_date: now + expiresIn * 1000
  }
  await verifyCollection.add(record)
  return {
    errCode: 0
  }
}

async function setEmailVerifyCode ({
  email,
  code,
  expiresIn,
  scene
} = {}) {
  email = email && email.trim()
  if (!email) {
    throw {
      errCode: ERROR.INVALID_EMAIL
    }
  }
  email = email.toLowerCase()
  return setVerifyCode.call(this, {
    email,
    code,
    expiresIn,
    scene
  })
}

async function setMobileVerifyCode ({
  mobile,
  code,
  expiresIn,
  scene
} = {}) {
  mobile = mobile && mobile.trim()
  if (!mobile) {
    throw {
      errCode: ERROR.INVALID_MOBILE
    }
  }
  return setVerifyCode.call(this, {
    mobile,
    code,
    expiresIn,
    scene
  })
}

async function verifyEmailCode ({
  email,
  code,
  scene
} = {}) {
  email = email && email.trim()
  if (!email) {
    throw {
      errCode: ERROR.INVALID_EMAIL
    }
  }
  email = email.toLowerCase()
  const {
    data: codeRecord
  } = await verifyCollection.where({
    email,
    scene,
    code,
    state: 0,
    expired_date: dbCmd.gt(Date.now())
  }).limit(1).get()

  if (codeRecord.length === 0) {
    throw {
      errCode: ERROR.EMAIL_VERIFY_CODE_ERROR
    }
  }
  await verifyCollection.doc(codeRecord[0]._id).update({
    state: 1
  })
  return {
    errCode: 0
  }
}

async function verifyMobileCode ({
  mobile,
  code,
  scene
} = {}) {
  mobile = mobile && mobile.trim()
  if (!mobile) {
    throw {
      errCode: ERROR.INVALID_MOBILE
    }
  }
  const {
    data: codeRecord
  } = await verifyCollection.where({
    mobile,
    scene,
    code,
    state: 0,
    expired_date: dbCmd.gt(Date.now())
  }).limit(1).get()

  if (codeRecord.length === 0) {
    throw {
      errCode: ERROR.MOBILE_VERIFY_CODE_ERROR
    }
  }

  await verifyCollection.doc(codeRecord[0]._id).update({
    state: 1
  })
  return {
    errCode: 0
  }
}

module.exports = {
  verifyEmailCode,
  verifyMobileCode,
  setEmailVerifyCode,
  setMobileVerifyCode
}
