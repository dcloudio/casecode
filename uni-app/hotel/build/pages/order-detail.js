/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,n,e){var i=require("../common/page-helper"),c=n;c.cancelOrder=function(){if(window.plus)plus.nativeUI.confirm("您确认取消这个订单吗?",function(){},"取消订单",["确认","取消"]);else{confirm("您确认取消这个订单吗?")}},i.init({handler:c})});