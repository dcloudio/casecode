// 数据库表名称常量

/**
 * 数据库表名称定义
 * 统一管理所有数据库表名，便于维护和修改
 */
const Tables = {
  // ========== 业务表 ==========
  // 商品表
  goods: 'sf-goods',
  // 商品分类表
  goodsCategories: 'sf-goods-categories',
  // 订单表
  orders: 'sf-orders',
  // 卡密表
  cardKeys: 'sf-card-keys',
  // 提现记录表
  withdrawalLogs: 'sf-withdrawal-logs',
  // 广告观看记录表
  adWatchLogs: 'sf-ad-watch-logs',
  // 资金池表
  fundPool: 'sf-fund-pool',
  // 资金池流水表
  fundPoolLogs: 'sf-fund-pool-logs',
  // 每日统计表
  dailyStatistics: 'sf-daily-statistics',

  // ========== 系统表 ==========
  // 系统配置表
  systemConfig: 'sf-system-config',
  // 示例员工表
  demoEmployee: 'sf-demo-employee',

  // ========== uni-id 相关表 ==========
  // 用户表
  users: 'uni-id-users',
  // 用户积分表
  scores: 'uni-id-scores',
  // 用户标签表
  tags: 'uni-id-tag',
  // 用户登录日志表
  loginLogs: 'uni-id-log',
  // ========== opendb 公共表 ==========
  // 签到表
  signIn: 'opendb-sign-in',
}

module.exports = {
  Tables
}
