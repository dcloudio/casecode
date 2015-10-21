define(function(require, exports, module) {

	mui.init();

	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');
	var hotelPriceFilter = require('../controls/hotel-price-filter/main');

	var self = exports;

	self.pickWelcomeDegree = function() {
		if (self.wdPicker == null) {
			self.wdPicker = new mui.PopPicker();
			self.wdPicker.setData([{
				text: "默认排序"
			}, {
				text: "评分 高→低"
			}, {
				text: "价格 低→高"
			}, {
				text: "价格 高→低"
			}, {
				text: "距离 近→远"
			}]);
		}
		self.wdPicker.show(function() {

		});
	};

	//设置价格过滤条件
	self.setPriceFilter = function() {
		hotelPriceFilter.show();
	};

	pageHepler.init({
		handler: self
	});

});