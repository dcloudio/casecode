/**
 * 时间工具类
 */
let timeUtil = {};

// 尽可能的将参数转成正确的时间对象
timeUtil.getDateObject = function(date) {
	if (!date) return "";
	let nowDate;
	// 如果是字符串，且纯数字，则强制转数值
	if (typeof date === "string" && !isNaN(date)) date = Number(date);
	if (typeof date === "number") {
		if (date.toString().length === 10) date *= 1000;
		nowDate = new Date(date); // 转时间对象
	} else if (typeof date === "object") {
		nowDate = new Date(date.getTime()); // 新建一个时间对象
	}
	return nowDate;
};

/**
 * 日期格式化
 * @param {Date || Number} date 需要格式化的时间
 * timeUtil.timeFormat(new Date(),"yyyy-MM-dd hh:mm:ss");
 */
timeUtil.timeFormat = function(date, fmt = 'yyyy-MM-dd hh:mm:ss') {
	try {
		if (!date) return "";
		let nowDate = timeUtil.getDateObject(date);
		let opt = {
			"M+": nowDate.getMonth() + 1, //月份
			"d+": nowDate.getDate(), //日
			"h+": nowDate.getHours(), //小时
			"m+": nowDate.getMinutes(), //分
			"s+": nowDate.getSeconds(), //秒
			//"w+": nowDate.getDay(), //周
			"q+": Math.floor((nowDate.getMonth() + 3) / 3), //季度
			"S": nowDate.getMilliseconds() //毫秒
		};
		if (/(y+)/.test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (nowDate.getFullYear() + "").substr(4 - RegExp.$1.length));
		}
		for (let k in opt) {
			if (new RegExp("(" + k + ")").test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (opt[k]) : (("00" + opt[k]).substr(("" + opt[k]).length)));
			}
		}
		return fmt;
	} catch (err) {
		// 若格式错误,则原值显示
		return time;
	}
};

/**
 * 解析日期对象属性
 * @param {Date || Number} date 需要转换的时间
 * timeUtil.getDateInfo(new Date());
 */
timeUtil.getDateInfo = function(date = new Date()) {
	let nowDate = timeUtil.getDateObject(date);
	let year = nowDate.getFullYear() + '';
	let month = (nowDate.getMonth() + 1 < 10 ? '0' + (nowDate.getMonth() + 1) : nowDate.getMonth() + 1);
	let day = (nowDate.getDate() < 10 ? '0' + (nowDate.getDate()) : nowDate.getDate());
	let hour = (nowDate.getHours() < 10 ? '0' + (nowDate.getHours()) : nowDate.getHours());
	let minute = (nowDate.getMinutes() < 10 ? '0' + (nowDate.getMinutes()) : nowDate.getMinutes());
	let second = (nowDate.getSeconds() < 10 ? '0' + (nowDate.getSeconds()) : nowDate.getSeconds());
	let millisecond = nowDate.getMilliseconds(); //毫秒
	let week = nowDate.getDay(); // 周
	let quarter = Math.floor((nowDate.getMonth() + 3) / 3); //季度
	return {
		year: Number(year),
		month: Number(month),
		day: Number(day),
		hour: Number(hour),
		minute: Number(minute),
		second: Number(second),
		millisecond: Number(millisecond),
		week: Number(week),
		quarter: Number(quarter),
	};
};

/**
 * 获得相对当前时间的偏移 count 小时、天、周、月、季度、年的起止日期（开始和结束时间戳）
 * @param {Number} count 偏移量
 * @param {Date || Number} date 指定从哪个时间节点开始计算
 * timeUtil.getOffsetStartAndEnd("hour", 0);
 * timeUtil.getOffsetStartAndEnd("day", 0);
 * timeUtil.getOffsetStartAndEnd("week", 0);
 * timeUtil.getOffsetStartAndEnd("month", 0);
 * timeUtil.getOffsetStartAndEnd("quarter", 0);
 * timeUtil.getOffsetStartAndEnd("year", 0);
 */
timeUtil.getOffsetStartAndEnd = function(type="day", count = 0, date = new Date()) {
	let startTime, endTime;
	let nowDate = timeUtil.getDateObject(date);
	if (type === "hour") {
		// 小时
		// 一小时毫秒数
		let offsetMillisecond = 1000 * 60 * 60;
		// 相对于当前日期count个天的日期
		let dateInfo = timeUtil.getDateInfo(new Date(nowDate.getTime() + (offsetMillisecond * 1 * count)));
		// 获得当天的起始时间
		startTime = new Date(`${dateInfo.year}/${dateInfo.month}/${dateInfo.day} ${dateInfo.hour}:00:00`).getTime();
		// 获得当天的结束时间
		endTime = new Date(`${dateInfo.year}/${dateInfo.month}/${dateInfo.day} ${dateInfo.hour}:00:00`).getTime() + (offsetMillisecond -1);
	} else if (type === "day") {
		// 天
		// 一天的毫秒数
		let offsetMillisecond = 1000 * 60 * 60 * 24;
		// 相对于当前日期count个天的日期
		let dateInfo = timeUtil.getDateInfo(new Date(nowDate.getTime() + (offsetMillisecond * 1 * count)));
		// 获得当天的起始时间
		startTime = new Date(`${dateInfo.year}/${dateInfo.month}/${dateInfo.day}`).getTime();
		// 获得当天的结束时间
		endTime = new Date(`${dateInfo.year}/${dateInfo.month}/${dateInfo.day}`).getTime() + (offsetMillisecond - 1);
	} else if (type === "week") {
		// 周
		nowDate.setDate(nowDate.getDate() - nowDate.getDay() + 1 + count * 7);
		let dateInfo1 = timeUtil.getDateInfo(nowDate);
		nowDate.setDate(nowDate.getDate() + 7);
		let dateInfo2 = timeUtil.getDateInfo(nowDate);
		// 开始时间
		startTime = new Date(`${dateInfo1.year}/${dateInfo1.month}/${dateInfo1.day}`).getTime();
		// 结束时间
		endTime = new Date(`${dateInfo2.year}/${dateInfo2.month}/${dateInfo2.day}`).getTime() - 1;
	} else if (type === "month") {
		// 月
		let dateInfo = timeUtil.getDateInfo(nowDate);
		let month = dateInfo.month + count;
		let year = dateInfo.year;
		if (month > 12) {
			year = year + Math.floor(month / 12);
			month = Math.abs(month) % 12;
		} else if (month <= 0) {
			year = year - 1 - Math.floor(Math.abs(month) / 12);
			month = 12 - Math.abs(month) % 12;
		}
		let month_last_day = new Date(year, month, 0).getDate();
		// 开始时间
		startTime = new Date(`${year}/${month}/1`).getTime();
		// 结束时间
		endTime = new Date(`${year}/${month}/${month_last_day}`).getTime() + (24 * 60 * 60 * 1000 - 1);
	} else if (type === "quarter") {
		// 季度
		nowDate.setMonth(nowDate.getMonth() + count * 3);
		let dateInfo = timeUtil.getDateInfo(nowDate);
		let month = dateInfo.month;
		if ([1, 2, 3].indexOf(month) > -1) {
			// 第1季度
			month = 1;
		} else if ([4, 5, 6].indexOf(month) > -1) {
			// 第2季度
			month = 4;
		} else if ([7, 8, 9].indexOf(month) > -1) {
			// 第3季度
			month = 7;
		} else if ([10, 11, 12].indexOf(month) > -1) {
			// 第4季度
			month = 10;
		}
		nowDate.setMonth(month - 1); // 因为0代表1月，所以这里要减1
		let dateInfo1 = timeUtil.getDateInfo(nowDate);
		nowDate.setMonth(nowDate.getMonth() + 3);
		let dateInfo2 = timeUtil.getDateInfo(nowDate);
		// 开始时间
		startTime = new Date(`${dateInfo1.year}/${dateInfo1.month}/1`).getTime();
		// 结束时间
		endTime = new Date(`${dateInfo2.year}/${dateInfo2.month}/1`).getTime() - 1;
	} else if (type === "year") {
		// 年
		let dateInfo = timeUtil.getDateInfo(nowDate);
		let year = dateInfo.year + count;
		// 开始时间
		startTime = new Date(`${year}/1/1`).getTime();
		// 结束时间
		endTime = new Date(`${year}/12/31`).getTime() + (24 * 60 * 60 * 1000 - 1);
	}
	return {
		startTime,
		endTime
	};
};

export default timeUtil;
