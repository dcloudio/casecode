define(function(require, exports, module) {

	//设置状态栏颜色(for ios)
	mui.init({
		"statusBarBackground": "#099FDE"
	});

	mui.plusReady(function() {
		plus.navigator.setStatusBarStyle("UIStatusBarStyleBlackOpaque");
	});

	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');
	var hotelPriceFilter = require('../controls/hotel-price-filter/main');

	var self = exports;

	self.dayNum = 1;
	self.beginDate = utils.formatDate(new Date(), 'yyyy-MM-dd');

	var calcEndDate = function() {
		var endDate = new Date(self.beginDate);
		endDate.setDate(endDate.getDate() + self.dayNum);
		self.endDate = utils.formatDate(endDate, 'yyyy-MM-dd');
	};
	calcEndDate();

	//更改入住天数
	self.changeDayNum = function(event) {
		self.dayNum = parseInt(event.target.value);
		calcEndDate();
	};

	//选择日期
	self.pickeDate = function(event, x) {
		var currentYear = (new Date()).getFullYear();
		self.dtPicker = self.dtPicker || new mui.DtPicker({
			"type": "date",
			"beginYear": currentYear,
			"endYear": currentYear + 1
		});
		self.dtPicker.show(function(rs) {
			self.beginDate = rs.value;
			calcEndDate();
		});
	};

	self.priceRange = hotelPriceFilter.priceRange;
	self.star = hotelPriceFilter.star;

	self.computed = {
		priceAndStar: function() {
			if (self.star.value == 0 &&
				self.priceRange.value == 0) {
				return "价格/星级"
			} else {
				return self.priceRange.text + "," + self.star.text;
			}
		}
	};

	//设置价格过滤条件
	self.setPriceFilter = function() {
		hotelPriceFilter.show(function(rs) {
			self.priceRange = rs.priceRange;
			self.star = rs.star;
		});
	};

	//初始化页面辅助模块
	pageHepler.init({
		handler: self,
		mvvm: true
	});

	mui.plusReady(function() {
		//连续按下两次返回键退出应用
		mui.oldBack = mui.back;
		var backButtonPress = 0;
		mui.back = function() {
			backButtonPress++;
			if (backButtonPress > 1) {
				plus.runtime.quit();
			} else {
				plus.nativeUI.toast('再按一次退出应用', {
					duration: 'short'
				});
			}
			setTimeout(function() {
				backButtonPress = 0;
			}, 1000);
			return false;
		};
		//关闭 splash 画面
		plus.navigator.closeSplashscreen();
	});

});