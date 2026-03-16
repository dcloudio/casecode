/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,i){mui.init();var t=(require("../libs/utils.js"),require("../common/page-helper")),n=require("../controls/hotel-price-filter/main"),c=e;c.pickWelcomeDegree=function(){null==c.wdPicker&&(c.wdPicker=new mui.PopPicker,c.wdPicker.setData([{text:"默认排序"},{text:"评分 高→低"},{text:"价格 低→高"},{text:"价格 高→低"},{text:"距离 近→远"}])),c.wdPicker.show(function(){})},c.setPriceFilter=function(){n.show()},t.init({handler:c})});