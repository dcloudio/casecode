define(function(require, exports, module) {

	var parseEventExp = function(expText) {
		//name>method:arg1,arg2...;
		var buffer = [];
		var itemTextArray = expText.split(';');
		itemTextArray.forEach(function(itemText) {
			var item = {};
			var itemParts = itemText.split('>');
			if (itemParts[0]) {
				item.eventName = itemParts[0];
				if (itemParts[1]) {
					var methodParts = itemParts[1].split(':');
					if (methodParts[0]) {
						item.method = methodParts[0];
						if (methodParts[1]) {
							item.args = methodParts[1].split(',');
						} else {
							item.args = [];
						}
						buffer.push(item);
					}
				}
			}
		});
		return buffer;
	};

	exports.init = function(handler, holder) {
		holder = holder || document.body;
		handler = handler || window;
		var elements = [].slice.call(holder.querySelectorAll('[data-event]'));
		elements.forEach(function(element) {
			if (element.__event_binded) return;
			element.__event_binded = true;
			var eventExps = parseEventExp(element.getAttribute('data-event') || '');
			eventExps.forEach(function(eventExp) {
				element.addEventListener(eventExp.eventName, function(event) {
					var args = [event];
					args.push.apply(args, eventExp.args);
					handler[eventExp.method].apply(handler, args);
				}, false);
			});
		});
	};
});