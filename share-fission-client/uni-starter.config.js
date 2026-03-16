//这是应用的配置页面，App.vue挂载到getApp().globalData.config
export default {
	"h5": {
		"url": "https://uni-starter.dcloud.net.cn", //	前端网页托管的域名	
		 // 在h5端全局悬浮引导用户下载app的功能 更多自定义要求在/common/openApp.js中修改	
		"openApp": { //如不需要本功能直接移除本节点即可	
			// //点击悬浮下载栏后打开的网页链接
			// "openUrl": '/#/pages/ucenter/invite/invite',
			// //左侧显示的应用名称	
			// "appname": 'uni-starter',
			// //应用的图标	
			// "logo": './static/logo.png',
		}
	},
	"mp": {
		"weixin": {
			//微信小程序原始id，微信小程序分享时
			"id": ""
		}
	},
	//关于应用
	"about": {
		//应用名称
		"appName": "uni-starter",
		//应用logo
		"logo": "/static/logo.png",
		//公司名称
		"company": "北京xx网络技术有限公司",
		//口号
		"slogan": "云端一体应用快速开发模版",
		//应用的链接，用于分享到第三方平台和生成关于我们页的二维码
		"download": "https://itunes.apple.com/cn/app/hello-uni-app/id1417078253?mt=8",
		//version
		"version":"1.0.0" //用于非app端显示，app端自动获取
	},
	"download":{ //用于生成二合一下载页面
		"ios":"https://itunes.apple.com/cn/app/hello-uni-app/id1417078253?mt=8",
		"android":"https://vkceyugu.cdn.bspapp.com/VKCEYUGU-97fca9f2-41f6-449f-a35e-3f135d4c3875/6d754387-a6c3-48ed-8ad2-e8f39b40fc01.apk"
	},
	//用于打开应用市场评分界面
	"marketId":{
		"ios":"",
		"android":""
	},
	//广告配置
	"ad":{
		//激励视频广告位ID
		"rewardedVideo": "1282424243"
	}
}