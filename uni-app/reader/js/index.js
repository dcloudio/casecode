(function($) {
	$.plusReady(function() {
		if ($.os.android) {
			plus.screen.lockOrientation("portrait-primary");
			var version = parseFloat($.os.version);
			if (version < 4.0 || version >= 4.1) {
				plus.webview.currentWebview().setStyle({
					render: "always"
				});
			}
		}
		//初始化webview窗口
		//RSS列表页
		plus.webview.currentWebview().append(plus.webview.create('news.html', 'news', {
			top: "44px",
			bottom: "0px"
		}));
		//RSS详情页
		plus.webview.create('detail_main.html', 'detail_main').append(plus.webview.create('detail.html', 'detail'));
		//设置页
		plus.webview.create('setting.html', 'setting');
		//关于
		plus.webview.create('about.html', 'about');
		//内置浏览器
		plus.webview.create('browser.html', 'browser_main').append(plus.webview.create('', 'browser', {
			top: "0px",
			bottom: "44px"
		}));
	});
})(mui);