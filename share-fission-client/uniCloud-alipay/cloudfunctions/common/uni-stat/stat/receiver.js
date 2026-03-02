/**
 * @class UniStatReportDataReceiver uni统计上报数据接收器
 * @function report 上报数据调度处理函数
 */
const {
	parseUrlParams
} = require('../shared')
const SessionLog = require('./mod/sessionLog')
const PageLog = require('./mod/pageLog')
const EventLog = require('./mod/eventLog')
const ErrorLog = require('./mod/errorLog')
const AppCrashLog = require('./mod/appCrashLogs.js')
const Device = require('./mod/device')
class UniStatReportDataReceiver {
	/**
	 * @description 上报数据调度处理函数
	 * @param {Object} params 基础上报参数
	 * @param {Object} context 请求附带的上下文信息
	 */
	async report(params, context) {
		let res = {
			code: 0,
			msg: 'success'
		}

		if (!params || !params.requests) {
			return {
				code: 200,
				msg: 'Invild params'
			}
		}

		// JSON参数解析
		const requestParam = JSON.parse(params.requests)
		if (!requestParam || requestParam.length === 0) {
			return {
				code: 200,
				msg: 'Invild params'
			}
		}

		// 日志填充
		const sessionParams = []
		const pageParams = []
		const eventParams = []
		const appCrashParams = []
		const errorParams = []
		const device = new Device()
		for (const ri in requestParam) {
			//参数解析
			const urlParams = parseUrlParams(requestParam[ri], context)
			if (!urlParams.ak) {
				return {
					code: 201,
					msg: 'Not found appid'
				}
			}

			if (!urlParams.lt) {
				return {
					code: 202,
					msg: 'Not found this log type'
				}
			}

			switch (parseInt(urlParams.lt)) {
				// 会话日志
				case 1: {
					sessionParams.push(urlParams)
					break
				}
				// 页面日志
				case 3:
				case 11: {
					pageParams.push(urlParams)
					break
				}
				// 事件日志
				case 21: {
					eventParams.push(urlParams)
					break
				}
				// 错误日志
				case 31: {
					errorParams.push(urlParams)
					break
				}
				//uni-app x应用崩溃日志
				case 41: {
					appCrashParams.push(urlParams)
				}
				//unipush信息绑定
				case 101: {
					res = await device.bindPush(urlParams)
					break
				}
				default: {
					console.log('Invalid type by param "lt:' + urlParams.lt + '"')
					break
				}
			}
		}

		//会话日志填充
		if (sessionParams.length > 0) {
			const sessionLog = new SessionLog()
			res = await sessionLog.batchFill(sessionParams)
		}

		//页面日志填充
		if (pageParams.length > 0) {
			const pageLog = new PageLog()
			res = await pageLog.fill(pageParams)
		}

		//事件日志填充
		if (eventParams.length > 0) {
			const eventLog = new EventLog()
			res = await eventLog.fill(eventParams)
		}

		//错误日志填充
		if (errorParams.length > 0) {
			const errorLog = new ErrorLog()
			res = await errorLog.fill(errorParams)
		}

		//uni-app x应用崩溃日志填充
		if(appCrashParams.length > 0) {
			const appCrashLog = new AppCrashLog()
			res = await appCrashLog.fill(appCrashParams)
		}

		return res
	}
}

module.exports = UniStatReportDataReceiver
