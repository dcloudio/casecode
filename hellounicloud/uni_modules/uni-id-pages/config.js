export default {
  // 调试模式
  debug: false,
  /*
		登录类型 未列举到的或运行环境不支持的，将被自动隐藏。
		如果需要在不同平台有不同的配置，直接用条件编译即可
	*/
  isAdmin: false, // 区分管理端与用户端
  loginTypes: [
    // "qq",
    // "xiaomi",
    // "sinaweibo",
    // "taobao",
    // "facebook",
    // "google",
    // "alipay",
    // "douyin",

    // #ifdef APP
    'univerify',
    // #endif
    // #ifndef MP-HARMONY
    'weixin',
    // #endif
    'username',
    // #ifdef APP
    'apple',
    // #endif
    'smsCode',
    // #ifdef APP-HARMONY || MP-HARMONY
    'huawei',
    'huaweiMobile'
    // #endif
  ],
  // 政策协议
  agreements: {
    serviceUrl: 'https://xxx', // 用户服务协议链接
    privacyUrl: 'https://xxx', // 隐私政策条款链接
    huaweiConsumerPrivacyUrl: 'https://privacy.consumer.huawei.com/legal/id/authentication-terms.htm?code=CN&language=zh-CN', // 华为账号用户认证协议
    // 哪些场景下显示，1.注册（包括登录并注册，如：微信登录、苹果登录、短信验证码登录）、2.登录（如：用户名密码登录）
    scope: [
      'register', 'login', 'realNameVerify'
    ]
  },
  // 提供各类服务接入（如微信登录服务）的应用id
  appid: {
    weixin: {
      // 微信公众号的appid，来源:登录微信公众号（https://mp.weixin.qq.com）-> 设置与开发 -> 基本配置 -> 公众号开发信息 -> AppID
      h5: 'xxxxxx',
      // 微信开放平台的appid，来源:登录微信开放平台（https://open.weixin.qq.com） -> 管理中心 -> 网站应用 -> 选择对应的应用名称，点击查看 -> AppID
      web: 'xxxxxx'
    }
  },
  /**
	 * 密码强度
	 * super（超强：密码必须包含大小写字母、数字和特殊符号，长度范围：8-16位之间）
	 * strong（强: 密密码必须包含字母、数字和特殊符号，长度范围：8-16位之间）
	 * medium (中：密码必须为字母、数字和特殊符号任意两种的组合，长度范围：8-16位之间)
	 * weak（弱：密码必须包含字母和数字，长度范围：6-16位之间）
	 * 为空或false则不验证密码强度
	 */
  passwordStrength: 'medium',
  /**
	 * 登录后允许用户设置密码（只针对未设置密码得用户）
	 * 开启此功能将 setPasswordAfterLogin 设置为 true 即可
	 * "setPasswordAfterLogin": false
	 *
	 * 如果允许用户跳过设置密码 将 allowSkip 设置为 true
	 * "setPasswordAfterLogin": {
	 *   "allowSkip": true
	 * }
	 * */
  setPasswordAfterLogin: false
}
