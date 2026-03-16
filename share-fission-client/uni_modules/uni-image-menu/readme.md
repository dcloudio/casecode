# uni-image-menu

使用示例：
```
import uniImageMenu from 'uni_modules/uni-image-menu/js_sdk/uni-image-menu.js';
uniImageMenu.show({
	list:[{
			"img": "/static/sharemenu/wechatfriend.png",
			"text": "微信好友"
		},
		{
			"img": "/static/sharemenu/wechatmoments.png",
			"text": "微信朋友圈"
		}],
	cancelText:param.cancelText
}, e => {
	console.log(e)
})
```