define(function (require, exports, module) {
	var pageHepler = require('../common/page-helper');
	var self = exports;

	self.cancelOrder = function () {
		if (window.plus) {
			plus.nativeUI.confirm("您确认取消这个订单吗?", function () {
				//TODO: 
			}, "取消订单", ["确认", "取消"]);
		} else {
			var rs = confirm("您确认取消这个订单吗?");
			//TODO:
		}
	};

	pageHepler.init({
		handler: self
	});
});