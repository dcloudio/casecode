define(function(require, exports, module) {
	var self = module.exports;

	self.createInner = function() {
		mui.plusReady(function() {
			if (!self.childView) {
				self.childView = plus.webview.create(null, 'tmpl-head-inner', {
					top: "44px",
					bottom: "0px"
				});
				plus.webview.currentWebview().append(self.childView);
			}
			self.childView.loadURL("http://www.baidu.com/");
		});
	};
	self.createInner();

	window.addEventListener('ct-show', function(event) {

	});
});