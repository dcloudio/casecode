/**
 * 积分记录 - 模块控制器层（客户端API）
 * @module client/scores
 * @description 客户端API，所有操作都只能操作当前登录用户自己的积分记录。
 * 积分记录由系统自动生成，客户端只能查询，不能添加、修改或删除。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。所有方法都需要登录验证，因为只能查询当前用户自己的积分记录。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 所有方法都需要登录验证
    const noAuthFunctionNames = [];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 分页查询积分记录列表
   * @async
   * @function getList
   * @description 查询当前登录用户的积分记录列表，支持自定义排序和分页。
   * 默认按创建时间倒序排列。只能查询当前登录用户自己的数据。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 自动过滤，只返回当前用户的记录
   * - 不支持关键词搜索（客户端只能查看自己的记录，无需搜索）
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_date 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<Object>} 返回积分记录列表和总数，格式：{ list: Array, total: number }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询第一页数据
   * const result = await scores.getList({
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   * console.log(result.list); // 积分记录列表
   * console.log(result.total); // 总记录数
   *
   * @example
   * // 自定义排序
   * const result = await scores.getList({
   *   sortField: 'create_date',
   *   sortOrder: 'asc',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    // 客户端只能查询当前用户的积分记录，忽略用户传入的keyword参数
    const { keyword, ...restData } = data;
    return await service.scores.getList({
      ...restData,
      user_id: this.getUserId() // 只能查询当前用户的
    });
  },

  /**
   * 根据ID查询积分记录详情
   * @async
   * @function getById
   * @description 根据记录ID查询当前登录用户的积分记录详情。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能查询当前用户自己的记录
   * - 如果记录不存在或不属于当前用户，将返回 404 错误
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data._id - 记录ID（必填）
   * @returns {Promise<Object>} 返回积分记录详情对象，包含 _id、user_id、score、type、balance、source、source_user_id、relation_level、order_id、withdrawal_id、comment、create_date 等字段
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果记录不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询指定积分记录详情
   * const record = await scores.getById({
   *   _id: 'record_id_123'
   * });
   * console.log(record.score); // 积分变动值
   * console.log(record.type); // 变动类型（1:收入 2:支出）
   * console.log(record.balance); // 变动后的积分余额
   * console.log(record.source); // 来源标识
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.scores.getByWhere({
      _id,
      user_id: this.getUserId()
    });
    if (!info) {
      return fail(404001, { name: '积分记录' });
    }
    return info;
  }
}
