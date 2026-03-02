const uniIdCommon = require('uni-id-common')
const uniCaptcha = require('uni-captcha')
const {
  getType,
  checkIdCard
} = require('./common/utils')
const {
  checkClientInfo,
  Validator
} = require('./common/validator')
const ConfigUtils = require('./lib/utils/config')
const {
  isUniIdError,
  ERROR
} = require('./common/error')
const middleware = require('./middleware/index')
const universal = require('./common/universal')

const {
  registerAdmin,
  registerUser,
  registerUserByEmail
} = require('./module/register/index')
const {
  addUser,
  updateUser
} = require('./module/admin/index')
const {
  login,
  loginBySms,
  loginByUniverify,
  loginByWeixin,
  loginByAlipay,
  loginByQQ,
  loginByApple,
  loginByWeixinMobile,
  loginByHuawei,
  loginByHuaweiMobile
} = require('./module/login/index')
const {
  logout
} = require('./module/logout/index')
const {
  bindMobileBySms,
  bindMobileByUniverify,
  bindMobileByMpWeixin,
  bindAlipay,
  bindApple,
  bindQQ,
  bindWeixin,
  unbindWeixin,
  unbindAlipay,
  unbindQQ,
  unbindApple,
  bindHuawei,
  unbindHuawei,
  bindMobileByHuawei
} = require('./module/relate/index')
const {
  setPwd,
  updatePwd,
  resetPwdBySms,
  resetPwdByEmail,
  closeAccount,
  getAccountInfo,
  getRealNameInfo
} = require('./module/account/index')
const {
  createCaptcha,
  refreshCaptcha,
  sendSmsCode,
  sendEmailCode
} = require('./module/verify/index')
const {
  refreshToken,
  setPushCid,
  secureNetworkHandshakeByWeixin
} = require('./module/utils/index')
const {
  getInvitedUser,
  acceptInvite
} = require('./module/fission')
const {
  authorizeAppLogin,
  removeAuthorizedApp,
  setAuthorizedApp
} = require('./module/multi-end')
const {
  getSupportedLoginType
} = require('./module/dev/index')
const {
  externalRegister,
  externalLogin,
  updateUserInfoByExternal
} = require('./module/external')
const {
  getFrvCertifyId,
  getFrvAuthResult
} = require('./module/facial-recognition-verify')

module.exports = {
  async _before () {
    // 支持 callFunction 与 URL化
    universal.call(this)

    const clientInfo = this.getUniversalClientInfo()
    /**
     * 检查clientInfo，无appId和uniPlatform时本云对象无法正常运行
     * 此外需要保证用到的clientInfo字段均经过类型检查
     * clientInfo由客户端上传并非完全可信，clientInfo内除clientIP、userAgent、source外均为客户端上传参数
     * 否则可能会出现一些意料外的情况
     */
    checkClientInfo(clientInfo)
    let clientPlatform = clientInfo.uniPlatform
    // 统一platform名称
    switch (clientPlatform) {
      case 'app':
      case 'app-plus':
      case 'app-android':
      case 'app-ios':
        clientPlatform = 'app'
        break
      case 'web':
      case 'h5':
        clientPlatform = 'web'
        break
      default:
        break
    }

    this.clientPlatform = clientPlatform

    // 挂载uni-id实例到this上，方便后续调用
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo
    })

    // 包含uni-id配置合并等功能的工具集
    this.configUtils = new ConfigUtils({
      context: this
    })
    this.config = this.configUtils.getPlatformConfig()
    this.hooks = this.configUtils.getHooks()

    this.validator = new Validator({
      passwordStrength: this.config.passwordStrength
    })

    // 扩展 validator 增加 验证身份证号码合法性
    this.validator.mixin('idCard', function (idCard) {
      if (!checkIdCard(idCard)) {
        return {
          errCode: ERROR.INVALID_ID_CARD
        }
      }
    })
    this.validator.mixin('realName', function (realName) {
      if (
        typeof realName !== 'string' ||
        realName.length < 2 ||
        !/^[\u4e00-\u9fa5]{1,10}(·?[\u4e00-\u9fa5]{1,10}){0,5}$/.test(realName)
      ) {
        return {
          errCode: ERROR.INVALID_REAL_NAME
        }
      }
    })
    /**
     * 示例：覆盖密码验证规则
     */
    // this.validator.mixin('password', function (password) {
    //   if (typeof password !== 'string' || password.length < 10) {
    //     // 调整为密码长度不能小于10
    //     return {
    //       errCode: ERROR.INVALID_PASSWORD
    //     }
    //   }
    // })
    /**
     * 示例：新增验证规则
     */
    // this.validator.mixin('timestamp', function (timestamp) {
    //   if (typeof timestamp !== 'number' || timestamp > Date.now()) {
    //     return {
    //       errCode: ERROR.INVALID_PARAM
    //     }
    //   }
    // })
    // // 新增规则同样可以在数组验证规则中使用
    // this.validator.validate({
    //   timestamp: 123456789
    // }, {
    //   timestamp: 'timestamp'
    // })
    // this.validator.validate({
    //   timestampList: [123456789, 123123123123]
    // }, {
    //   timestampList: 'array<timestamp>'
    // })
    // // 甚至更复杂的写法
    // this.validator.validate({
    //   timestamp: [123456789123123123, 123123123123]
    // }, {
    //   timestamp: 'timestamp|array<timestamp|number>'
    // })

    // 挂载uni-captcha到this上，方便后续调用
    this.uniCaptcha = uniCaptcha
    Object.defineProperty(this, 'uniOpenBridge', {
      get () {
        return require('uni-open-bridge-common')
      }
    })

    // 挂载中间件
    this.middleware = {}
    for (const mwName in middleware) {
      this.middleware[mwName] = middleware[mwName].bind(this)
    }

    // 国际化
    const messages = require('./lang/index')
    const fallbackLocale = 'zh-Hans'
    const i18n = uniCloud.initI18n({
      locale: clientInfo.locale,
      fallbackLocale,
      messages: JSON.parse(JSON.stringify(messages))
    })
    if (!messages[i18n.locale]) {
      i18n.setLocale(fallbackLocale)
    }
    this.t = i18n.t.bind(i18n)

    this.response = {}

    // 请求鉴权验证
    await this.middleware.verifyRequestSign()

    // 通用权限校验模块
    await this.middleware.accessControl()
  },
  _after (error, result) {
    if (error) {
      // 处理中间件内抛出的标准响应对象
      if (error.errCode && getType(error) === 'object') {
        const errCode = error.errCode
        if (!isUniIdError(errCode)) {
          return error
        }
        return {
          errCode,
          errMsg: error.errMsg || this.t(errCode, error.errMsgValue)
        }
      }
      throw error
    }
    return Object.assign(this.response, result)
  },
  /**
   * 注册管理员
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#register-admin
   * @param {Object} params
   * @param {String} params.username   用户名
   * @param {String} params.password   密码
   * @param {String} params.nickname   昵称
   * @returns
   */
  registerAdmin,
  /**
   * 新增用户
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#add-user
   * @param {Object}  params
   * @param {String}  params.username       用户名
   * @param {String}  params.password       密码
   * @param {String}  params.nickname       昵称
   * @param {Array}   params.authorizedApp  允许登录的AppID列表
   * @param {Array}   params.role           用户角色列表
   * @param {String}  params.mobile         手机号
   * @param {String}  params.email          邮箱
   * @param {Array}   params.tags           用户标签
   * @param {Number}  params.status         用户状态
   * @returns
   */
  addUser,
  /**
   * 修改用户
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#update-user
   * @param {Object}  params
   * @param {String} params.id              要更新的用户id
   * @param {String}  params.username       用户名
   * @param {String}  params.password       密码
   * @param {String}  params.nickname       昵称
   * @param {Array}   params.authorizedApp  允许登录的AppID列表
   * @param {Array}   params.role           用户角色列表
   * @param {String} params.mobile          手机号
   * @param {String} params.email           邮箱
   * @param {Array}  params.tags            用户标签
   * @param {Number} params.status          用户状态
   * @returns
   */
  updateUser,
  /**
   * 授权用户登录应用
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#authorize-app-login
   * @param {Object} params
   * @param {String} params.uid   用户id
   * @param {String} params.appId 授权的应用的AppId
   * @returns
   */
  authorizeAppLogin,
  /**
   * 移除用户登录授权
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#remove-authorized-app
   * @param {Object} params
   * @param {String} params.uid   用户id
   * @param {String} params.appId 取消授权的应用的AppId
   * @returns
   */
  removeAuthorizedApp,
  /**
   * 设置用户允许登录的应用列表
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-authorized-app
   * @param {Object} params
   * @param {String} params.uid       用户id
   * @param {Array} params.appIdList 允许登录的应用AppId列表
   * @returns
   */
  setAuthorizedApp,
  /**
   * 注册普通用户
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#register-user
   * @param {Object} params
   * @param {String} params.username    用户名
   * @param {String} params.password    密码
   * @param {String} params.captcha     图形验证码
   * @param {String} params.nickname    昵称
   * @param {String} params.inviteCode  邀请码
   * @returns
   */
  registerUser,
  /**
   * 通过邮箱+验证码注册用户
   * @param {Object} params
   * @param {String} params.email    邮箱
   * @param {String} params.password      密码
   * @param {String} params.nickname    昵称
   * @param {String} params.code  邮箱验证码
   * @param {String} params.inviteCode  邀请码
   * @returns
   */
  registerUserByEmail,
  /**
   * 用户名密码登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login
   * @param {Object} params
   * @param {String} params.username  用户名
   * @param {String} params.mobile    手机号
   * @param {String} params.email     邮箱
   * @param {String} params.password  密码
   * @param {String} params.captcha   图形验证码
   * @returns
   */
  login,
  /**
   * 短信验证码登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-sms
   * @param {Object} params
   * @param {String} params.mobile      手机号
   * @param {String} params.code        短信验证码
   * @param {String} params.captcha     图形验证码
   * @param {String} params.inviteCode  邀请码
   * @returns
   */
  loginBySms,
  /**
   * App端一键登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-univerify
   * @param {Object} params
   * @param {String} params.access_token  APP端一键登录返回的access_token
   * @param {String} params.openid        APP端一键登录返回的openid
   * @param {String} params.inviteCode    邀请码
   * @returns
   */
  loginByUniverify,
  /**
   * 微信登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-weixin
   * @param {Object} params
   * @param {String} params.code          微信登录返回的code
   * @param {String} params.inviteCode    邀请码
   * @returns
   */
  loginByWeixin,
  /**
   * 支付宝登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-alipay
   * @param {Object} params
   * @param {String} params.code        支付宝小程序客户端登录返回的code
   * @param {String} params.inviteCode  邀请码
   * @returns
   */
  loginByAlipay,
  /**
   * QQ登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-qq
   * @param {Object} params
   * @param {String} params.code                  QQ小程序登录返回的code参数
   * @param {String} params.accessToken           App端QQ登录返回的accessToken参数
   * @param {String} params.accessTokenExpired    accessToken过期时间，由App端QQ登录返回的expires_in参数计算而来，单位：毫秒
   * @param {String} params.inviteCode            邀请码
   * @returns
   */
  loginByQQ,
  /**
   * 苹果登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-apple
   * @param {Object} params
   * @param {String} params.identityToken 苹果登录返回的identityToken
   * @param {String} params.nickname      用户昵称
   * @param {String} params.inviteCode    邀请码
   * @returns
   */
  loginByApple,
  loginByWeixinMobile,
  loginByHuawei,
  loginByHuaweiMobile,
  /**
   * 用户退出登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#logout
   * @returns
   */
  logout,
  /**
   * 通过短信验证码绑定手机号
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-sms
   * @param {Object} params
   * @param {String} params.mobile    手机号
   * @param {String} params.code      短信验证码
   * @param {String} params.captcha   图形验证码
   * @returns
   */
  bindMobileBySms,
  /**
   * 通过一键登录绑定手机号
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-univerify
   * @param {Object} params
   * @param {String} params.openid        APP端一键登录返回的openid
   * @param {String} params.access_token  APP端一键登录返回的access_token
   * @returns
   */
  bindMobileByUniverify,
  /**
   * 通过微信绑定手机号
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-mp-weixin
   * @param {Object} params
   * @param {String} params.encryptedData   微信获取手机号返回的加密信息
   * @param {String} params.iv              微信获取手机号返回的初始向量
   * @returns
   */
  bindMobileByMpWeixin,
  /**
   * 绑定微信
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-weixin
   * @param {Object} params
   * @param {String} params.code  微信登录返回的code
   * @returns
   */
  bindWeixin,
  /**
   * 绑定QQ
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-qq
   * @param {Object} params
   * @param {String} params.code          小程序端QQ登录返回的code
   * @param {String} params.accessToken   APP端QQ登录返回的accessToken
   * @param {String} params.accessTokenExpired    accessToken过期时间，由App端QQ登录返回的expires_in参数计算而来，单位：毫秒
   * @returns
   */
  bindQQ,
  /**
   * 绑定支付宝账号
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-alipay
   * @param {Object} params
   * @param {String} params.code  支付宝小程序登录返回的code参数
   * @returns
   */
  bindAlipay,
  /**
   * 绑定苹果账号
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-apple
   * @param {Object} params
   * @param {String} params.identityToken 苹果登录返回identityToken
   * @returns
   */
  bindApple,
  /**
   * 更新密码
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#update-pwd
   * @param {object} params
   * @param {string} params.oldPassword 旧密码
   * @param {string} params.newPassword 新密码
   * @returns {object}
   */
  updatePwd,
  /**
   * 通过短信验证码重置密码
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#reset-pwd-by-sms
   * @param {object} params
   * @param {string} params.mobile   手机号
   * @param {string} params.mobile   短信验证码
   * @param {string} params.password 密码
   * @param {string} params.captcha  图形验证码
   * @returns {object}
   */
  resetPwdBySms,
  /**
   * 通过邮箱验证码重置密码
   * @param {object} params
   * @param {string} params.email   邮箱
   * @param {string} params.code   邮箱验证码
   * @param {string} params.password 密码
   * @param {string} params.captcha  图形验证码
   * @returns {object}
   */
  resetPwdByEmail,
  /**
   * 注销账户
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#close-account
   * @returns
   */
  closeAccount,
  /**
   * 获取账户账户简略信息
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-account-info
   */
  getAccountInfo,
  /**
   * 创建图形验证码
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#create-captcha
   * @param {Object} params
   * @param {String} params.scene   图形验证码使用场景
   * @returns
   */
  createCaptcha,
  /**
   * 刷新图形验证码
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#refresh-captcha
   * @param {Object} params
   * @param {String} params.scene   图形验证码使用场景
   * @returns
   */
  refreshCaptcha,
  /**
   * 发送短信验证码
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#send-sms-code
   * @param {Object} params
   * @param {String} params.mobile    手机号
   * @param {String} params.captcha   图形验证码
   * @param {String} params.scene     短信验证码使用场景
   * @returns
   */
  sendSmsCode,
  /**
   * 发送邮箱验证码
   * @tutorial 需自行实现功能
   * @param {Object} params
   * @param {String} params.email    邮箱
   * @param {String} params.captcha   图形验证码
   * @param {String} params.scene     短信验证码使用场景
   * @returns
   */
  sendEmailCode,
  /**
   * 刷新token
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#refresh-token
   */
  refreshToken,
  /**
   * 接受邀请
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#accept-invite
   * @param {Object} params
   * @param {String} params.inviteCode  邀请码
   * @returns
   */
  acceptInvite,
  /**
   * 获取受邀用户
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-invited-user
   * @param {Object} params
   * @param {Number} params.level       获取受邀用户的级数，1表示直接邀请的用户
   * @param {Number} params.limit       返回数据大小
   * @param {Number} params.offset      返回数据偏移
   * @param {Boolean} params.needTotal  是否需要返回总数
   * @returns
   */
  getInvitedUser,
  /**
   * 更新device表的push_clien_id
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-push-cid
   * @param {object} params
   * @param {string} params.pushClientId  客户端pushClientId
   * @returns
   */
  setPushCid,
  /**
   * 获取支持的登录方式
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-supported-login-type
   * @returns
   */
  getSupportedLoginType,

  /**
   * 解绑微信
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-weixin
   * @returns
   */
  unbindWeixin,
  /**
   * 解绑支付宝
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-alipay
   * @returns
   */
  unbindAlipay,
  /**
   * 解绑QQ
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-qq
   * @returns
   */
  unbindQQ,
  /**
   * 解绑Apple
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-apple
   * @returns
   */
  unbindApple,
  /**
   * 安全网络握手，目前仅处理微信小程序安全网络握手
   */
  secureNetworkHandshakeByWeixin,
  /**
   * 设置密码
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-pwd
   * @returns
   */
  setPwd,
  /**
   * 外部注册用户
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-register
   * @param {object} params
   * @param {string} params.externalUid   业务系统的用户id
   * @param {string} params.nickname  昵称
   * @param {string} params.gender  性别
   * @param {string} params.avatar  头像
   * @returns {object}
   */
  externalRegister,
  /**
   * 外部用户登录
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-login
   * @param {object} params
   * @param {string} params.userId  uni-id体系用户id
   * @param {string} params.externalUid   业务系统的用户id
   * @returns {object}
   */
  externalLogin,
  /**
   * 使用 userId 或 externalUid 获取用户信息
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-update-userinfo
   * @param {object} params
   * @param {string} params.userId   uni-id体系的用户id
   * @param {string} params.externalUid   业务系统的用户id
   * @param {string} params.nickname  昵称
   * @param {string} params.gender  性别
   * @param {string} params.avatar  头像
   * @returns {object}
   */
  updateUserInfoByExternal,
  /**
   * 获取认证ID
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-frv-certify-id
   * @param {Object} params
   * @param {String} params.realName  真实姓名
   * @param {String} params.idCard    身份证号码
   * @returns
   */
  getFrvCertifyId,
  /**
   * 查询认证结果
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-frv-auth-result
   * @param {Object} params
   * @param {String} params.certifyId       认证ID
   * @param {String} params.needAlivePhoto  是否获取认证照片，Y_O （原始图片）、Y_M（虚化，背景马赛克）、N（不返图）
   * @returns
   */
  getFrvAuthResult,
  /**
   * 获取实名信息
   * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-realname-info
   * @param {Object} params
   * @param {Boolean} params.decryptData 是否解密数据
   * @returns
   */
  getRealNameInfo,
  bindHuawei,
  unbindHuawei,
  bindMobileByHuawei
}
