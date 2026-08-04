/* global mui */
define(function (require, exports, module) {
	var self = exports;
	var pageHepler = require('../../common/page-helper');
	require('./style.css');
	var $ = require('../../libs/jquery');
	var tp = require('../../libs/tp');

	var uiHtml = require('../../libs/ems-text!./ui.html');
	var ui = $(uiHtml)[0];
	document.body.appendChild(ui);

	ui.addEventListener('touchmove', function (event) {
		event.preventDefault();
	});

	var mask = mui.createMask();
	mask[0].addEventListener('tap', function () {
		self.hide();
	}, false);

	self.show = function (callback) {
		mask.show();
		self.callback = callback;
		ui.classList.add('active');
		//处理物理返回键
		self.__back = mui.back;
		mui.back = function () {
			self.hide();
		};
	};

	self.hide = function () {
		ui.classList.remove('active');
		mask.close();
		//处理物理返回键
		mui.back = self.__back;
		self.callback = null;
	};

	self.ok = function () {
		if (self.callback) callback(self);
		self.hide();
	};

	//房型相关
	self.roomTypes = [{
		text: '不限',
		value: '0',
	}, {
			text: '大床',
			value: '1',
		}, {
			text: '双床',
			value: '2',
		}, {
			text: '单人床',
			value: '3',
		}];

	self.roomType = self.roomTypes[0];
	self.pickRoomType = function (index) {
		self.roomType = self.roomTypes[index];
	};

	//早餐相关
	self.breakfasts = [{
		text: '不限',
		value: '0',
	}, {
			text: '含早餐',
			value: '1',
		}, {
			text: '单份早餐',
			value: '2',
		}, {
			text: '双份早餐',
			value: '3',
		}];
	self.breakfast = self.breakfasts[0];
	self.pickBreakfast = function (index) {
		self.breakfast = self.breakfasts[index];
	};
	
	//其它选项
	self.others = [{
		text: '不限',
		value: '0',
	}, {
			text: '立即确认',
			value: '1',
		}, {
			text: '可加床',
			value: '2',
		}];
	self.other = self.others[0];
	self.pickOther = function (index) {
		self.other = self.others[index];
	};

	pageHepler.init({
		handler: self,
		holder: ui,
		mvvm: true
	});
});