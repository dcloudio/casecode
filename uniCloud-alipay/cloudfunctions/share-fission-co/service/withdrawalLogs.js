/**
 * 提现记录 - 服务实现层
 * @module service/withdrawalLogs
 * @description 用户提现申请管理模块，提供提现记录查询、审核、打款等功能
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} AccountInfo
 * @property {string} type - 账户类型（如：alipay, wechat, bank）
 * @property {string} account - 账号
 * @property {string} name - 账户姓名
 */

/**
 * @typedef {Object} WithdrawalRecord
 * @property {string} [_id] - 记录ID
 * @property {string} user_id - 用户ID
 * @property {number} score - 提现积分数量
 * @property {number} amount - 提现金额（元）
 * @property {AccountInfo} account_info - 收款账户信息
 * @property {number} status - 状态（0:待审核 1:审核通过 2:审核拒绝 3:已打款）
 * @property {string} [reject_reason] - 拒绝原因（状态为2时存在）
 * @property {number} [create_time] - 申请时间戳（毫秒）
 * @property {number} [audit_time] - 审核时间戳（毫秒）
 * @property {number} [pay_time] - 打款时间戳（毫秒）
 */

/**
 * @typedef {Object} WithdrawalListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词，支持按用户ID、账号、姓名搜索
 * @property {number} [status] - 状态筛选（0:待审核 1:审核通过 2:审核拒绝 3:已打款）
 * @property {string} [sortField='create_time'] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} WithdrawalListResult
 * @property {WithdrawalRecord[]} list - 提现记录列表
 * @property {number} total - 总记录数
 */

/**
 * 提现状态枚举
 * @readonly
 * @enum {number}
 */
const WithdrawalStatus = {
  /** 待审核 */
  PENDING: 0,
  /** 审核通过 */
  APPROVED: 1,
  /** 审核拒绝 */
  REJECTED: 2,
  /** 已打款 */
  PAID: 3
};

class WithdrawalLogsService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.withdrawalLogs;
    // 额外需要用到的集合
    this.usersCollection = this.db.collection(Tables.users);
    this.scoresCollection = this.db.collection(Tables.scores);
    this.configCollection = this.db.collection(Tables.systemConfig);
  }

  /**
   * 申请提现
   * @async
   * @function apply
   * @description 用户申请提现，会自动计算手续费和实际到账金额，并扣除用户积分
   * @param {Object} data - 提现申请数据
   * @param {string} data.user_id - 用户ID
   * @param {number} data.score - 提现积分数量
   * @param {string} data.method - 提现方式（alipay/bank）
   * @param {Object} data.account_info - 收款账户信息
   * @returns {Promise<{id: string}>} 返回新创建的提现记录ID
   * @throws {Error} 提现积分必须大于0
   * @throws {Error} 提现积分不能低于最低提现积分
   * @throws {Error} 用户不存在
   * @throws {Error} 积分不足
   * @example
   * const result = await withdrawalLogsService.apply({
   *   user_id: 'xxx',
   *   score: 1000,
   *   method: 'alipay',
   *   account_info: { type: 'alipay', account: '13800138000', name: '张三' }
   * });
   */
  async apply(data) {
    const { user_id, score, method, account_info } = data;

    // 参数验证
    if (!score || score <= 0) {
      throw new Error('提现积分必须大于0');
    }

    // 获取系统配置
    const { data: [config] } = await this.configCollection.doc('main').get();
    const withdrawalMinScore = config?.withdrawal_min_score || 1000;
    const withdrawalFeeRate = config?.withdrawal_fee_rate || 0.2;
    // 积分兑换比例：默认1000积分=1元（即 0.001）
    const baseExchangeRate = config?.ad_score_rate ? (1 / config.ad_score_rate) : 0.001;
    // 保底兑换比例
    const minimumExchangeRatio = config?.minimum_exchange_ratio || 0;

    // 确定最终使用的兑换比例：如果保底比例大于实际比例，则使用保底比例
    const exchangeRate = (minimumExchangeRatio > 0 && minimumExchangeRatio > baseExchangeRate)
      ? minimumExchangeRatio
      : baseExchangeRate;

    // 检查最低提现积分
    if (score < withdrawalMinScore) {
      throw new Error(`提现积分不能低于${withdrawalMinScore}积分`);
    }

    // 获取用户信息
    const { data: [user] } = await this.usersCollection.doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查积分是否足够
    const currentScore = user.score || 0;
    if (currentScore < score) {
      throw new Error('积分不足');
    }

    // 计算金额
    const amount = score * exchangeRate; // 兑换金额（元）
    const fee = amount * withdrawalFeeRate; // 手续费（元）
    const actualAmount = amount - fee; // 实际到账（元）

    // 创建提现记录
    const now = Date.now();
    const withdrawalRecord = {
      user_id,
      score,
      exchange_rate: exchangeRate,
      amount,
      fee_rate: withdrawalFeeRate,
      fee,
      actual_amount: actualAmount,
      method,
      account_info,
      status: WithdrawalStatus.PENDING, // 待审核
      create_time: now
    };

    const { id } = await this.collection.add(withdrawalRecord);

    // 扣除用户积分
    const newBalance = currentScore - score;
    await this.usersCollection.doc(user_id).update({
      score: this._.inc(-score),
      score_withdrawn: this._.inc(score)
    });

    // 添加积分变动记录
    await this.scoresCollection.add({
      user_id,
      score: -score,
      type: 2, // 2=支出
      balance: newBalance,
      source: 'withdraw_apply',
      withdrawal_id: id,
      comment: '提现申请',
      create_date: now
    });

    return { id };
  }

  /**
   * 分页查询提现记录列表
   * @async
   * @function getList
   * @description 支持状态筛选、关键词搜索（用户ID、账号、姓名）、自定义排序和分页。
   * 默认按创建时间倒序排列
   * @param {WithdrawalListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按用户ID、账号、姓名搜索
   * @param {number} [data.status] - 状态筛选（0:待审核 1:审核通过 2:审核拒绝 3:已打款）
   * @param {string} [data.sortField='create_time'] - 排序字段
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<WithdrawalListResult>} 返回提现记录列表和总数
   * @example
   * // 查询待审核的提现申请
   * const result = await withdrawalLogsService.getList({
   *   status: 0,
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', status, sortField = 'create_time', sortOrder = 'desc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }
    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = {
          ...where,
          ...this._.or([
            { user_id: keyword },
            { 'account_info.account': keyword }
          ])
        };
      } else {
        where = {
          ...where,
          ...this._.or([
            { user_id: new RegExp(keyword, 'i') },
            { 'account_info.account': new RegExp(keyword, 'i') },
            { 'account_info.name': new RegExp(keyword, 'i') }
          ])
        };
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
   * 审核提现申请
   * @async
   * @function audit
   * @description 审核提现申请，支持通过或拒绝��拒绝时会自动退还积分并创建退还记录
   * @param {string} _id - 记录ID
   * @param {number} status - 审核状态（1:通过 2:拒绝）
   * @param {string} [reject_reason] - 拒绝原因（拒绝时必填）
   * @returns {Promise<{updated: number}>} 更新的记录数
   * @throws {Error} 记录不存在
   * @throws {Error} 该记录已审核，不可重复操作
   * @example
   * // 审核通过
   * await withdrawalLogsService.audit('xxx', 1);
   *
   * // 审核拒绝
   * await withdrawalLogsService.audit('xxx', 2, '账户信息有误');
   */
  async audit(_id, status, reject_reason) {
    // 检查当前状态
    const { data: [record] } = await this.collection.doc(_id).get();
    if (!record) {
      throw new Error('记录不存在');
    }
    if (record.status !== 0) {
      throw new Error('该记录已审核，不可重复操作');
    }

    const transaction = await this.db.startTransaction();

    try {
      const now = Date.now();
      const updateData = {
        status,
        audit_time: now
      };

      if (status === 2 && reject_reason) {
        updateData.reject_reason = reject_reason;
      }

      // 更新审核状态
      await transaction.collection(this.tableName).doc(_id).update(updateData);

      // 拒绝时退还积分
      if (status === 2) {
        await this._refundScoreInTransaction(transaction, record);
      }

      // 提交事务
      await transaction.commit();

      return { updated: 1 };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 在事务中退还积分（内部方法）
   * @async
   * @function _refundScoreInTransaction
   * @private
   * @description 在事务中退还用户积分并创建积分变动记录
   * @param {Object} transaction - 事务对象
   * @param {WithdrawalRecord} record - 提现记录对象
   * @throws {Error} 用户不存在
   */
  async _refundScoreInTransaction(transaction, record) {
    const { user_id, score, _id: withdrawal_id } = record;

    // 获取用户当前积分
    const { data: user } = await transaction.collection(Tables.users).doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }

    const currentScore = user.score || 0;
    const newBalance = currentScore + score;

    // 更新用户积分
    await transaction.collection(Tables.users).doc(user_id).update({
      score: this._.inc(score),
      score_withdrawn: this._.inc(score * -1)
    });

    // 添加积分退还记录
    await transaction.collection(Tables.scores).add({
      user_id,
      score: score,
      type: 1, // 1=收入
      balance: newBalance,
      source: 'withdraw_refund',
      withdrawal_id,
      comment: '提现申请被拒绝，积分退还',
      create_date: Date.now()
    });
  }

  /**
   * 确认打款
   * @async
   * @function pay
   * @description 将已通过审核的提现申请标记为已打款
   * @param {string} _id - 记录ID
   * @returns {Promise<{updated: number}>} 更新的记录数
   * @throws {Error} 记录不存在
   * @throws {Error} 只有已通过审核的记录才能打款
   * @example
   * await withdrawalLogsService.pay('xxx');
   */
  async pay(_id) {
    // 检查当前状态
    const { data: [record] } = await this.collection.doc(_id).get();
    if (!record) {
      throw new Error('记录不存在');
    }
    if (record.status !== 1) {
      throw new Error('只有已通过审核的记录才能打款');
    }

    const updateData = {
      status: 3,
      pay_time: Date.now()
    };

    const { updated } = await this.collection.doc(_id).update(updateData);
    return { updated };
  }
}

module.exports = new WithdrawalLogsService();
