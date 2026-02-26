/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,t){var a=e,i=require("../../common/page-helper");require("./style.css");var n=require("../../libs/jquery"),u=(require("../../libs/tp"),require("../../libs/ems-text!./ui.html")),c=n(u)[0];document.body.appendChild(c),mui(".mui-numbox",c).numbox(),c.addEventListener("touchmove",function(e){e.preventDefault()});var d=mui.createMask();d[0].addEventListener("tap",function(){a.hide()},!1),a.show=function(){d.show(),c.classList.add("active"),a.__back=mui.back,mui.back=function(){a.hide()}},a.hide=function(){c.classList.remove("active"),d.close(),mui.back=a.__back},a.ok=function(){a.hide()},a.dayNum=1,a.beginDate=utils.formatDate(new Date,"yyyy-MM-dd");var o=function(){var e=new Date(a.beginDate);e.setDate(e.getDate()+a.dayNum),a.endDate=utils.formatDate(e,"yyyy-MM-dd")};o(),a.changeDayNum=function(e){a.dayNum=parseInt(e.target.value),o()},a.pickeDate=function(e,t){var i=(new Date).getFullYear();a.dtPicker=a.dtPicker||new mui.DtPicker({type:"date",beginYear:i,endYear:i+1}),a.dtPicker.show(function(e){a.beginDate=e.value,o()})},i.init(a,c,{mvvm:!0})});