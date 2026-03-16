const {
  sendSmsCode
} = require('../../lib/utils/sms')
const {
  verifyCaptcha
} = require('../../lib/utils/captcha')
const {
  SMS_SCENE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')

/**
 * 发送短信验证码
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#send-sms-code
 * @param {Object} params
 * @param {String} params.mobile    手机号
 * @param {String} params.captcha   图形验证码
 * @param {String} params.scene     短信验证码使用场景
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    mobile: 'mobile',
    captcha: 'string',
    scene: 'string'
  }
  this.middleware.validate(params, schema)
  const {
    mobile,
    captcha,
    scene
  } = params
  if (!(Object.values(SMS_SCENE).includes(scene))) {
    throw {
      errCode: ERROR.INVALID_PARAM
    }
  }
  await verifyCaptcha.call(this, {
    scene: 'send-sms-code',
    captcha
  })

  // -- 测试代码
  const {
    templateId
  } = (this.config.service &&
    this.config.service.sms &&
    this.config.service.sms.scene &&
    this.config.service.sms.scene[scene]) || {}
  if (!templateId || !templateId.replace(/[^0-9a-zA-Z]/g, '')) {
    await require('../../lib/utils/verify-code')
      .setMobileVerifyCode.call(this, {
        mobile: params.mobile,
        code: '123456',
        expiresIn: 180,
        scene
      })
    return {
      errCode: 'uni-id-invalid-sms-template-id',
      errMsg: `未找到scene=${scene},的短信模版templateId。\n已启动测试模式，直接使用：123456作为短信验证码即可。\n如果是正式项目，请在路径：/common/uni-config-center/uni-id/config.json中service->sms中配置密钥等信息\n更多详情：https://uniapp.dcloud.io/uniCloud/uni-id.html#config`
    }
  }
  // -- 测试代码

  return sendSmsCode.call(this, {
    mobile,
    scene
  })
}
