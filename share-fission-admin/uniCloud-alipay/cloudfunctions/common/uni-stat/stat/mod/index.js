/**
 * 基础对外模型
 */
module.exports = {
	BaseMod: require('./base'),
	SessionLog: require('./sessionLog'),
	UserSessionLog: require('./userSessionLog'),
	PageLog: require('./pageLog'),
	EventLog: require('./eventLog'),
	ShareLog: require('./shareLog'),
	ErrorLog: require('./errorLog'),
	AppCrashLogs: require('./appCrashLogs'),
	StatResult: require('./statResult'),
	ActiveUsers: require('./activeUsers'),
	ActiveDevices: require('./activeDevices'),
	PageResult: require('./pageResult'),
	PageDetailResult: require('./pageDetailResult'),
	EventResult: require('./eventResult'),
	ErrorResult: require('./errorResult'),
	Loyalty: require('./loyalty'),
	RunErrors: require('./runErrors'),
	uniPay: require('./uni-pay'),
	Setting: require('./setting'),
}
