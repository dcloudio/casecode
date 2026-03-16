/**
 * 服务层模块聚合导出
 * @module service
 * @description 统一导出所有服务模块，提供给云函数调用。
 * 每个服务模块对应一个数据库表的业务逻辑实现
 *
 * @example
 * // 在云函数中使用
 * const service = require('./service');
 *
 * // 调用用户服务
 * const users = await service.user.getList({ pageIndex: 1 });
 *
 * // 调用商品服务
 * const goods = await service.goods.getById('xxx');
 */

/**
 * 系统配置服务
 * @type {import('./config')}
 */
const config = require('./config');

/**
 * Demo 示例服务
 * @type {import('./demo')}
 */
const demo = require('./demo');

/**
 * 用户管理服务
 * @type {import('./user')}
 */
const user = require('./user');

/**
 * 积分记录服务
 * @type {import('./scores')}
 */
const scores = require('./scores');

/**
 * 提现记录服务
 * @type {import('./withdrawalLogs')}
 */
const withdrawalLogs = require('./withdrawalLogs');

/**
 * 广告观看记录服务
 * @type {import('./adWatchLogs')}
 */
const adWatchLogs = require('./adWatchLogs');

/**
 * 资金池流水服务
 * @type {import('./fundPoolLogs')}
 */
const fundPoolLogs = require('./fundPoolLogs');

/**
 * 商品管理服务
 * @type {import('./goods')}
 */
const goods = require('./goods');

/**
 * 卡密管理服务
 * @type {import('./cardKeys')}
 */
const cardKeys = require('./cardKeys');

/**
 * 商品分类服务
 * @type {import('./goodsCategories')}
 */
const goodsCategories = require('./goodsCategories');

/**
 * 订单管理服务
 * @type {import('./orders')}
 */
const orders = require('./orders');

/**
 * 每日统计服务
 * @type {import('./dailyStatistics')}
 */
const dailyStatistics = require('./dailyStatistics');

module.exports = {
  /** @see module:service/config */
  config,
  /** @see module:service/demo */
  demo,
  /** @see module:service/user */
  user,
  /** @see module:service/scores */
  scores,
  /** @see module:service/withdrawalLogs */
  withdrawalLogs,
  /** @see module:service/adWatchLogs */
  adWatchLogs,
  /** @see module:service/fundPoolLogs */
  fundPoolLogs,
  /** @see module:service/goods */
  goods,
  /** @see module:service/cardKeys */
  cardKeys,
  /** @see module:service/goodsCategories */
  goodsCategories,
  /** @see module:service/orders */
  orders,
  /** @see module:service/dailyStatistics */
  dailyStatistics
};
