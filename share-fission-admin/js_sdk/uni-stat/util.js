/**
 *  以下为 uni-stat 的工具方法
 */

// 千分位
function regexHandleNum(num) {
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 3是千分位，4是万分位
}

// 新版格式化字段数据函数
function formatterData(object) {
	let {
		fieldsMap,
		data,
		formatter = true
	} = object;
	let rows = JSON.parse(JSON.stringify(data));
	rows.map((row) => {
		for (let key in row) {
			let fieldItem = fieldsMap.find((item) => {
				return item.field == key;
			});
			if (typeof fieldItem === "object") {
				let {
					fix = 0,
				} = fieldItem;
				if (typeof fieldItem.multiple === "number" && typeof row[key] === "number") {
					row[key] = Number((row[key] * fieldItem.multiple).toFixed(fix));
				}
				if (formatter && fieldItem.formatter && typeof row[key] === "number") {
					if (fieldItem.formatter === ",") {
						row[key] = regexHandleNum(row[key]);
					} else if (fieldItem.formatter === "%") {
						row[key] = `${(row[key] * 100).toFixed(fix)}%`
					} else if (fieldItem.formatter === "-") {
						// 时分秒格式
						row[key] = parseDateTime(row[key]);
					}
				}
			}
		}
	});
	return rows;
}

// 补全趋势图的数据
function fillTrendChartData(data, query, fieldsMap) {
	let { start_time, dimension } = query;
	if (["hour","day"].indexOf(dimension)>-1){
		let timeArr = [];
		let oneTime;
		if (dimension === "hour"){
			oneTime = 1000*3600;
		} else if (dimension === "day"){
			oneTime = 1000*3600*24;
		}
		let start = start_time[0];
		let end = start_time[1];
		let nowTime = start;
		timeArr = [start];
		while ((nowTime+oneTime)<=end){
			nowTime += oneTime;
			timeArr.push(nowTime);
		}

		let newData = [];
		for (let i = 0; i < timeArr.length; i++) {
			let time = timeArr[i];
			let dataItem = data.find((item, index) => {
				return item.start_time === time;
			});
			if (dataItem) {
				newData.push(dataItem);
			} else {
				let obj = {
					start_time: time
				};
				fieldsMap.map((item, index) => {
					obj[item.field] = 0;
				});

				newData.push(obj);
			}
		}
		return newData
	} else {
		return data;
	}
}


// 将查询条件拼接为字符串
function stringifyQuery(query, dimension = false, delArrs = []) {
	const queryArr = []
	const keys = Object.keys(query)
	const time = query.start_time
	keys.forEach(key => {
		if (key === 'time_range' || delArrs.indexOf(key) !== -1) return
		let val = query[key]
		if (val) {
			if (typeof val === 'string' && val.indexOf(key) > -1) {
				queryArr.push(val)
			} else {
				if (typeof val === 'string') {
					val = `"${val}"`
				}
				if (Array.isArray(val)) {
					if (val.length === 2 && key.indexOf('time') > -1) {
						queryArr.push(`${key} >= ${val[0]} && ${key} <= ${val[1]}`)
					} else {
						val = val.map(item => `${key} == "${item}"`).join(' || ')
						val && queryArr.push(`(${val})`)
					}
				} else if (dimension && key === 'dimension') {
					if (maxDeltaDay(time)) {
						queryArr.push(`dimension == "hour"`)
					} else {
						// 判断页面，仅在pages/uni-stat/device/trend/trend和pages/uni-stat/user/trend/trend页面下，放开按小时查询的时间限制
						let pages = getCurrentPages();
						let page = pages[pages.length-1];
						if (["pages/uni-stat/device/trend/trend","pages/uni-stat/user/trend/trend"].indexOf(page.route) > -1) {
							// 放开按小时查询的时间限制
							queryArr.push(`${key} == ${val}`)
						} else {
							if (val && val !== `"hour"`) {
								queryArr.push(`${key} == ${val}`)
							} else {
								queryArr.push(`dimension == "day"`)
							}
						}
					}
				} else {
					queryArr.push(`${key} == ${val}`)
				}
			}
		}
	})
	const queryStr = queryArr.join(' && ')
	return queryStr || {}
}

// 根据页面字段配置 fieldsMap 数据计算、格式化字段
function mapfields(map, data = {}, goal, prefix = '', prop = 'value') {
	const goals = [],
		argsGoal = goal
	map = JSON.parse(JSON.stringify(map))
	const origin = JSON.parse(JSON.stringify(data))
	for (const mapper of map) {
		let {
			field,
			computed,
			formatter,
			disable,
			fix
		} = mapper
		if (!disable) {
			goal = argsGoal || mapper
			const hasValue = goal.hasOwnProperty(prop)
			const preField = prefix + field
			if (data) {
				const value = data[preField]
				if (computed) {
					const computedFields = computed.split('/')
					let [dividend, divisor] = computedFields
					dividend = Number(origin[prefix + dividend])
					divisor = Number(origin[prefix + divisor])
					const val = format(division(dividend, divisor), formatter, fix)
					if (hasValue && field === goal.field) {
						goal[prop] = val
					} else {
						goal[field] = val
					}
				} else {
					if (value) {
						const val = format(value, formatter, fix)
						if (hasValue) {
							if (goal.field === field) {
								goal[prop] = val
							}
						} else {
							goal[field] = val
						}
					}
				}
			}
			if (hasValue) {
				goals.push(goal)
			}
		}
	}
	return goals
}

// 将查询条件对象拼接为字符串，给 client db 的 field 属性消费
function stringifyField(mapping, goal, prop) {
	if (goal) {
		mapping = mapping.filter(f => f.field === goal)
	}
	if (prop) {
		mapping = mapping.filter(f => f.field && f.hasOwnProperty(prop))
	}
	const fieldString = mapping.map(f => {
		let fields = []
		if (f.computed) {
			fields = f.computed.split('/')
		} else {
			fields.push(f.field)
		}
		fields = fields.map(field => {
			if (f.stat === -1) {
				return field
			} else {
				return `${field} as ${ 'temp_' + field}`
			}
		})
		return fields.join()
	})
	return fieldString.join()
}

// 将查询条件对象拼接为字符串，给 client db 的 groupField 属性消费
function stringifyGroupField(mapping, goal, prop) {
	if (goal) {
		mapping = mapping.filter(f => f.field === goal)
	}
	if (prop) {
		mapping = mapping.filter(f => f.field && f.hasOwnProperty(prop))
	}
	const groupField = mapping.map(f => {
			const stat = f.stat
			let fields = []
			if (f.computed) {
				fields = f.computed.split('/')
			} else {
				fields.push(f.field)
			}
			fields = fields.map(field => {
				if (stat !== -1) {
					return `${stat ? stat : 'sum' }(${'temp_' + field}) as ${field}`
				}
			})
			return fields.filter(Boolean).join()
		})
		.filter(Boolean)
		.join()

	return groupField
}

// 除法函数
function division(dividend, divisor) {
	if (divisor) {
		return dividend / divisor
	} else {
		return 0
	}
}

// 对数字进行格式化，格式 type 配置在页面 fieldMap.js 中
function format(num, type = ',', fix) {
	// if (!type) return num
	if (typeof num !== 'number') return num
	if (type === '%') {
		// 注意浮点数精度
		num = (num * 100)
		if (String(num).indexOf('.') > -1) {
			num = num.toFixed(2)
		}
		num = num ? num + type : num
		return num
	} else if (type === '%%') {
		num = Number(num)
		return num.toFixed(2) + '%'
	} else if (type === '-') {
		return formatDate(num, 'day')
	} else if (type === ':') {
		num = Math.ceil(num)
		let h, m, s
		h = m = s = 0
		const wunH = 60 * 60,
			wunM = 60 // 单位秒, wun 通 one
		if (num >= wunH) {
			h = Math.floor(num / wunH)
			const remainder = num % wunH
			if (remainder >= wunM) {
				m = Math.floor(remainder / wunM)
				s = remainder % wunM
			} else {
				s = remainder
			}
		} else if (wunH >= num && num >= wunM) {
			m = Math.floor(num / wunM)
			s = num % wunM
		} else {
			s = num
		}
		const hms = [h, m, s].map(i => i < 10 ? '0' + i : i)
		return hms.join(type)
	} else if (type === ',') {
		return num.toLocaleString()
	} else {
		if (String(num).indexOf('.') > -1) {
			if (Math.abs(num) > 1) {
				num = num.toFixed(fix || 0)
			} else {
				num = num.toFixed(fix || 2)
			}
		}
		return num
	}
}

// 格式化日期，返回其所在的范围
function formatDate(date, type) {
	let d = new Date(date)
	if (type === 'hour') {
		let h = d.getHours()
		h = h < 10 ? '0' + h : h
		let str = `${h}:00 ~ ${h}:59`
		if (h === "00") {
			// 0 点的时候，显示为 yyyy-mm-dd（00:00 ~ 00:59）
			let firstday = parseDateTime(d)
			str = firstday + "（00:00 ~ 00:59）";
		}
		return str
	} else if (type === 'week') {
		const first = d.getDate() - d.getDay() + 1; // First day is the day of the month - the day of the week
		const last = first + 6; // last day is the first day + 6
		let firstday = new Date(d.setDate(first));
		firstday = parseDateTime(firstday)
		let lastday = new Date(d.setDate(last));
		lastday = parseDateTime(lastday)
		return `${firstday} ~ ${lastday}`
	} else if (type === 'month') {
		let firstday = new Date(d.getFullYear(), d.getMonth(), 1);
		firstday = parseDateTime(firstday)
		let lastday = new Date(d.getFullYear(), d.getMonth() + 1, 0);
		lastday = parseDateTime(lastday)
		return `${firstday} ~ ${lastday}`
	} else {
		return parseDateTime(d)
	}
}

// 格式化日期，返回其 yyyy-mm-dd 格式
function parseDateTime(datetime, type, splitor = '-') {
	let d = datetime
	if (typeof d !== 'object') {
		d = new Date(d)
	}
	const year = d.getFullYear()
	const month = d.getMonth() + 1
	const day = d.getDate()
	const hour = d.getHours()
	const minute = d.getMinutes()
	const second = d.getSeconds()
	const date = [year, lessTen(month), lessTen(day)].join(splitor)
	const time = [lessTen(hour), lessTen(minute), lessTen(second)].join(':')
	if (type === "dateTime") {
		return date + ' ' + time
	}
	return date
}

function lessTen(item) {
	return item < 10 ? '0' + item : item
}

// 获取指定日期当天或 n 天前零点的时间戳，丢弃时分秒
function getTimeOfSomeDayAgo(days = 0, date = Date.now()) {
	const d = new Date(date)
	const oneDayTime = 24 * 60 * 60 * 1000
	let ymd = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/')
	ymd = ymd + ' 00:00:00'
	const someDaysAgoTime = new Date(ymd).getTime() - oneDayTime * days
	return someDaysAgoTime
}

// 判断时间差值 delta，单位为天
function maxDeltaDay(times, delta = 2) {
	if (!times.length) return true
	const wunDay = 24 * 60 * 60 * 1000
	const [start, end] = times
	const max = end - start < wunDay * delta
	return max
}

// 查询 总设备数、总用户数， 通过 field 配置
function getFieldTotal(query = this.query, field = "total_devices") {
	let fieldTotal
	if (typeof query === 'object') {
		query = stringifyQuery(query, false, ['uni_platform'])
	}
	const db = uniCloud.database()
	return db.collection('uni-stat-result')
		.where(query)
		.field(`${field} as temp_${field}, start_time`)
		.groupBy('start_time')
		.groupField(`sum(temp_${field}) as ${field}`)
		.orderBy('start_time', 'desc')
		.get()
		.then(cur => {
			const data = cur.result.data
			fieldTotal = data.length && data[0][field]
			fieldTotal = format(fieldTotal)
			this.panelData && this.panelData.forEach(item => {
				if (item.field === field) {
					item.value = fieldTotal
				}
			})
			return Promise.resolve(fieldTotal)
		})
}

// 防抖函数
function debounce(fn, time = 100) {
	let timer = null
	return function(...args) {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn.apply(this, args)
		}, time)
	}
}


const files = {}

function fileToUrl(file) {
	for (const key in files) {
		if (files.hasOwnProperty(key)) {
			const oldFile = files[key]
			if (oldFile === file) {
				return key
			}
		}
	}
	let url = (window.URL || window.webkitURL).createObjectURL(file)
	files[url] = file
	return url
}
/**
 * 获取两个时间戳之间的所有时间
 * let start = new Date(1642694400000) // 2022-01-21 00:00:00
 * let end = new Date(1643644800000) // 2022-02-01 00:00:00
 * dateList = getAllDateCN(date1, date2)
 * @param {*} startTime
 * @param {*} endTime
 */
function getAllDateCN(startTime, endTime) {
	let date_all = [];
	let i = 0;
	while (endTime.getTime() - startTime.getTime() >= 0) {
		// 获取日期和时间
		// let year = startTime.getFullYear()
		// let month = startTime.getMonth() + 1
		// let day = startTime.getDate()
		// let time = startTime.toLocaleTimeString()
		date_all[i] = startTime.getTime()

		// 获取每天00:00:00的时间戳
		// date_all[i] = new Date(startTime.toLocaleDateString()).getTime() / 1000;

		// 天数+1
		startTime.setDate(startTime.getDate() + 1);
		i += 1;
	}
	return date_all;
}

function createUniStatQuery(object) {
	return Object.assign({}, object, {
		type: "native_app",
		create_env: "uni-stat"
	})
}


export {
	formatterData,
	fillTrendChartData,
	stringifyQuery,
	stringifyField,
	stringifyGroupField,
	mapfields,
	getTimeOfSomeDayAgo,
	division,
	format,
	formatDate,
	parseDateTime,
	maxDeltaDay,
	debounce,
	fileToUrl,
	getFieldTotal,
	getAllDateCN,
	createUniStatQuery
}
