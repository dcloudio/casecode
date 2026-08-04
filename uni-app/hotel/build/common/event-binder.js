/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,t){var n=function(e){var t=[],n=e.split(";");return n.forEach(function(e){var n={},a=e.split(">");if(a[0]&&(n.eventName=a[0],a[1])){var i=a[1].split(":");i[0]&&(n.method=i[0],i[1]?n.args=i[1].split(","):n.args=[],t.push(n))}}),t};e.init=function(e,t){t=t||document.body,e=e||window;var a=[].slice.call(t.querySelectorAll("[data-event]"));a.forEach(function(t){if(!t.__event_binded){t.__event_binded=!0;var a=n(t.getAttribute("data-event")||"");a.forEach(function(n){t.addEventListener(n.eventName,function(t){var a=[t];a.push.apply(a,n.args),e[n.method].apply(e,a)},!1)})}})}});