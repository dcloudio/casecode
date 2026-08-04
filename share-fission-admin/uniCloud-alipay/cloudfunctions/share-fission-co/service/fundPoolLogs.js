/**
 * 资金池流水 - 服务实现层
 * @module service/fundPoolLogs
 * @description 资金池管理模块，提供资金池信息查询和资金流水记录查询功能
 */
const { Tables } = require('../constants');
const BaseService = require('./base');

/**
 * @typedef {Object} FundPool
 * @property {string} [_id] - 资金池ID（固定为 'main'）
 * @property {number} total_cash - 资金池总现金（元）
 * @property {number} total_score - 资金池总积分
 * @property {number} exchange_rate - 积分兑换比例（1积分 = exchange_rate 元）
 * @property {number} minimum_exchange_ratio - 保底兑换比例（元/积分）
 * @property {number} [update_time] - 最后更新时间戳（毫秒）
 */

/**
 * @typedef {Object} FundPoolLog
 * @property {string} [_id] - 记录ID
 * @property {string} type - 流水类型（如：recharge, withdraw, ad_income 等）
 * @property {number} [cash_change] - 现金变动金额（元）
 * @property {number} [score_change] - 积分变动数量
 * @property {number} [cash_balance] - 变动后现金余额
 * @property {number} [score_balance] - 变动后积分余额
 * @property {string} [related_id] - 关联业务ID
 * @property {string} [comment] - 备注说明
 * @property {number} [create_time] - 创建时间戳（毫秒）
 */

/**
 * @typedef {Object} FundPoolLogQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [type] - 类型筛选
 * @property {number} [startTime] - 开始时间戳（毫秒）
 * @property {number} [endTime] - 结束时间戳（毫秒）
 * @property {string} [sortField='create_time'] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} FundPoolLogListResult
 * @property {FundPoolLog[]} list - 流水记录列表
 * @property {number} total - 总记录数
 */

/**
 * 资金池流水类型枚举
 * @readonly
 * @enum {string}
 */
const FundPoolLogType = {
  /** 充值 */
  RECHARGE: 'recharge',
  /** 提现支出 */
  WITHDRAW: 'withdraw',
  /** 广告收入 */
  AD_INCOME: 'ad_income',
  /** 订单收入 */
  ORDER_INCOME: 'order_income',
  /** 退款支出 */
  REFUND: 'refund',
  /** 系统调整 */
  SYSTEM_ADJUST: 'system_adjust'
};

class FundPoolLogsService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.fundPoolLogs;
    // 额外需要用到的集合
    this.poolCollection = this.db.collection(Tables.fundPool);
    this.configCollection = this.db.collection(Tables.systemConfig);
  }

  /**
   * 获取资金池信息
   * @async
   * @function getPool
   * @description 获取资金池当前状态，包括总现金、总积分、兑换比例和保底兑换比例。
   * 如果资金池记录不存在，返回默认值
   * @returns {Promise<FundPool>} 资金池信息对象
   * @example
   * const pool = await fundPoolLogsService.getPool();
   * console.log(`总现金: ${pool.total_cash}, 总积分: ${pool.total_score}`);
   */
  async getPool() {
    // 并行查询资金池和系统配置
    const [poolResult, configResult] = await Promise.all([
      this.poolCollection.doc('main').get(),
      this.configCollection.doc('main').get()
    ]);

    const pool = poolResult.data[0] || {
      total_cash: 0,
      total_score: 0,
      exchange_rate: 0.01,
      update_time: null
    };

    const config = configResult.data[0] || {};

    // 添加保底兑换比例
    pool.minimum_exchange_ratio = config.minimum_exchange_ratio || 0;

    return pool;
  }

  /**
   * 分页查询资金池流水列表
   * @async
   * @function getList
   * @description 支持类型筛选、时间范围筛选、自定义排序和分页。默认按创建时间倒序排列
   * @param {FundPoolLogQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.type] - 类型筛选
   * @param {number} [data.startTime] - 开始时间戳（毫秒），筛选 create_time >= startTime
   * @param {number} [data.endTime] - 结束时间戳（毫秒），筛选 create_time <= endTime
   * @param {string} [data.sortField='create_time'] - 排序字段
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<FundPoolLogListResult>} 返回流水记录列表和总数
   * @example
   * // 查询某时间段内的充值记录
   * const result = await fundPoolLogsService.getList({
   *   type: 'recharge',
   *   startTime: 1704067200000,
   *   endTime: 1704153600000
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, type, startTime, endTime, sortField = 'create_time', sortOrder = 'desc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 类型筛选
    if (type) {
      where.type = type;
    }
    // 时间范围筛选
    if (startTime && endTime) {
      where.create_time = this._.gte(startTime).and(this._.lte(endTime));
    } else if (startTime) {
      where.create_time = this._.gte(startTime);
    } else if (endTime) {
      where.create_time = this._.lte(endTime);
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      query = query.orderBy('create_time', 'desc');
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
   * 更新资金池并记录流水（内部方法）
   * @async
   * @private
   * @function _updatePoolInTransaction
   * @description 在事务中更新资金池余额、计算汇率并记录流水日志
   * @param {Object} transaction - 事务对象
   * @param {Object} params - 参数对象
   * @param {number} params.cash_change - 现金变动金额（元）
   * @param {number} params.score_change - 积分变动数量
   * @param {string} params.type - 流水类型
   * @param {string} [params.remark=''] - 备注说明
   * @param {string} [params.related_id] - 关联业务ID
   * @param {number} [params.create_time] - 创建时间戳，不传则使用当前时间
   * @returns {Promise<Object>} 返回更新结果
   */
  async _updatePoolInTransaction(transaction, params) {
    const { cash_change, score_change = 0, type, remark = '', related_id, create_time } = params;
    const now = create_time || Date.now();

    // 1. 更新资金池
    const poolUpdateData = {
      total_cash: this._.inc(cash_change),
      update_time: now
    };
    if (score_change > 0) {
      poolUpdateData.total_score = this._.inc(score_change);
    }

    const { doc: updatedPool } = await transaction.collection(Tables.fundPool)
      .doc('main')
      .updateAndReturn(poolUpdateData);

    if (!updatedPool) {
      throw new Error('更新资金池失败');
    }

    // 2. 获取更新后的资金池数据
    const cash_balance = updatedPool.total_cash;
    const score_balance = updatedPool.total_score || 0;

    // 3. 重新计算汇率
    let new_exchange_rate = updatedPool.exchange_rate;
    if (score_balance > 0) {
      new_exchange_rate = Math.floor((cash_balance / score_balance) * 10000) / 10000;
    }

    // 4. 如果汇率有变化，更新资金池的汇率
    if (new_exchange_rate !== updatedPool.exchange_rate) {
      await transaction.collection(Tables.fundPool).doc('main').update({
        exchange_rate: new_exchange_rate
      });
    }

    // 5. 添加资金池流水日志
    const log = {
      type,
      cash_change,
      score_change,
      cash_balance,
      score_balance,
      exchange_rate: new_exchange_rate,
      remark,
      create_time: now
    };

    if (related_id) {
      log.related_id = related_id;
    }

    await transaction.collection(this.tableName).add(log);

    return {
      cash_balance,
      score_balance,
      exchange_rate: new_exchange_rate
    };
  }

  /**
   * 投入资金到资金池
   * @async
   * @function addFund
   * @description 管理员向资金池投入资金，先更新资金池余额和汇率，再记录流水日志
   * @param {number} amount - 投入金额（元）
   * @param {string} [remark=''] - 备注说明
   * @param {number} score - 积分
   * @returns {Promise<Object>} 返回操作结果
   * @throws {Error} 当投入金额无效时抛出错误
   * @example
   * const result = await fundPoolLogsService.addFund(1000, '初始资金投入', 0);
   */
  async addFund(amount, remark = '', score = 0) {
    if (!amount || amount <= 0) {
      throw new Error('投入金额必须大于0');
    }

    const transaction = await this.db.startTransaction();

    try {
      // 调用通用方法更新资金池
      const result = await this._updatePoolInTransaction(transaction, {
        cash_change: amount,
        score_change: score,
        type: 'deposit',
        remark: remark || '管理员投入资金'
      });

      // 提交事务
      await transaction.commit();

      return {
        success: true,
        message: '投入资金成功',
        data: {
          amount,
          score,
          cash_balance: result.cash_balance,
          exchange_rate: result.exchange_rate
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new FundPoolLogsService();
