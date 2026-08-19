/**
 * 商品管理 - 模块控制器层（客户端API）
 * @module client/goods
 * @description 客户端API，提供商品的查询功能。商品为公共数据，所有查询接口均无需登录验证。
 * 客户端只能查询上架状态（status=1）的商品，下架状态的商品不会返回。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。商品为公共数据，所有查询方法（getList、getById）均不需要登录验证。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 定义不需要登录的函数名（商品为公共数据，所有查询都不需要登录）
    const noAuthFunctionNames = ["getList", "getById"];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 分页查询商品列表
   * @async
   * @function getList
   * @description 查询商品列表，支持关键词搜索、分类筛选、自定义排序和分页。
   * 返回结果会关联查询分类名称。默认按排序值倒序排列。
   *
   * **重要说明：**
   * - 客户端接口强制只返回上架状态（status=1）的商品，即使传入其他 status 值也会被忽略
   * - 自动排除软删除的商品
   * - 无需登录验证，可直接调用
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按商品名称搜索
   * @param {string} [data.category_id=''] - 分类ID筛选，空字符串表示不筛选
   * @param {string} [data.sortField='sort_order'] - 排序字段，默认 'sort_order'
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<Object>} 返回商品列表和总数（只包含上架状态的商品），包含 list 和 total 字段
   * @example
   * // 查询所有上架商品
   * const result = await goods.getList({
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   * console.log(result.list); // 商品列表
   * console.log(result.total); // 总记录数
   *
   * @example
   * // 查询某个分类下的商品
   * const result = await goods.getList({
   *   category_id: 'category_membership',
   *   pageIndex: 1,
   *   pageSize: 10
   * });
   *
   * @example
   * // 关键词搜索商品
   * const result = await goods.getList({
   *   keyword: '会员',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    // 客户端只能查询上架状态的商品，强制设置status为1
    const { status, ...restData } = data;
    return await service.goods.getList({
      ...restData,
      status: 1 // 只返回上架状态的商品，忽略用户传入的status参数
    });
  },

  /**
   * 根据ID查询商品详情
   * @async
   * @function getById
   * @description 根据商品ID查询商品的详细信息。
   *
   * **重要说明：**
   * - 只返回上架状态（status=1）的商品
   * - 如果商品不存在、已下架或已软删除，将返回 404 错误
   * - 无需登录验证，可直接调用
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data._id - 商品ID（必填）
   * @returns {Promise<Object>} 返回商品详情对象，包含 _id、name、category_id、category_name、description、images、detail_images、score_cost、stock、sort_order、status、is_deleted、create_time、update_time 等字段
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001
   * @throws {Object} 如果商品不存在、已下架或已软删除，返回错误码 404001
   * @example
   * // 查询指定商品详情
   * const goodsInfo = await goods.getById({
   *   _id: 'goods_id_123'
   * });
   * console.log(goodsInfo.name); // 商品名称
   * console.log(goodsInfo.score_cost); // 兑换所需积分
   * console.log(goodsInfo.category_name); // 分类名称（关联查询）
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.goods.getById(_id);
    if (!info) {
      return fail(404001, { name: '商品' });
    }

    // 只返回上架状态的商品
    if (info.status !== 1) {
      return fail(404001, { name: '商品' });
    }

    // 检查是否已软删除
    if (info.is_deleted === true) {
      return fail(404001, { name: '商品' });
    }

    // 关联查询分类名称
    if (info.category_id) {
      const category = await service.goodsCategories.getById(info.category_id);
      if (category) {
        info.category_name = category.name;
      } else {
        info.category_name = '';
      }
    } else {
      info.category_name = '';
    }

    return info;
  }
}
