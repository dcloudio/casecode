define(function(require, exports, module) {

	mui.init();

	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');
	var hotelPriceFilter = require('../controls/hotel-price-filter/main');

	var self = exports;

	self.createInnerList = function() {
		mui.plusReady(function() {
			plus.webview.currentWebview().append(plus.webview.create('./hotel-list-inner.html', 'hotel-list-inner', {
				top: "77px", 
				bottom: "0px"
			})); 
		}); 
	};
	self.createInnerList();

	pageHepler.init({
		handler: self
	});

});