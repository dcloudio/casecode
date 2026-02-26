/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,i){var n=i.exports;n.createInner=function(){mui.plusReady(function(){n.childView||(n.childView=plus.webview.create(null,"tmpl-head-inner",{top:"44px",bottom:"0px"}),plus.webview.currentWebview().append(n.childView)),n.childView.loadURL("http://www.baidu.com/")})},n.createInner(),window.addEventListener("ct-show",function(e){})});