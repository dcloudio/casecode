/**
 * @class DateTime
 * @description 日期处理模块
 */
module.exports = class DateTime {
	constructor() {
		//默认日期展示格式
		this.defaultDateFormat = 'Y-m-d H:i:s'
		//默认时区
		this.defaultTimezone = 8
		this.setTimeZone(this.defaultTimezone)
	}

	/**
	 * 设置时区
	 * @param {Number} timezone 时区
	 */
	setTimeZone(timezone) {
		if (timezone) {
			this.timezone = parseInt(timezone)
		}
		return this
	}

	/**
	 * 获取 Date对象
	 * @param {Date|Time} time
	 */
	getDateObj(time) {
		return time ? new Date(time) : new Date()
	}

	/**
	 * 获取毫秒/秒级时间戳
	 * @param {DateTime} datetime 日期 例：'2022-04-21 00:00:00'
	 * @param {Boolean} showSenconds 是否显示为秒级时间戳
	 */
	getTime(datetime, showSenconds) {
		let time = this.getDateObj(datetime).getTime()
		if (showSenconds) {
			time = Math.trunc(time / 1000)
		}
		return time
	}

	/**
	 * 获取日期
	 * @param {String} dateFormat 日期格式
	 * @param {Time} time 时间戳
	 */
	getDate(dateFormat, time) {
		return this.dateFormat(dateFormat, time)
	}


	/**
	 * 获取日期在不同时区下的时间戳
	 * @param {Date|Time}} time 日期或时间戳
	 * @param {Object} timezone 时区
	 */
	getTimeByTimeZone(time, timezone) {
		this.setTimeZone(timezone)
		const thisDate = time ? new Date(time) : new Date()
		const localTime = thisDate.getTime()
		const offset = thisDate.getTimezoneOffset()
		const utc = offset * 60000 + localTime
		return utc + (3600000 * this.timezone)
	}

	/**
	 * 获取时间信息
	 * @param {Time} time 时间戳
	 * @param {Boolean} full 是否完整展示, 为true时小于10的位会自动补0
	 */
	getTimeInfo(time, full = true) {
		time = this.getTimeByTimeZone(time)
		const date = this.getDateObj(time)
		const retData = {
			nYear: date.getFullYear(),
			nMonth: date.getMonth() + 1,
			nWeek: date.getDay() || 7,
			nDay: date.getDate(),
			nHour: date.getHours(),
			nMinutes: date.getMinutes(),
			nSeconds: date.getSeconds()
		}

		if (full) {
			for (const k in retData) {
				if (retData[k] < 10) {
					retData[k] = '0' + retData[k]
				}
			}
		}
		return retData
	}

	/**
	 * 时间格式转换
	 * @param {String} format 展示格式如:Y-m-d H:i:s
	 * @param {Time} time 时间戳
	 */
	dateFormat(format, time) {
		const timeInfo = this.getTimeInfo(time)
		format = format || this.defaultDateFormat
		let date = format
		if (format.indexOf('Y') > -1) {
			date = date.replace(/Y/, timeInfo.nYear)
		}
		if (format.indexOf('m') > -1) {
			date = date.replace(/m/, timeInfo.nMonth)
		}
		if (format.indexOf('d') > -1) {
			date = date.replace(/d/, timeInfo.nDay)
		}
		if (format.indexOf('H') > -1) {
			date = date.replace(/H/, timeInfo.nHour)
		}
		if (format.indexOf('i') > -1) {
			date = date.replace(/i/, timeInfo.nMinutes)
		}
		if (format.indexOf('s') > -1) {
			date = date.replace(/s/, timeInfo.nSeconds)
		}
		return date
	}

	/**
	 * 获取utc格式时间
	 * @param {Date|Time} datetime 日期或时间戳
	 */
	getUTC(datetime) {
		return this.getDateObj(datetime).toUTCString()
	}

	/**
	 * 获取ISO 格式时间
	 *  @param {Date|Time} datetime 日期或时间戳
	 */
	getISO(datetime) {
		return this.getDateObj(datetime).toISOString()
	}

	/**
	 * 获取两时间相差天数
	 * @param {Time} time1 时间戳
	 * @param {Time} time2 时间戳
	 */
	getDiffDays(time1, time2) {
		if (!time1) {
			return false
		}
		time2 = time2 ? time2 : this.getTime()

		let diffTime = time2 - time1
		if (diffTime < 0) {
			diffTime = Math.abs(diffTime)
		}

		return Math.ceil(diffTime / 86400000)
	}

	/**
	 * 字符串转时间戳
	 * @param {Object} str 字符串类型的时间戳
	 */
	strToTime(str) {
		if (Array.from(str).length === 10) {
			str += '000'
		}
		return this.getTime(parseInt(str))
	}

	/**
	 * 根据设置的天数获取指定日期N天后（前）的时间戳
	 * @param {Number} days 天数
	 * @param {Date|Time} time 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定日期初始时间戳（当天00:00:00的时间戳）
	 */
	getTimeBySetDays(days, time, getAll = false) {
		const date = this.getDateObj(time)
		date.setDate(date.getDate() + days)
		let startTime = date.getTime()
		if (!getAll) {
			const realdate = this.getDate('Y-m-d 00:00:00', startTime)
			startTime = this.getTimeByDateAndTimezone(realdate)
		}
		return startTime
	}

	/**
	 * 根据设置的小时数获取指定日期N小时后（前）的时间戳
	 * @param {Number} hours 小时数
	 * @param {Date|Time} time 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定时间初始时间戳（该小时00:00的时间戳）
	 */
	getTimeBySetHours(hours, time, getAll = false) {
		const date = this.getDateObj(time)
		date.setHours(date.getHours() + hours)
		let startTime = date.getTime()
		if (!getAll) {
			const realdate = this.getDate('Y-m-d H:00:00', startTime)
			startTime = this.getTimeByDateAndTimezone(realdate)
		}
		return startTime
	}

	/**
	 * 根据设置的周数获取指定日期N周后（前）的时间戳
	 * @param {Number} weeks 周数
	 * @param {Date|Time} time 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定日期初始时间戳（当天00:00:00的时间戳）
	 */
	getTimeBySetWeek(weeks, time, getAll = false) {
		const date = this.getDateObj(time)
		const dateInfo = this.getTimeInfo(time)
		const day = dateInfo.nWeek
		const offsetDays = 1 - day
		weeks = weeks * 7 + offsetDays
		date.setDate(date.getDate() + weeks)
		let startTime = date.getTime()
		if (!getAll) {
			const realdate = this.getDate('Y-m-d 00:00:00', startTime)
			startTime = this.getTimeByDateAndTimezone(realdate)
		}
		return startTime
	}

	/**
	 * 根据设置的月数获取指定日期N月后（前）的时间戳
	 * @param {Number} monthes 月数
	 * @param {Date|Time} time 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定日期初始时间戳（当天00:00:00的时间戳）
	 */
	getTimeBySetMonth(monthes, time, getAll = false) {
		const date = this.getDateObj(time)
		date.setMonth(date.getMonth() + monthes)
		let startTime = date.getTime()
		if (!getAll) {
			const realdate = this.getDate('Y-m-01 00:00:00', startTime)
			startTime = this.getTimeByDateAndTimezone(realdate)
		}
		return startTime
	}

	/**
	 * 根据设置的季度数获取指定日期N个季度后（前）的时间戳
	 * @param {Number} quarter 季度
	 * @param {Date|Time} time 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定日期初始时间戳（当天00:00:00的时间戳）
	 */
	getTimeBySetQuarter(quarter, time, getAll = false) {
		const date = this.getDateObj(time)
		const dateInfo = this.getTimeInfo(time)
		date.setMonth(date.getMonth() + quarter * 3)
		const month = date.getMonth() + 1;
		let quarterN;
		let mm;
		if ([1,2,3].indexOf(month) > -1) {
			// 第1季度
			mm = "01";
		} else if ([4,5,6].indexOf(month) > -1) {
			// 第2季度
			mm = "04";
		} else if ([7,8,9].indexOf(month) > -1) {
			// 第3季度
			mm = "07";
		} else if ([10,11,12].indexOf(month) > -1) {
			// 第4季度
			mm = "10";
		}
		let yyyy = date.getFullYear();
		let startTime = date.getTime()
		if (!getAll) {
			const realdate = this.getDate(`${yyyy}-${mm}-01 00:00:00`, startTime)
			startTime = this.getTimeByDateAndTimezone(realdate)
		}
		return startTime
	}

	/**
	 * 根据设置的年数获取指定日期N年后（前）的时间戳
	 * @param {Number} year 月数
	 * @param {Date|Time} time 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定日期初始时间戳（当天00:00:00的时间戳）
	 */
	getTimeBySetYear(year, time, getAll = false) {
		const date = this.getDateObj(time)
		date.setFullYear(date.getFullYear() + year)
		let startTime = date.getTime()
		if (!getAll) {
			const realdate = this.getDate('Y-01-01 00:00:00', startTime)
			startTime = this.getTimeByDateAndTimezone(realdate)
		}
		return startTime
	}


	/**
	 * 根据时区获取指定时间的偏移时间
	 * @param {Date|Time} 指定的日期或时间戳
	 * @param {Number} timezone 时区
	 */
	getTimeByDateAndTimezone(date, timezone) {
		if (!timezone) {
			timezone = this.timezone
		}
		const thisDate = this.getDateObj(date)
		const thisTime = thisDate.getTime()
		const offset = thisDate.getTimezoneOffset()
		const offsetTime = offset * 60000 + timezone * 3600000
		return thisTime - offsetTime
	}

	/**
	 * 根据指定的时间类型获取时间范围
	 * @param {String} type 时间类型 hour:小时 day:天 week:周 month：月
	 * @param {Number} offset 时间的偏移量
	 * @param {Date|Time} thistime 指定的日期或时间戳
	 * @param {Boolean} getAll 是否获取完整时间戳，为 false 时返回指定日期初始时间戳（当天00:00:00的时间戳）
	 */
	getTimeDimensionByType(type, offset = 0, thistime, getAll = false) {
		let startTime = 0
		let endTime = 0
		switch (type) {
			case 'hour': {
				startTime = this.getTimeBySetHours(offset, thistime, getAll)
				endTime = getAll ? startTime : startTime + 3599999
				break
			}
			case 'day': {
				startTime = this.getTimeBySetDays(offset, thistime, getAll)
				endTime = getAll ? startTime : startTime + 86399999
				break
			}
			case 'week': {
				startTime = this.getTimeBySetWeek(offset, thistime, getAll)
				endTime = getAll ? startTime + 86400000 * 6 : startTime + 86400000 * 6 + 86399999
				break
			}
			case 'month': {
				startTime = this.getTimeBySetMonth(offset, thistime, getAll)
				const date = this.getDateObj(this.getDate('Y-m-d H:i:s', startTime))
				const nextMonthFirstDayTime = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime()
				endTime = getAll ? nextMonthFirstDayTime - 86400000 : this.getTimeByDateAndTimezone(
					nextMonthFirstDayTime) - 1
				break
			}
			case 'quarter': {
				startTime = this.getTimeBySetQuarter(offset, thistime, getAll)
				const date = this.getDateObj(this.getDate('Y-m-d H:i:s', startTime))
				const nextMonthFirstDayTime = new Date(date.getFullYear(), date.getMonth() + 3, 1).getTime()
				endTime = getAll ? nextMonthFirstDayTime - 86400000 : this.getTimeByDateAndTimezone(
					nextMonthFirstDayTime) - 1
				break
			}
			case 'year': {
				startTime = this.getTimeBySetYear(offset, thistime, getAll)
				const date = this.getDateObj(this.getDate('Y-m-d H:i:s', startTime))
				const nextFirstDayTime = new Date(date.getFullYear() + 1, 0, 1).getTime()
				endTime = getAll ? nextFirstDayTime - 86400000 : this.getTimeByDateAndTimezone(
					nextFirstDayTime) - 1
				break
			}
		}
		return {
			startTime,
			endTime
		}
	}
}
