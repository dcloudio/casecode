define(function(require, exports, module) {
	exports.init = function(handler, holder) {
		//查找映射的元素
		holder = holder || document.body;
		var elMap = handler.el;
		handler.el = {};
		for (var name in elMap) {
			handler.el[name] = holder.querySelector(elMap[name]);
		}
	};
});