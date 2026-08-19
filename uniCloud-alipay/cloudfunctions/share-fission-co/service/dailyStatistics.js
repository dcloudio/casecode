/**
 * 每日统计表 - 服务实现层
 * @module service/dailyStatistics
 * @description 每日统计数据管理模块，提供按日期维度的统计数据查询功能。
 * 统计数据以日期（YYYY-MM-DD格式）作为文档ID存储
 */
const { Tables } = require('../constants');
const BaseService = require('./base');

/**
 * @typedef {Object} DailyStatistics
 * @property {string} _id - 日期，格式为 YYYY-MM-DD（如：2024-01-15）
 * @property {number} [new_users] - 新增用户数
 * @property {number} [active_users] - 活跃用户数
 * @property {number} [ad_watch_count] - 广告观看次数
 * @property {number} [ad_income] - 广告收入（元）
 * @property {number} [order_count] - 订单数量
 * @property {number} [order_amount] - 订单金额（积分）
 * @property {number} [withdrawal_count] - 提现申请数
 * @property {number} [withdrawal_amount] - 提现金额（元）
 * @property {number} [total_score_issued] - 发放积分总数
 * @property {number} [total_score_consumed] - 消耗积分总数
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} DailyStatisticsQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [startDate=''] - 开始日期，格式 YYYY-MM-DD
 * @property {string} [endDate=''] - 结束日期，格式 YYYY-MM-DD
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} DailyStatisticsListResult
 * @property {DailyStatistics[]} list - 统计数据列表
 * @property {number} total - 总记录数
 */

class DailyStatisticsService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.dailyStatistics;
  }

  /**
   * 分页查询每日统计数据列表
   * @async
   * @function getList
   * @description 支持日期范围筛选、自定义排序和分页。
   * 由于 _id 就是日期，所以日期范围筛选直接对 _id 进行比较。
   * 默认按日期倒序排列（最新的在前）
   * @param {DailyStatisticsQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.startDate=''] - 开始日期，格式 YYYY-MM-DD，筛选 >= startDate
   * @param {string} [data.endDate=''] - 结束日期，格式 YYYY-MM-DD，筛选 <= endDate
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 _id（日期）倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<DailyStatisticsListResult>} 返回统计数据列表和总数
   * @example
   * // 查询某日期范围内的统计数据
   * const result = await dailyStatisticsService.getList({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   pageSize: 31
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, startDate = '', endDate = '', sortField = '', sortOrder = 'desc', is_settled } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 结算状态筛选
    if (is_settled !== undefined) {
      where.is_settled = is_settled;
    }

    // 日期范围筛选（statement_date 就是日期）
    if (startDate && endDate) {
      where.statement_date = this._.gte(startDate).and(this._.lte(endDate));
    } else if (startDate) {
      where.statement_date = this._.gte(startDate);
    } else if (endDate) {
      where.statement_date = this._.lte(endDate);
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按日期倒序（最新的在前）
      query = query.orderBy('statement_date', 'desc');
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
   * 根据ID查询记录详情
   * @async
   * @function getById
   * @param {string} id - 记录ID
   * @returns {Promise<DailyStatistics>} 返回记录详情
   */
  async getById(id) {
    const res = await this.collection.doc(id).get();
    if (!res.data || res.data.length === 0) {
      throw new Error('记录不存在');
    }
    return res.data[0];
  }

  /**
   * 更新备注
   * @async
   * @function updateRemark
   * @description 更新记录的备注信息
   * @param {string} id - 记录ID
   * @param {string} remark - 备注内容
   * @returns {Promise<Object>} 返回更新结果
   */
  async updateRemark(id, remark) {
    if (!id) {
      throw new Error('记录ID不能为空');
    }

    // 检查记录是否存在
    await this.getById(id);

    const updateData = {
      remark: remark || '',
      update_time: Date.now()
    };

    const res = await this.collection.doc(id).update(updateData);
    return res;
  }

  /**
   * 填写广告收入并更新资金池（事务）
   * @async
   * @function fillRevenue
   * @description 使用事务确保填写广告收益和更新资金池的原子性操作
   * @param {Object} data - 收益数据
   * @param {string} data._id - 记录ID (YYYY-MM-DD)
   * @param {number} data.ad_revenue - 广告收入
   * @param {number} data.score_added - 新增积分
   * @param {string} [data.remark] - 备注
   * @returns {Promise<Object>} 返回操作结果
   */
  async fillRevenue(data) {
    const { _id, ad_revenue, score_added, remark = '' } = data;

    if (!_id) {
      throw new Error('记录ID不能为空');
    }

    // 检查记录是否存在
    const record = await this.getById(_id);
    if (record.is_settled) {
      throw new Error('该记录已结算，无法修改');
    }
    const transaction = await this.db.startTransaction();

    try {
      const now = Date.now();

      // 1. 更新统计记录
      const updateData = {
        ad_revenue,
        // score_added, // score_added通常是统计出来的，这里主要是确认结算，所以主要更新ad_revenue和is_settled
        is_settled: true,
        update_time: now
      };
      if (remark !== undefined) {
        updateData.remark = remark;
      }

      await transaction.collection(this.tableName).doc(_id).update(updateData);

      // 2. 调用资金池服务的通用方法更新资金池和记录流水
      const fundPoolLogsService = require('./fundPoolLogs');
      const poolResult = await fundPoolLogsService._updatePoolInTransaction(transaction, {
        cash_change: ad_revenue,
        score_change: score_added || 0, // 结算时将新增积分计入资金池（如果有变动逻辑）
        type: 'ad_income',
        remark: remark || '广告收入结算',
        related_id: _id,
        create_time: now
      });

      // 提交事务
      await transaction.commit();

      return {
        success: true,
        message: '填写广告收入成功',
        data: {
          ad_revenue,
          score_added,
          cash_balance: poolResult.cash_balance,
          exchange_rate: poolResult.exchange_rate
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new DailyStatisticsService();
