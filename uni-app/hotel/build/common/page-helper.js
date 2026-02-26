/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,n){var m=require("./event-binder"),t=require("./element-maper"),o=require("../libs/vue.js"),d=require("../libs/utils.js"),i=require("./vue-filter.js");d.each(i,function(e,n){o.filter(e,n)}),e.init=function(n){n=n||{},n.holder=n.holder||document.body,n.handler=n.handler||window,t.init(n.handler,n.holder),m.init(n.handler,n.holder),n.mvvm&&(n.mvvm===!0&&(n.mvvm={}),n.mvvm.el=n.mvvm.el||n.holder,n.mvvm.data=n.mvvm.data||n.handler,n.mvvm.methods=n.mvvm.methods||n.handler,n.mvvm.computed=n.mvvm.computed||n.handler.computed,e.vue=new o(n.mvvm)),mui(n.holder).on("tap","[data-url]",function(e){var n=this,m=n.getAttribute("data-url");return window.plus?mui.openWindow({url:m,show:{aniShow:"pop-in"},waiting:{autoShow:!0}}):window.open(m,"_self"),e.stopPropagation(),!1})}});