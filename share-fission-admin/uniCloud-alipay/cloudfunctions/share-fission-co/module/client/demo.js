/**
 * Demo 示例 - 模块控制器层（客户端API）
 * @module client/demo
 * @description 客户端API，所有操作都只能操作当前登录用户自己的数据。
 * 这是一个示例模块，用于演示标准的 CRUD 操作实现方式。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。根据方法名判断是否需要登录验证。
   * 除了 test 方法外，其他所有方法都需要登录验证。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 定义不需要登录的函数名
    const noAuthFunctionNames = ["test"];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 分页查询记录列表
   * @async
   * @function getList
   * @description 查询当前登录用户的记录列表，支持关键词搜索、自定义排序和分页。
   * 默认按创建时间倒序排列。只能查询当前登录用户自己的数据。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 自动过滤，只返回当前用户的记录
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按 parame1、parame2 模糊搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_time 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<Object>} 返回记录列表和总数，格式：{ list: Array, total: number }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询第一页数据
   * const result = await demo.getList({
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   * console.log(result.list); // 记录列表
   * console.log(result.total); // 总记录数
   *
   * @example
   * // 关键词搜索
   * const result = await demo.getList({
   *   keyword: '搜索关键词',
   *   pageIndex: 1,
   *   pageSize: 10
   * });
   *
   * @example
   * // 自定义排序
   * const result = await demo.getList({
   *   sortField: 'create_time',
   *   sortOrder: 'asc',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    return await service.demo.getList({
      ...data,
      user_id: this.getUserId() // 只能查询当前用户的
    });
  },

  /**
   * 根据ID查询记录详情
   * @async
   * @function getById
   * @description 根据记录ID查询当前登录用户的记录详情。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能查询当前用户自己的记录
   * - 如果记录不存在或不属于当前用户，将返回 404 错误
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data._id - 记录ID（必填）
   * @returns {Promise<Object>} 返回记录详情对象，包含 _id, parame1, parame2, user_id, create_time, update_time 等字段
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果记录不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询指定记录详情
   * const record = await demo.getById({
   *   _id: 'record_id_123'
   * });
   * console.log(record.parame1); // 参数1的值
   * console.log(record.parame2); // 参数2的值
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.demo.getByWhere({
      _id,
      user_id: this.getUserId()
    });
    if (!info) {
      return fail(404001, { name: '记录' });
    }
    return info;
  },

  /**
   * 添加新记录
   * @async
   * @function add
   * @description 创建一条新记录。客户端必须使用解构赋值的方式提取能被用户添加的字段，
   * 确保用户无法直接设置 user_id、_id 等系统字段。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 系统会自动填充 user_id（当前登录用户ID）和 create_time（创建时间）
   * - parame1 和 parame2 为必填字段
   *
   * @param {Object} [data={}] - 添加参数对象
   * @param {string} data.parame1 - 参数1（必填）
   * @param {string} data.parame2 - 参数2（必填）
   * @returns {Promise<Object>} 返回创建成功的记录对象，包含 _id, parame1, parame2, user_id, create_time 等字段
   * @throws {Object} 如果 parame1 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果 parame2 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 添加一条新记录
   * const record = await demo.add({
   *   parame1: '参数1的值',
   *   parame2: '参数2的值'
   * });
   * console.log(record._id); // 新创建的记录ID
   * console.log(record.user_id); // 当前用户ID（系统自动填充）
   */
  async add(data = {}) {
    // client端必须使用解构赋值的方式提取能被用户添加的字段
    const {
      parame1,
      parame2
    } = data;

    if (!parame1) return fail(400001, { name: 'parame1' });
    if (!parame2) return fail(400001, { name: 'parame2' });

    // 字段其他格式检测条件
    // ...

    return await service.demo.add({
      parame1,
      parame2,
      user_id: this.getUserId(),
    });
  },

  /**
   * 更新记录
   * @async
   * @function update
   * @description 更新当前登录用户的记录。客户端必须使用解构赋值的方式提取能被用户修改的字段，
   * 确保用户无法修改 user_id、create_time 等系统字段。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能更新当前用户自己的记录
   * - 使用 where 条件直接更新，确保只能更新自己的记录
   * - 如果记录不存在或不属于当前用户，将返回 404001 错误
   * - 系统会自动更新 update_time 字段
   *
   * @param {Object} [data={}] - 更新参数对象
   * @param {string} data._id - 记录ID（必填）
   * @param {string} data.parame1 - 参数1（必填）
   * @param {string} data.parame2 - 参数2（必填）
   * @returns {Promise<Object>} 返回更新结果对象，格式：{ updated: number }
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果 parame1 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果 parame2 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果记录不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 更新记录
   * const result = await demo.update({
   *   _id: 'record_id_123',
   *   parame1: '新的参数1值',
   *   parame2: '新的参数2值'
   * });
   * console.log(result.updated); // 更新的记录数（通常为 1）
   */
  async update(data = {}) {
    // client端必须使用解构赋值的方式提取能被用户修改的字段
    const {
      _id,
      parame1,
      parame2
    } = data;

    if (!_id) return fail(400001, { name: '_id' });
    if (!parame1) return fail(400001, { name: 'parame1' });
    if (!parame2) return fail(400001, { name: 'parame2' });

    // 字段其他格式检测条件
    // ...

    // 使用where条件直接更新，确保只能更新自己的记录
    const where = {
      _id,
      user_id: this.getUserId()
    }
    const result = await service.demo.update(where, {
      parame1,
      parame2
    });

    // 如果更新数量为0，说明记录不存在或不属于当前用户
    if (result.updated === 0) {
      return fail(404001, { name: '记录' });
    }

    return result;
  },

  /**
   * 删除记录
   * @async
   * @function remove
   * @description 删除当前登录用户的记录。支持单个删除和批量删除。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能删除当前用户自己的记录
   * - 支持两种删除方式：
   *   - 单个删除：传入 id 参数
   *   - 批量删除：传入 ids 数组参数
   * - id 和 ids 参数二选一，必须提供其中一个
   *
   * @param {Object} [data={}] - 删除参数对象
   * @param {string} [data.id] - 单个记录ID（与 ids 二选一）
   * @param {string[]} [data.ids] - 记录ID数组，用于批量删除（与 id 二选一）
   * @returns {Promise<Object>} 返回删除结果对象，格式：{ deleted: number }
   * @throws {Object} 如果 id 和 ids 都未提供，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 删除单条记录
   * const result = await demo.remove({
   *   id: 'record_id_123'
   * });
   * console.log(result.deleted); // 删除的记录数（通常为 1）
   *
   * @example
   * // 批量删除多条记录
   * const result = await demo.remove({
   *   ids: ['record_id_1', 'record_id_2', 'record_id_3']
   * });
   * console.log(result.deleted); // 删除的记录数
   */
  async remove(data = {}) {
    const { id, ids } = data;
    const where = {
      user_id: this.getUserId()
    };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where._id = {
        $in: ids
      };
    } else if (id) {
      where._id = id;
    } else {
      return fail(400001, { name: 'id' });
    }
    return await service.demo.remove(where);
  }
}
