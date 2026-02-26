const db = uniCloud.database()
module.exports = async function ({
  data = {},
  success = true,
  type = 'login'
} = {}) {
  const now = Date.now()
  const uniIdLogCollection = db.collection('uni-id-log')
  const requiredDataKeyList = ['user_id', 'username', 'email', 'mobile']
  const dataCopy = {}
  for (let i = 0; i < requiredDataKeyList.length; i++) {
    const key = requiredDataKeyList[i]
    if (key in data && typeof data[key] === 'string') {
      dataCopy[key] = data[key]
    }
  }
  const {
    appId,
    clientIP,
    deviceId,
    userAgent
  } = this.getUniversalClientInfo()
  const logData = {
    appid: appId,
    device_id: deviceId,
    ip: clientIP,
    type,
    ua: userAgent,
    create_date: now,
    ...dataCopy
  }

  if (success) {
    logData.state = 1
  } else {
    logData.state = 0
  }
  return uniIdLogCollection.add(logData)
}
