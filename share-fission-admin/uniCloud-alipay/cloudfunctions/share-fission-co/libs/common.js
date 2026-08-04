/**
 * 通用公共函数
 */

const common = {};

/**
 * 日期格式化
 */
common.timeFormat = function(time, fmt = 'yyyy-MM-dd hh:mm:ss', targetTimezone = 8) {
  try {
    if (!time) {
      return "";
    }
    if (typeof time === "string") {
      if (!isNaN(time)) {
        time = Number(time);
      } else {
        const dateString = time;
        const regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
        const matches = regex.exec(dateString);
        const formattedDate = `${matches[1]}-${matches[2]}-${matches[3]}T${matches[4]}:${matches[5]}:${matches[6]}+08:00`;
        time = new Date(formattedDate).getTime();
      }
    }

    // 其他更多是格式化有如下:
    // yyyy-MM-dd hh:mm:ss|yyyy年MM月dd日 hh时MM分等,可自定义组合
    let date;
    if (typeof time === "number") {
      if (time.toString().length == 10) time *= 1000;
      date = new Date(time);
    } else {
      date = time;
    }

    const dif = date.getTimezoneOffset();
    const timeDif = dif * 60 * 1000 + (targetTimezone * 60 * 60 * 1000);
    const east8time = date.getTime() + timeDif;

    date = new Date(east8time);
    let opt = {
      "M+": date.getMonth() + 1, //月份
      "d+": date.getDate(), //日
      "h+": date.getHours(), //小时
      "m+": date.getMinutes(), //分
      "s+": date.getSeconds(), //秒
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度
      "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (let k in opt) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (opt[k]) : (("00" + opt[k]).substr(("" + opt[
          k]).length)));
      }
    }
    return fmt;
  } catch (err) {
    // 若格式错误,则原值显示
    return time;
  }
};

/**
 * 增强随机数（加上了时间精度）
 * 均匀产生0-1的随机小数（包含0和1）
 */
common.enhancedRandom = function() {
  if (typeof global.performance !== "undefined") {
    const timePart = global.performance.now();
    const randomPart = Math.random();
    const random = (timePart + randomPart) % 1;
    return random;
  } else {
    return Math.random();
  }
};

/**
 * 产生指定位数的随机数(支持任意字符,默认纯数字)
 * @param	{Number} length 随机数固定位数
 * @param	{String} range 指定的字符串中随机范围
 */
common.random = function(length, range) {
  let s = "";
  let list = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  if (range) {
    list = range;
  }
  for (let i = 0; i < length; i++) {
    let code = list[Math.floor(common.enhancedRandom() * list.length)];
    s += code;
  }
  return s;
};

common.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

common.hidden = function(str = "", first = 0, last = 0) {
  if (!first) {
    first = str.length / 2;
  }
  if (!last) {
    last = str.length / 2 - 4;
  }
  let len = str.length - first - last;
  let xing = '';
  for (let i = 0; i < len; i++) {
    xing += '*';
  }
  return str.substring(0, first) + xing + str.substring(str.length - last);
};

/**
 * 保留小数
 */
common.toDecimal = function(val, precision = 0) {
  if (typeof val === "string") val = Number(val);
  return parseFloat(val.toFixed(precision));
};

/**
 * 判断字符串是否满足objectid格式
 */
common.isObjectId = function(str) {
  // MongoDB ObjectId 是 24 位十六进制字符串（0-9, a-f, A-F）
  if (typeof str !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(str);
};

module.exports = common;
