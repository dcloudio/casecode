/**
 * Demo 示例表 - 服务实现层
 * @module service/demo
 * @description 员工管理示例模块，提供员工信息的增删改查功能，用于演示标准 CRUD 操作
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} Employee
 * @property {string} [_id] - 员工记录ID
 * @property {string} name - 姓名
 * @property {number} [age] - 年龄
 * @property {string} [department] - 部门
 * @property {string} [city] - 城市
 * @property {string} [email] - 邮箱
 * @property {string} [phone] - 电话
 * @property {string} [address] - 地址
 * @property {number} [salary] - 薪资
 * @property {string} [joinDate] - 入职日期
 * @property {string} [status] - 状态
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} ListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词，支持按姓名、部门搜索
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} ListResult
 * @property {Employee[]} list - 员工列表
 * @property {number} total - 总记录数
 */

class DemoService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.demoEmployee;
  }

  /**
   * 分页查询员工列表
   * @async
   * @function getList
   * @description 支持关键词搜索（姓名、部门）、自定义排序和分页。默认按创建时间倒序排列
   * @param {ListQueryParams} [data={}] - 查询参数对象
   * @param {string} [data.user_id=''] - 用户id
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按姓名、部门模糊搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_time 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<ListResult>} 返回列表数据和总数
   * @example
   * const result = await demoService.getList({
   *   pageIndex: 1,
   *   pageSize: 10,
   *   keyword: '张三'
   * });
   * console.log(result.list); // 员工列表
   * console.log(result.total); // 总数
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    // 构建查询条件数组，最后用 _.and 组合
    let conditions = [];

    if (user_id) {
      conditions.push({ user_id });
    }

    // 关键词搜索
    if (keyword) {
      let keywordCondition;
      if (libs.common.isObjectId(keyword)) {
        keywordCondition = this._.or([
          { name: keyword },
          { department: keyword }
        ]);
      } else {
        keywordCondition = this._.or([
          { name: new RegExp(keyword, 'i') },
          { department: new RegExp(keyword, 'i') }
        ]);
      }
      conditions.push(keywordCondition);
    }

    // 组合最终的 where 条件
    let where = {};
    if (conditions.length > 0) {
      where = this._.and(conditions);
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

    // 辅助排序，保证分页顺序稳定性
    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    // 并行执行查询列表和查询总数，提高响应速度
    const [listResult, totalResult] = await Promise.all([
      query.skip(skip).limit(pageSize).get(),
      this.collection.where(where).count()
    ]);

    return {
      list: listResult.data,
      total: totalResult.total
    };
  }
}

module.exports = new DemoService();
