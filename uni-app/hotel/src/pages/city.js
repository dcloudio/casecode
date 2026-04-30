define(function(require, exports, module) {
	var pageHepler = require('../common/page-helper');
	var self = exports;

	self.el = {
		header: 'header.mui-bar',
		cityType: '.hotel-city-type',
		list: '#list'
	};

	pageHepler.init({
		handler: self
	});

	//	mui.ready(function() {
	//		//calc hieght
	//		self.el.list.style.height = (document.body.offsetHeight - self.el.header.offsetHeight) + 'px';
	//		var indexedList = mui(self.el.list).indexedList();
	//	});

	//calc hieght
	self.el.list.style.height = (document.body.offsetHeight - self.el.header.offsetHeight - self.el.cityType.offsetHeight) + 'px';
	var indexedList = mui(self.el.list).indexedList();

});