/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,t){var a=require("../libs/utils.js");e.date=function(e){var t=new Date(e),n=parseInt(a.formatDate(t,"yyyyMMdd")),r=parseInt(a.formatDate(new Date,"yyyyMMdd"));return r==n?"今天":r-n==1?"昨天":r-n==2?"前天":r-n==-1?"明天":r-n==-2?"后天":a.formatDate(t,"MM月dd日")},e.week=function(e){var t=new Date(e),a=t.getDay();return["日","一","二","三","四","五","六"][a]}});