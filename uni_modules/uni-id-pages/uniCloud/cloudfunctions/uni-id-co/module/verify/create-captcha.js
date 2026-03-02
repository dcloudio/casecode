const {
  CAPTCHA_SCENE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

/**
 * 创建图形验证码
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#create-captcha
 * @param {Object} params
 * @param {String} params.scene   图形验证码使用场景
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    scene: 'string'
  }
  this.middleware.validate(params, schema)

  const { deviceId, platform } = this.getUniversalClientInfo()
  const {
    scene
  } = params
  if (!(Object.values(CAPTCHA_SCENE).includes(scene))) {
    throw {
      errCode: ERROR.INVALID_PARAM
    }
  }
  return this.uniCaptcha.create({
    deviceId,
    scene,
    uniPlatform: platform
  })
}
