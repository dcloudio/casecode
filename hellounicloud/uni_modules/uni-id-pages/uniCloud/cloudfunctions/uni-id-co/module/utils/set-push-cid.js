const {
  deviceCollection
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

async function setOpendbDevice ({
  pushClientId
} = {}) {
  // 仅新增，如果存在进行更新操作
  const {
    appId,
    deviceId,
    deviceBrand,
    deviceModel,
    osName,
    osVersion,
    osLanguage,
    osTheme,
    devicePixelRatio,
    windowWidth,
    windowHeight,
    screenWidth,
    screenHeight,
    romName,
    romVersion
  } = this.getUniversalClientInfo()
  const platform = this.clientPlatform
  const now = Date.now()

  const db = uniCloud.database()
  const opendbDeviceCollection = db.collection('opendb-device')
  const getDeviceRes = await opendbDeviceCollection.where({
    device_id: deviceId
  }).get()
  const data = {
    appid: appId,
    device_id: deviceId,
    vendor: deviceBrand,
    model: deviceModel,
    uni_platform: platform,
    os_name: osName,
    os_version: osVersion,
    os_language: osLanguage,
    os_theme: osTheme,
    pixel_ratio: devicePixelRatio,
    window_width: windowWidth,
    window_height: windowHeight,
    screen_width: screenWidth,
    screen_height: screenHeight,
    rom_name: romName,
    rom_version: romVersion,
    last_update_date: now,
    push_clientid: pushClientId
  }
  if (getDeviceRes.data.length > 0) {
    await opendbDeviceCollection.where({
      device_id: deviceId
    }).update(data)
    return
  }
  data.create_date = now
  await opendbDeviceCollection.add(data)
}

/**
 * 更新device表的push_clien_id
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-push-cid
 * @param {object} params
 * @param {string} params.pushClientId  客户端pushClientId
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    pushClientId: 'string'
  }
  this.middleware.validate(params, schema)
  const {
    deviceId,
    appId,
    osName
  } = this.getUniversalClientInfo()
  let platform = this.clientPlatform
  if (platform === 'app') {
    platform += osName
  }

  const {
    uid,
    exp
  } = this.authInfo
  const { pushClientId } = params
  const tokenExpired = exp * 1000
  const getDeviceRes = await deviceCollection.where({
    device_id: deviceId
  }).get()
  // console.log(getDeviceRes)
  if (getDeviceRes.data.length > 1) {
    return {
      errCode: ERROR.SYSTEM_ERROR
    }
  }
  const deviceRecord = getDeviceRes.data[0]
  await setOpendbDevice.call(this, {
    pushClientId
  })
  if (!deviceRecord) {
    await deviceCollection.add({
      user_id: uid,
      device_id: deviceId,
      token_expired: tokenExpired,
      push_clientid: pushClientId,
      appid: appId
    })
    return {
      errCode: 0
    }
  }

  await deviceCollection.where({
    device_id: deviceId
  }).update({
    user_id: uid,
    token_expired: tokenExpired,
    push_clientid: pushClientId,
    appid: appId
  })
  return {
    errCode: 0
  }
}
