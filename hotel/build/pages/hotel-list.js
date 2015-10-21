/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,i){mui.init();var n=(require("../libs/utils.js"),require("../common/page-helper")),t=(require("../controls/hotel-price-filter/main"),e);t.createInnerList=function(){mui.plusReady(function(){plus.webview.currentWebview().append(plus.webview.create("./hotel-list-inner.html","hotel-list-inner",{top:"77px",bottom:"0px"}))})},t.createInnerList(),n.init({handler:t})});