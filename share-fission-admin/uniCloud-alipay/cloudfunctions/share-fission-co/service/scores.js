/**
 * 积分记录表 - 服务实现层
 * @module service/scores
 * @description 积分流水记录管理模块，提供积分变动记录的查询和备注更新功能
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} ScoreRecord
 * @property {string} [_id] - 记录ID
 * @property {string} user_id - 用户ID
 * @property {number} score - 积分变动值（正数为收入，负数为支出）
 * @property {number} type - 变动类型（1:收入 2:支出）
 * @property {number} balance - 变动后的积分余额
 * @property {string} source - 来源标识（如：ad_watch, withdraw, refund, order 等）
 * @property {string} [order_id] - 关联订单ID
 * @property {string} [withdrawal_id] - 关联提现记录ID
 * @property {string} [comment] - 备注说明
 * @property {number} [create_date] - 创建时间戳（毫秒）
 */

/**
 * @typedef {Object} ScoreListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词（按用户ID搜索）
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} ScoreListResult
 * @property {ScoreRecord[]} list - 积分记录列表
 * @property {number} total - 总记录数
 */

/**
 * 积分变动类型枚举
 * @readonly
 * @enum {number}
 */
const ScoreType = {
  /** 收入 */
  INCOME: 1,
  /** 支出 */
  EXPENSE: 2
};

/**
 * 积分来源枚举
 * @readonly
 * @enum {string}
 */
const ScoreSource = {
  /** 观看广告 */
  AD_WATCH: 'ad_watch',
  /** 提现 */
  WITHDRAW: 'withdraw',
  /** 提现退还 */
  WITHDRAW_REFUND: 'withdraw_refund',
  /** 订单消费 */
  ORDER: 'order',
  /** 订单退款 */
  REFUND: 'refund',
  /** 邀请奖励 */
  INVITE: 'invite',
  /** 系统奖励 */
  SYSTEM: 'system'
};

class ScoresService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.scores;
  }

  /**
   * 分页查询积分记录列表
   * @async
   * @function getList
   * @description 支持按用户ID搜索、自定义排序和分页。默认按创建时间倒序排列
   * @param {ScoreListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，按用户ID搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_date 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<ScoreListResult>} 返回积分记录列表和总数
   * @example
   * const result = await scoresService.getList({
   *   pageIndex: 1,
   *   pageSize: 10,
   *   keyword: 'user_xxx' // 按用户ID筛选
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 关键词搜索（按用户ID搜索）
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = this._.or([
          { user_id: keyword }
        ]);
      } else {
        where = this._.or([
          { user_id: new RegExp(keyword, 'i') }
        ]);
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按创建时间倒序
      query = query.orderBy('create_date', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    // 并行执行
    const [listResult, totalResult] = await Promise.all([
      query.skip(skip).limit(pageSize).get(),
      this.collection.where(where).count()
    ]);

    return {
      list: listResult.data,
      total: totalResult.total
    };
  }

  /**
   * 更新积分记录备注
   * @async
   * @function updateComment
   * @description 仅更新积分记录的备注字段，用于管理员添加说明
   * @param {string} _id - 记录ID
   * @param {string} comment - 备注内容，传空字符串则清空备注
   * @returns {Promise<{updated: number}>} 更新的记录数（0或1）
   * @example
   * await scoresService.updateComment('xxx', '管理员手动调整');
   */
  async updateComment(_id, comment) {
    const { updated } = await this.collection.doc(_id).update({
      comment: comment || ''
    });
    return { updated };
  }
}

module.exports = new ScoresService();
