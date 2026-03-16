const {
	createApi
} = require('./shared/index')

let reportDataReceiver, dataStatCron
module.exports = {
	//uni统计数据上报数据接收器初始化
	initReceiver: (options = {}) => {
		if(!reportDataReceiver) {
			reportDataReceiver = require('./stat/receiver')
		}
		options.clientType = options.clientType || __ctx__.PLATFORM
		return createApi(reportDataReceiver, options)
	},
	//uni统计数据统计模块初始化
	initStat: (options = {}) => {
		if(!dataStatCron) {
			dataStatCron = require('./stat/stat')
		}
		options.clientType = options.clientType || __ctx__.PLATFORM
		return createApi(dataStatCron, options)
	}
}
