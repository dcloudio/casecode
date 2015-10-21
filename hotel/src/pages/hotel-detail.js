define(function(require, exports, module) {
	var pageHepler = require('../common/page-helper');
	var roomTypeFilter = require('../controls/room-type-filter/main');
	var bookingDate = require('../controls/booking-date/main');
	var self = exports;

	self.el = {
		header: 'header.mui-bar',
		list: '#list'
	};

	//打开地图
	self.openMap = function() {
		mui.plusReady(function() {
			// 设置目标位置坐标点和其实位置坐标点
			var dst = new plus.maps.Point(39.906016, 116.3977); // 天安门 
			var src = new plus.maps.Point(39.967846, 116.337984); // 大钟寺
			// 调用系统地图显示 
			plus.maps.openSysMap(dst, "天安门", src);
		});
	};

	//设定价格类型
	self.setPriceType = function() {
		if (self.ptPicker == null) {
			self.ptPicker = new mui.PopPicker();
			self.ptPicker.setData([{
				text: "返前价"
			}, {
				text: "原价"
			}]);
		}
		self.ptPicker.show(function() {

		});
	};

	//选择房间类型                     
	self.setRoomType = function() {
		roomTypeFilter.show();
	};

	self.setBookingDate = function() {
		bookingDate.show();
	};

	pageHepler.init({
		handler: self
	});
});