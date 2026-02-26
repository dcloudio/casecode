/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,t){var i=e,n=require("../../common/page-helper");require("./style.css");var s=require("../../libs/jquery"),a=(require("../../libs/tp"),require("../../libs/ems-text!./ui.html")),c=s(a)[0];document.body.appendChild(c),c.addEventListener("touchmove",function(e){e.preventDefault()}),c.addEventListener("tap",function(){i.hide()},!1),i.show=function(){c.classList.add("active")},i.hide=function(){c.classList.remove("active")},n.init(i,c)});