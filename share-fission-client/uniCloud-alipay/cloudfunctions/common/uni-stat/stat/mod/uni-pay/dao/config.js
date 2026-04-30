/**
 * 表名
 */
const dbName = {
	uniIdUsers: 'uni-id-users', // 支付订单明细表
	uniPayOrders: 'uni-pay-orders', // 支付订单明细表
	uniStatPayResult: 'uni-stat-pay-result', // 统计结果存储表
	uniStatSessionLogs: 'uni-stat-session-logs', // 设备会话日志表（主要用于统计访问设备数）
	uniStatUserSessionLogs: 'uni-stat-user-session-logs', // 用户会话日志表（主要用于统计访问人数）
};

module.exports = dbName;
