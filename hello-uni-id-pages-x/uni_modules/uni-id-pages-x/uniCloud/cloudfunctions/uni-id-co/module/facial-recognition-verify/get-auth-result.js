const { userCollection, REAL_NAME_STATUS, frvLogsCollection } = require('../../common/constants')
const { dataDesensitization, catchAwait } = require('../../common/utils')
const { encryptData, decryptData } = require('../../common/sensitive-aes-cipher')
const { ERROR } = require('../../common/error')

/**
 * 查询认证结果
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-frv-auth-result
 * @param {Object} params
 * @param {String} params.certifyId       认证ID
 * @returns
 */
module.exports = async function (params) {
  const schema = {
    certifyId: 'string'
  }

  this.middleware.validate(params, schema)

  const { uid } = this.authInfo // 从authInfo中取出uid属性
  const { certifyId } = params // 从params中取出certifyId属性

  const user = await userCollection.doc(uid).get() // 根据uid查询用户信息
  const userInfo = user.data && user.data[0] // 从查询结果中获取userInfo对象

  // 如果用户不存在，抛出账户不存在的错误
  if (!userInfo) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }

  const { realname_auth: realNameAuth = {} } = userInfo

  // 如果用户已经实名认证，抛出已实名认证的错误
  if (realNameAuth.auth_status === REAL_NAME_STATUS.CERTIFIED) {
    throw {
      errCode: ERROR.REAL_NAME_VERIFIED
    }
  }

  // 初始化实人认证服务
  const frvManager = uniCloud.getFacialRecognitionVerifyManager({
    requestId: this.getUniCloudRequestId()
  })

  // 调用frvManager的getAuthResult方法，获取认证结果
  const [error, res] = await catchAwait(frvManager.getAuthResult({
    certifyId
  }))

  // 如果出现错误，抛出未知错误并打印日志
  if (error) {
    console.log(ERROR.UNKNOWN_ERROR, 'error: ', error)
    throw error
  }

  // 如果认证状态为“PROCESSING”，抛出认证正在处理中的错误
  if (res.authState === 'PROCESSING') {
    throw {
      errCode: ERROR.FRV_PROCESSING
    }
  }

  // 如果认证状态为“FAIL”，更新认证日志的状态并抛出认证失败的错误
  if (res.authState === 'FAIL') {
    await frvLogsCollection.where({
      certify_id: certifyId
    }).update({
      status: REAL_NAME_STATUS.CERTIFY_FAILED
    })

    console.log(ERROR.FRV_FAIL, 'error: ', res)
    throw {
      errCode: ERROR.FRV_FAIL
    }
  }

  // 如果认证状态不为“SUCCESS”，抛出未知错误并打印日志
  if (res.authState !== 'SUCCESS') {
    console.log(ERROR.UNKNOWN_ERROR, 'source res: ', res)
    throw {
      errCode: ERROR.UNKNOWN_ERROR
    }
  }

  // 根据certifyId查询认证记录
  const frvLogs = await frvLogsCollection.where({
    certify_id: certifyId
  }).get()

  const log = frvLogs.data && frvLogs.data[0]

  const updateData = {
    realname_auth: {
      auth_status: REAL_NAME_STATUS.CERTIFIED,
      real_name: log.real_name,
      identity: log.identity,
      auth_date: Date.now(),
      type: 0
    }
  }

  // 如果获取到了认证照片的地址，则会对其进行下载，并使用uniCloud.uploadFile方法将其上传到云存储，并将上传后的fileID保存起来。
  if (res.pictureUrl) {
    const pictureRes = await uniCloud.httpclient.request(res.pictureUrl)
    if (pictureRes.status < 400) {
      const {
        fileID
      } = await uniCloud.uploadFile({
        cloudPath: `user/id-card/${uid}.b64`,
        cloudPathAsRealPath: true,
        fileContent: Buffer.from(encryptData.call(this, pictureRes.data.toString('base64')))
      })
      updateData.realname_auth.in_hand = fileID
    }
  }

  await Promise.all([
    // 更新用户认证状态
    userCollection.doc(uid).update(updateData),
    // 更新实人认证记录状态
    frvLogsCollection.where({
      certify_id: certifyId
    }).update({
      status: REAL_NAME_STATUS.CERTIFIED
    })
  ])

  return {
    errCode: 0,
    authStatus: REAL_NAME_STATUS.CERTIFIED,
    realName: dataDesensitization(decryptData.call(this, log.real_name), { onlyLast: true }), // 对姓名进行脱敏处理
    identity: dataDesensitization(decryptData.call(this, log.identity)) // 对身份证号进行脱敏处理
  }
}
