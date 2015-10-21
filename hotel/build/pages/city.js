/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,t){var i=require("../common/page-helper"),l=e;l.el={header:"header.mui-bar",cityType:".ct-city-type",list:"#list"},i.init({handler:l}),l.el.list.style.height=document.body.offsetHeight-l.el.header.offsetHeight-l.el.cityType.offsetHeight+"px";mui(l.el.list).indexedList()});