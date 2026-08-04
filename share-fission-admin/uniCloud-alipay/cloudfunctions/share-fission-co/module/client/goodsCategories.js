/**
 * 商品分类 - 模块控制器层（客户端API）
 * @module client/goodsCategories
 * @description 客户端API，提供商品分类的查询功能。商品分类为公共数据，所有查询接口均无需登录验证。
 * 客户端只能查询启用状态（status=1）的分类，禁用状态的分类不会返回。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。商品分类为公共数据，所有查询方法（getList、getById、getParentList）均不需要登录验证。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 定义不需要登录的函数名（商品分类为公共数据，所有查询都不需要登录）
    const noAuthFunctionNames = ["getList", "getById", "getParentList", "getTree"];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 分页查询分类列表
   * @async
   * @function getList
   * @description 查询商品分类列表，支持关键词搜索、父分类筛选、自定义排序和分页。
   * 返回结果会关联查询父分类名称。默认按排序值升序排列。
   *
   * **重要说明：**
   * - 客户端接口强制只返回启用状态（status=1）的分类，即使传入其他 status 值也会被忽略
   * - 无需登录验证，可直接调用
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按分类名称或ID搜索
   * @param {string} [data.parent_id=''] - 父分类ID筛选，'top' 表示只查顶级分类，空字符串表示不筛选
   * @param {string} [data.sortField='sort'] - 排序字段，默认 'sort'
   * @param {string} [data.sortOrder='asc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<Object>} 返回分类列表和总数（只包含启用状态的分类），包含 list 和 total 字段
   * @example
   * // 查询所有顶级分类
   * const result = await goodsCategories.getList({
   *   parent_id: 'top',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   * console.log(result.list); // 分类列表
   * console.log(result.total); // 总记录数
   *
   * @example
   * // 查询某个父分类下的子分类
   * const result = await goodsCategories.getList({
   *   parent_id: 'category_membership',
   *   pageIndex: 1,
   *   pageSize: 10
   * });
   *
   * @example
   * // 关键词搜索分类
   * const result = await goodsCategories.getList({
   *   keyword: '会员',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    // 客户端只能查询启用状态的分类，强制设置status为1
    const { status, ...restData } = data;
    return await service.goodsCategories.getList({
      ...restData,
      status: 1 // 只返回启用状态的分类，忽略用户传入的status参数
    });
  },

  /**
   * 根据ID查询分类详情
   * @async
   * @function getById
   * @description 根据分类ID查询分类的详细信息。
   *
   * **重要说明：**
   * - 只返回启用状态（status=1）的分类
   * - 如果分类不存在或已禁用，将返回 404 错误
   * - 无需登录验证，可直接调用
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data._id - 分类ID（必填）
   * @returns {Promise<Object>} 返回分类详情对象，包含 _id、name、parent_id、level、sort、status 等字段
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001
   * @throws {Object} 如果分类不存在或已禁用，返回错误码 404001
   * @example
   * // 查询指定分类详情
   * const category = await goodsCategories.getById({
   *   _id: 'category_membership'
   * });
   * console.log(category.name); // 分类名称
   * console.log(category.level); // 分类层级
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.goodsCategories.getById(_id);
    if (!info) {
      return fail(404001, { name: '分类' });
    }

    // 只返回启用状态的分类
    if (info.status !== 1) {
      return fail(404001, { name: '分类' });
    }

    return info;
  },

  /**
   * 获取父分类列表（用于下拉选择）
   * @async
   * @function getParentList
   * @description 获取所有启用状态的一级分类列表，通常用于创建或编辑分类时的父分类下拉选择。
   *
   * **重要说明：**
   * - 只返回启用状态（status=1）的一级分类（level=1）
   * - 返回结果按排序值（sort）升序排列
   * - 返回字段仅包含 _id 和 name
   * - 无需登录验证，可直接调用
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用，保留用于扩展）
   * @returns {Promise<Object>} 返回一级分类列表，包含 list 字段，list 中每个元素包含 _id 和 name 字段
   * @example
   * // 获取所有一级分类（用于下拉选择）
   * const result = await goodsCategories.getParentList();
   * console.log(result.list); // [{ _id: 'category_membership', name: '会员服务' }, ...]
   *
   * @example
   * // 在创建二级分类时使用
   * const parentList = await goodsCategories.getParentList();
   * // 将 parentList.list 用于下拉选择组件
   */
  async getParentList(data = {}) {
    // 客户端只能查询启用状态的一级分类
    return await service.goodsCategories.getParentList(data);
  },

  /**
   * 获取树形结构分类列表
   * @async
   * @function getTree
   * @description 获取所有启用状态的分类，并组织成树形结构返回。
   *
   * **重要说明：**
   * - 客户端接口强制只返回启用状态（status=1）的分类
   * - 无需登录验证，可直接调用
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用）
   * @returns {Promise<{tree: Array}>} 返回树形结构的分类列表
   * @example
   * const result = await goodsCategories.getTree();
   * console.log(result.tree);
   * // [
   * //   { _id: '1', name: '一级分类', children: [
   * //     { _id: '1-1', name: '二级分类' }
   * //   ]}
   * // ]
   */
  async getTree(data = {}) {
    return await service.goodsCategories.getTree({ status: 1 });
  }
}
