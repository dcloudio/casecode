define(function(require, exports, module) {
	var pageHepler = require('../common/page-helper');
	var priceDetail = require("../controls/price-detail/main");
	var bookingDate = require('../controls/booking-date/main');

	var self = exports;

	self.setArrivalTime = function() {
		if (!self.atPicker) {
			self.atPicker = new mui.PopPicker();
			self.atPicker.setData([{
				text: "23点前"
			}, {
				text: "22点前"
			}]);
		}
		self.atPicker.show(function() {});
	};

	self.setInvoice = function() {
		if (!self.iPicker) {
			self.iPicker = new mui.PopPicker();
			self.iPicker.setData([{
				text: "不需要"
			}, {
				text: "到店领取"
			}]);
		}
		self.iPicker.show(function() {});
	};

	self.setRequirement = function() {
		if (window.plus) {
			plus.nativeUI.prompt("请填写您的要求", function() {
				//TODO: 
			}, "特殊要求", "", ["确认", "取消"]);
		} else {
			var rs = prompt("请填写您的要求");
			//TODO:
		}
	};

	self.showPriceDetail = function() {
		priceDetail.show();
	};
	
	self.setBookingDate = function() {
		bookingDate.show();
	};

	pageHepler.init({
		handler: self
	});
});