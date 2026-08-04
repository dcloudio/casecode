/**
 * 广告观看记录表 - 服务实现层
 * @module service/adWatchLogs
 * @description 广告观看记录管理模块，提供广告观看记录的查询功能。
 * 用于追踪用户观看广告的行为和积分获取情况
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} AdWatchLog
 * @property {string} [_id] - 记录ID
 * @property {string} user_id - 用户ID
 * @property {string} ad_id - 广告ID
 * @property {string} ad_type - 广告类型（如：rewardedVideo, interstitial 等）
 * @property {number} [score_earned] - 获得的积分数量
 * @property {number} [watch_duration] - 观看时长（秒）
 * @property {boolean} [is_complete] - 是否完整观看
 * @property {string} [platform] - 平台标识（如：mp-alipay, mp-weixin）
 * @property {Object} [device_info] - 设备信息
 * @property {number} [create_time] - 创建时间戳（毫秒）
 */

/**
 * @typedef {Object} AdWatchLogQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词，支持按ID、用户ID、广告ID、广告类型搜索
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} AdWatchLogListResult
 * @property {AdWatchLog[]} list - 广告观看记录列表
 * @property {number} total - 总记录数
 */

/**
 * 广告类型枚举
 * @readonly
 * @enum {string}
 */
const AdType = {
  /** 激励视频广告 */
  REWARDED_VIDEO: 'rewardedVideo',
  /** 插屏广告 */
  INTERSTITIAL: 'interstitial',
  /** Banner 广告 */
  BANNER: 'banner',
  /** 原生广告 */
  NATIVE: 'native'
};

class AdWatchLogsService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.adWatchLogs;
  }

  /**
   * 分页查询广告观看记录列表
   * @async
   * @function getList
   * @description 使用聚合管道查询广告观看记录列表，关联用户表获取昵称和头像。
   * 支持关键词搜索（ID、用户ID、广告ID、广告类型）、自定义排序和分页。
   * 默认按创建时间倒序排列
   * @param {AdWatchLogQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按ID、用户ID、广告ID、广告类型搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按创建时间倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<AdWatchLogListResult>} 返回广告观看记录列表和总数
   * @example
   * // 查询某用户的广告观看记录
   * const result = await adWatchLogsService.getList({
   *   keyword: 'user_xxx',
   *   pageSize: 10
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    // 构建查询条件
    let where = {};

    // user_id 筛选
    if (user_id) {
      where.user_id = user_id;
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = {
          ...where,
          $or: [
            { _id: keyword },
            { user_id: keyword },
            { ad_id: keyword }
          ]
        };
      } else {
        where = {
          ...where,
          $or: [
            { user_id: { $regex: keyword, $options: 'i' } },
            { ad_id: { $regex: keyword, $options: 'i' } },
            { ad_type: { $regex: keyword, $options: 'i' } }
          ]
        };
      }
    }

    // 排序
    let orderBy = {};
    if (sortField && sortOrder) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy['create_time'] = 'desc';
    }

    // 第一次查询：获取广告观看记录列表和总数
    const [listResult, countResult] = await Promise.all([
      this.collection
        .where(where)
        .orderBy(orderBy)
        .skip((pageIndex - 1) * pageSize)
        .limit(pageSize)
        .get(),
      this.collection.where(where).count()
    ]);

    const list = listResult.data || [];
    const total = countResult.total || 0;

    // 如果没有数据，直接返回
    if (list.length === 0) {
      return { list: [], total: 0 };
    }

    // 第二次查询：批量获取用户信息
    const userIds = [...new Set(list.map(item => item.user_id))];
    const usersResult = await this.db.collection(Tables.users)
      .where({
        _id: this.db.command.in(userIds)
      })
      .field({
        _id: true,
        nickname: true,
        username: true,
        avatar: true
      })
      .get();

    // 构建用户信息映射
    const userMap = {};
    (usersResult.data || []).forEach(user => {
      userMap[user._id] = user;
    });

    // 合并用户信息到列表中
    const resultList = list.map(item => {
      const user = userMap[item.user_id] || {};
      return {
        ...item,
        user_nickname: user.nickname || null,
        user_username: user.username || null,
        user_avatar: user.avatar || null
      };
    });

    return {
      list: resultList,
      total
    };
  }
}

module.exports = new AdWatchLogsService();
