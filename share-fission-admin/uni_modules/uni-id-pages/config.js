export default {
	//调试模式
	"debug": false,
	/*
		登录类型 未列举到的或运行环境不支持的，将被自动隐藏。
		如果需要在不同平台有不同的配置，直接用条件编译即可
	*/
	"isAdmin": true, // 区分管理端与用户端
	"loginTypes": [
		// "qq",
		// "xiaomi",
		// "sinaweibo",
		// "taobao",
		// "facebook",
		// "google",
		// "alipay",
		// "douyin",

		// #ifdef APP
		"univerify",
		// #endif
		// "weixin",
		"username",
		// #ifdef APP
		"apple",
		// #endif
		// "smsCode"
	],
	//政策协议
	// "agreements": {
	// 	"serviceUrl": "https://xxx", //用户服务协议链接
	// 	"privacyUrl": "https://xxx", //隐私政策条款链接
	// 	// 哪些场景下显示，1.注册（包括登录并注册，如：微信登录、苹果登录、短信验证码登录）、2.登录（如：用户名密码登录）
	// 	"scope": [
	// 		'register', 'login'
	// 	]
	// },
	// 提供各类服务接入（如微信登录服务）的应用id
	"appid": {
		"weixin": {
			// 微信公众号的appid，来源:登录微信公众号（https://mp.weixin.qq.com）-> 设置与开发 -> 基本配置 -> 公众号开发信息 -> AppID
			"h5": "xxxxxx",
			// 微信开放平台的appid，来源:登录微信开放平台（https://open.weixin.qq.com） -> 管理中心 -> 网站应用 -> 选择对应的应用名称，点击查看 -> AppID
			"web": "xxxxxx"
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
	"passwordStrength":"medium"
}
