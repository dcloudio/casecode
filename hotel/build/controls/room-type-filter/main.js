/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,i){var t=e,n=require("../../common/page-helper");require("./style.css");var c=require("../../libs/jquery"),a=(require("../../libs/tp"),require("../../libs/ems-text!./ui.html")),s=c(a)[0];document.body.appendChild(s),s.addEventListener("touchmove",function(e){e.preventDefault()});var o=mui.createMask();o[0].addEventListener("tap",function(){t.hide()},!1),t.show=function(){o.show(),s.classList.add("active"),t.__back=mui.back,mui.back=function(){t.hide()}},t.hide=function(){s.classList.remove("active"),o.close(),mui.back=t.__back},t.ok=function(){t.hide()},n.init(t,s)});