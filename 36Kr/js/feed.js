(function($) {
	//暂时无用
	var getNodeValue = function(xmlObj, tagName) {
		var value = "";
		var nodes = xmlObj.getElementsByTagName(tagName);
		if (nodes && nodes.length) {
			var childNodes = nodes[0].childNodes;
			if (childNodes) {
				var childNode = childNodes[0];
				if (childNode) {
					value = childNode.wholeText || childNode.nodeValue;
				}
			}
		}
		return value;
	};
	var parseFeed = function(xmlObj) {
		var feed = {
			title: '',
			link: '',
			pubDate: '',
			description: '',
			language: '',
			items: []
		};
		if (xmlObj) {
			feed.title = getNodeValue(xmlObj, "title");
			feed.link = getNodeValue(xmlObj, "link");
			feed.pubDate = getNodeValue(xmlObj, "pubDate");
			feed.description = getNodeValue(xmlObj, "description");
			feed.language = getNodeValue(xmlObj, "language");
			var itemsXml = xmlObj.getElementsByTagName('item');
			var items = [];
			var itemXml = {};
			var item = {};
			for (var i = 0, len = itemsXml.length; i < len; i++) {
				itemXml = itemsXml[i];
				item = {
					title: '',
					author: '',
					pubDate: '',
					link: '',
					guid: '',
					description: ''
				};
				if (itemXml) {
					item.title = getNodeValue(itemXml, "title");
					item.author = getNodeValue(itemXml, "author");
					item.pubDate = getNodeValue(itemXml, "pubDate");
					item.link = getNodeValue(itemXml, "link");
					item.guid = getNodeValue(itemXml, "guid");
					item.description = getNodeValue(itemXml, "description");
				}
				items.push(item);
			}
			feed.items = items;
		}
		return feed;
	};
	$.getFeed = function(url, success, error) {
		error = error || $.noop;
		$.ajax({
			type: "get",
			url: url,
			dataType: 'xml',
			success: function(response) {
				if (!response) {
					return error();
				}
				success(parseFeed(response));
			},
			error: error
		});
	};
})(mui);