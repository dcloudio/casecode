const { userCollection, REAL_NAME_STATUS, frvLogsCollection, dbCmd } = require('../../common/constants')
const { ERROR } = require('../../common/error')
const { encryptData } = require('../../common/sensitive-aes-cipher')
const { getCurrentDateTimestamp } = require('../../common/utils')

// const CertifyIdExpired = 25 * 60 * 1000 // certifyId 过期时间为30分钟，在25分时置为过期

/**
 * 获取认证ID
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-frv-certify-id
 * @param {Object} params
 * @param {String} params.realName  真实姓名
 * @param {String} params.idCard    身份证号码
 * @param {String} params.metaInfo 客户端初始化时返回的metaInfo
 * @returns
 */
module.exports = async function (params) {
  const schema = {
    realName: 'realName',
    idCard: 'idCard',
    metaInfo: 'string'
  }

  this.middleware.validate(params, schema)

  const { realName: originalRealName, idCard: originalIdCard, metaInfo } = params // 解构出传入参数的真实姓名、身份证号码、其他元数据
  const realName = encryptData.call(this, originalRealName) // 对真实姓名进行加密处理
  const idCard = encryptData.call(this, originalIdCard) // 对身份证号码进行加密处理

  const { uid } = this.authInfo // 获取当前用户的 ID
  const idCardCertifyLimit = this.config.idCardCertifyLimit || 1 // 获取身份证认证限制次数，默认为1次
  const realNameCertifyLimit = this.config.realNameCertifyLimit || 5 // 获取实名认证限制次数，默认为5次
  const frvNeedAlivePhoto = this.config.frvNeedAlivePhoto || false // 是否需要拍摄活体照片，默认为 false

  const user = await userCollection.doc(uid).get() // 获取用户信息
  const userInfo = user.data && user.data[0] // 获取用户信息对象中的实名认证信息
  const { realname_auth: realNameAuth = {} } = userInfo // 解构出实名认证信息中的认证状态对象，默认为空对象

  // 如果用户已经实名认证过，不能再次认证
  if (realNameAuth.auth_status === REAL_NAME_STATUS.CERTIFIED) {
    throw {
      errCode: ERROR.REAL_NAME_VERIFIED
    }
  }

  // 查询已经使用同一个身份证认证的账号数量，如果超过限制则不能认证
  const idCardAccount = await userCollection.where({
    realname_auth: {
      type: 0, // 用户认证状态是个人
      auth_status: REAL_NAME_STATUS.CERTIFIED, // 认证状态为已认证
      identity: idCard // 身份证号码和传入参数的身份证号码相同
    }
  }).get()
  if (idCardAccount.data.length >= idCardCertifyLimit) {
    throw {
      errCode: ERROR.ID_CARD_EXISTS
    }
  }

  // 查询用户今天已经进行的实名认证次数，如果超过限制则不能认证
  const userFrvLogs = await frvLogsCollection.where({
    user_id: uid,
    created_date: dbCmd.gt(getCurrentDateTimestamp()) // 查询今天的认证记录
  }).get()

  // 限制用户每日认证次数
  if (userFrvLogs.data && userFrvLogs.data.length >= realNameCertifyLimit) {
    throw {
      errCode: ERROR.REAL_NAME_VERIFY_UPPER_LIMIT
    }
  }

  // 初始化实人认证服务
  const frvManager = uniCloud.getFacialRecognitionVerifyManager({
    requestId: this.getUniCloudRequestId() // 获取当前
  })
  // 调用实人认证服务，获取认证 ID
  const res = await frvManager.getCertifyId({
    realName: originalRealName,
    idCard: originalIdCard,
    needPicture: frvNeedAlivePhoto,
    metaInfo
  })

  // 将认证记录插入到实名认证日志中
  await frvLogsCollection.add({
    user_id: uid,
    certify_id: res.certifyId,
    real_name: realName,
    identity: idCard,
    status: REAL_NAME_STATUS.WAITING_CERTIFIED,
    created_date: Date.now()
  })

  // 返回认证ID
  return {
    certifyId: res.certifyId
  }
}
