(function($) {
	$.ready(function() {
		$('body').on('click', 'a', function(e) {
			e.preventDefault();
		});
	});
	window.kr = {};
})(mui);