/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,i,e){var t=require("../common/page-helper"),n=require("../controls/price-detail/main"),o=require("../controls/booking-date/main"),c=i;c.setArrivalTime=function(){c.atPicker||(c.atPicker=new mui.PopPicker,c.atPicker.setData([{text:"23点前"},{text:"22点前"}])),c.atPicker.show(function(){})},c.setInvoice=function(){c.iPicker||(c.iPicker=new mui.PopPicker,c.iPicker.setData([{text:"不需要"},{text:"到店领取"}])),c.iPicker.show(function(){})},c.setRequirement=function(){if(window.plus)plus.nativeUI.prompt("请填写您的要求",function(){},"特殊要求","",["确认","取消"]);else{prompt("请填写您的要求")}},c.showPriceDetail=function(){n.show()},c.setBookingDate=function(){o.show()},t.init({handler:c})});