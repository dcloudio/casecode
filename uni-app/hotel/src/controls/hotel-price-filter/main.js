define(function(require, exports, module) {
	var self = exports;
	var pageHepler = require('../../common/page-helper');
	require('./style.css');
	var $ = require('../../libs/jquery');
	var tp = require('../../libs/tp');

	var uiHtml = require('../../libs/ems-text!./ui.html');
	var ui = $(uiHtml)[0];
	document.body.appendChild(ui);

	ui.addEventListener('touchmove', function(event) {
		event.preventDefault();
	});

	var mask = mui.createMask();
	mask[0].addEventListener('tap', function() {
		self.hide();
	}, false);

	self.show = function(callback) {
		mask.show();
		self.callback = callback;
		ui.classList.add('active');
		//处理物理返回键
		self.__back = mui.back;
		mui.back = function() {
			self.hide();
		};
	};

	self.hide = function() {
		ui.classList.remove('active');
		mask.close();
		self.callback = null;
		//处理物理返回键
		mui.back = self.__back;
	};

	self.ok = function() {
		if (self.callback) {
			self.callback(self);
		}
		self.hide();
	};

	self.priceRanges = [{
		text: '不限',
		value: "0"
	}, {
		text: '￥150以下',
		value: "0-149"
	}, {
		text: '￥150-￥300',
		value: "150-300"
	}, {
		text: '￥301-￥450',
		value: "301-450"
	}, {
		text: '￥451-￥600',
		value: "354-600"
	}, {
		text: '￥601-￥1000',
		value: "601-1000"
	}, {
		text: '￥1000以上',
		value: "1000-∞"
	}];

	self.priceRange = self.priceRanges[0];

	self.pickPriceRange = function(index) {
		self.priceRange = self.priceRanges[index];
	};

	self.starTypes = [{
		text: '不限',
		value: '0'
	}, {
		text: '快捷连锁',
		value: '1'
	}, {
		text: '二星及以下/经济',
		value: '2'
	}, {
		text: '三星/舒适',
		value: '3'
	}, {
		text: '四星/高档',
		value: '4'
	}, {
		text: '五星/豪华',
		value: '5'
	}];

	self.star = self.starTypes[0];

	self.pickStar = function(index) {
		self.star = self.starTypes[index];
	};

	pageHepler.init({
		handler: self,
		holder: ui,
		mvvm: true
	});
});