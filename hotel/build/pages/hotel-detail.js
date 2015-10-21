/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,n){var t=require("../common/page-helper"),o=require("../controls/room-type-filter/main"),i=require("../controls/booking-date/main"),p=e;p.el={header:"header.mui-bar",list:"#list"},p.openMap=function(){mui.plusReady(function(){var e=new plus.maps.Point(39.906016,116.3977),n=new plus.maps.Point(39.967846,116.337984);plus.maps.openSysMap(e,"天安门",n)})},p.setPriceType=function(){null==p.ptPicker&&(p.ptPicker=new mui.PopPicker,p.ptPicker.setData([{text:"返前价"},{text:"原价"}])),p.ptPicker.show(function(){})},p.setRoomType=function(){o.show()},p.setBookingDate=function(){i.show()},t.init({handler:p})});