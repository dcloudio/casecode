/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,e,n){"require:nomunge,exports:nomunge,module:nomunge";"use strict";e.load=function(e,n,o,t){var u=n.toUrl(e);require("./ems-text!"+u,function(e){o(JSON.parse(e))})}});