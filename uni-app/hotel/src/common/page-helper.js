define(function(require, exports, module) {

	var eventBinder = require('./event-binder');
	var elementMaper = require('./element-maper');
	var Vue = require('../libs/vue.js');
	var utils = require('../libs/utils.js');
	var vueFilters = require('./vue-filter.js');

	utils.each(vueFilters, function(name, func) {
		Vue.filter(name, func);
	});

	exports.init = function(options) {
		options = options || {};
		options.holder = options.holder || document.body;
		options.handler = options.handler || window;

		elementMaper.init(options.handler, options.holder);
		eventBinder.init(options.handler, options.holder);

		//mvvm 绑定
		if (options.mvvm) {
			if (options.mvvm === true) {
				options.mvvm = {};
			}
			options.mvvm.el = options.mvvm.el || options.holder;
			options.mvvm.data = options.mvvm.data || options.handler;
			options.mvvm.methods = options.mvvm.methods || options.handler;
			options.mvvm.computed = options.mvvm.computed || options.handler.computed;
			exports.vue = new Vue(options.mvvm);
		}

		//处理所有 data-url
		mui(options.holder).on('tap', '[data-url]', function(event) {
			var item = this;
			var url = item.getAttribute('data-url');
			if (window.plus) {
				mui.openWindow({
					url: url,
					show: {
						aniShow: 'pop-in'
					},
					waiting: {
						autoShow: true
					}
				});
			} else {
				window.open(url, '_self');
			}
			event.stopPropagation();
			return false;
		});
	};
});