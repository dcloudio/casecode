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

	ui.addEventListener('tap', function() {
		self.hide();
	}, false);

	self.show = function() {
		ui.classList.add('active');
	};

	self.hide = function() {
		ui.classList.remove('active');
	};

	//mvvm
	self.roomPrice = 175;
	self.roomNum = 2;
	

	pageHepler.init({
		handler: self,
		holder: ui,
		mvvm: true
	});
});