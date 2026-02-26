define(function(require, exports, module) {
	var self = exports;
	var pageHepler = require('../../common/page-helper');
	require('./style.css');
	var $ = require('../../libs/jquery');
	var tp = require('../../libs/tp');

	var uiHtml = require('../../libs/ems-text!./ui.html');
	var ui = $(uiHtml)[0];
	document.body.appendChild(ui);
	mui('.mui-numbox', ui).numbox();

	ui.addEventListener('touchmove', function(event) {
		event.preventDefault();
	});

	var mask = mui.createMask();
	mask[0].addEventListener('tap', function() {
		self.hide();
	}, false);

	self.show = function() {
		mask.show();
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
		//处理物理返回键
		mui.back = self.__back;
	};

	self.ok = function() {
		self.hide();
	};


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

	pageHepler.init({
		handler: self,
		holder: ui,
		mvvm: true
	});
});