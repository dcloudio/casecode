/**
 * 订单管理 - 模块控制器层（客户端API）
 * @module client/orders
 * @description 客户端API，所有操作都只能操作当前登录用户自己的订单。
 * 支持订单查询、卡密获取和订单退款功能。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。所有方法都需要登录验证，因为只能操作当前用户自己的订单。
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
   * 分页查询订单列表
   * @async
   * @function getList
   * @description 查询当前登录用户的订单列表，支持关键词搜索、状态筛选、自定义排序和分页。
   * 默认按创建时间倒序排列。只能查询当前登录用户自己的数据。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 自动过滤，只返回当前用户的订单
   * - 支持按订单号、商品名称搜索
   * - 支持按订单状态筛选（pending:待支付 complete:已完成 cancel:已取消）
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按订单号、商品名称搜索
   * @param {string} [data.status=''] - 订单状态筛选（pending:待支付 complete:已完成 cancel:已取消），空字符串表示不筛选
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_time 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<Object>} 返回订单列表和总数，格式：{ list: Array, total: number }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询第一页数据
   * const result = await orders.getList({
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   * console.log(result.list); // 订单列表
   * console.log(result.total); // 总记录数
   *
   * @example
   * // 查询已完成的订单
   * const result = await orders.getList({
   *   status: 'complete',
   *   pageIndex: 1,
   *   pageSize: 10
   * });
   *
   * @example
   * // 关键词搜索订单
   * const result = await orders.getList({
   *   keyword: 'ORDER123',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    return await service.orders.getList({
      ...data,
      user_id: this.getUserId() // 只能查询当前用户的
    });
  },

  /**
   * 积分兑换下单
   * @async
   * @function create
   * @description 使用积分兑换指定商品。扣减当前用户积分，创建订单并绑定卡密，订单立即完成。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 仅能为自己下单
   * - 商品须为上架且未删除，且该商品有未发放卡密（库存充足）
   * - 用户积分须 ≥ 商品所需积分
   *
   * @param {Object} [data={}] - 参数对象
   * @param {string} data.goods_id - 商品ID（必填）
   * @returns {Promise<Object>} 返回创建的订单对象，包含 _id、order_no、user_id、goods_info、score_cost、status、card_key_id、create_time、complete_time
   * @throws {Object} 若 goods_id 缺失，返回 400001
   * @throws {Object} 若商品不存在、已下架、库存不足、积分不足等，返回 400002 或 404001（由 errMsg 区分）
   * @throws {Object} 若未登录，返回认证错误
   * @example
   * const order = await orders.create({ goods_id: 'goods_xxx' });
   * console.log(order.order_no);
   * console.log(order.status); // 'complete'
   */
  async create(data = {}) {
    const { goods_id } = data;
    if (!goods_id) return fail(400001, { name: 'goods_id' });

    try {
      const order = await service.orders.create(this.getUserId(), goods_id);
      return order;
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('商品不存在') || msg.includes('商品已下架')) {
        return fail(404001, { name: '商品' });
      }
      if (msg.includes('库存不足')) {
        return fail(400002, '库存不足');
      }
      if (msg.includes('积分不足')) {
        return fail(400002, '积分不足');
      }
      if (msg.includes('商品ID不能为空')) {
        return fail(400001, { name: 'goods_id' });
      }
      return fail(500001, msg || '下单失败');
    }
  },

  /**
   * 根据ID查询订单详情
   * @async
   * @function getById
   * @description 根据订单ID查询当前登录用户的订单详情。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能查询当前用户自己的订单
   * - 如果订单不存在或不属于当前用户，将返回 404 错误
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data._id - 订单ID（必填）
   * @returns {Promise<Object>} 返回订单详情对象，包含 _id、order_no、user_id、goods_info、score_cost、status、card_key_id、create_time、complete_time 等字段
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果订单不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询指定订单详情
   * const order = await orders.getById({
   *   _id: 'order_id_123'
   * });
   * console.log(order.order_no); // 订单号
   * console.log(order.goods_info); // 商品快照
   * console.log(order.status); // 订单状态
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.orders.getByWhere({
      _id,
      user_id: this.getUserId()
    });
    if (!info) {
      return fail(404001, { name: '订单' });
    }

    return info;
  },

  /**
   * 获取订单关联的卡密信息
   * @async
   * @function getCardKey
   * @description 根据订单ID获取关联的卡密信息。只能获取当前用户自己的订单的卡密。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能获取当前用户自己的订单的卡密
   * - 如果订单不存在、不属于当前用户或没有关联卡密，将返回相应错误
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data.order_id - 订单ID（必填）
   * @returns {Promise<Object>} 返回卡密信息对象，包含 _id、goods_id、card_no、card_pwd、exchange_url、status 等字段。如果没有卡密则返回 null
   * @throws {Object} 如果 order_id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果订单不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 获取订单的卡密信息
   * const cardKey = await orders.getCardKey({
   *   order_id: 'order_id_123'
   * });
   * if (cardKey) {
   *   console.log(cardKey.card_no); // 卡号
   *   console.log(cardKey.card_pwd); // 卡密
   *   console.log(cardKey.exchange_url); // 兑换地址
   * }
   */
  async getCardKey(data = {}) {
    const { order_id } = data;
    if (!order_id) return fail(400001, { name: 'order_id' });

    // 先验证订单是否属于当前用户
    const order = await service.orders.getByWhere({
      _id: order_id,
      user_id: this.getUserId()
    });
    if (!order) {
      return fail(404001, { name: '订单' });
    }

    // 获取卡密信息
    try {
      const cardKey = await service.orders.getCardKey(order_id);
      return cardKey || null;
    } catch (error) {
      // 如果订单不存在（服务层会抛出错误），但我们已经验证过了，所以这里应该是其他错误
      return fail(404001, { name: '卡密' });
    }
  },

  /**
   * 订单退款
   * @async
   * @function refund
   * @description 对已完成的订单申请退款。只能退款当前用户自己的订单。
   * 退款操作包括：更新订单状态为已取消、退还用户积分、创建积分变动记录、释放关联的卡密（如果有）。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能退款当前用户自己的订单
   * - 只有已完成的订单才能退款
   * - 如果订单不存在、不属于当前用户或状态不正确，将返回相应错误
   *
   * @param {Object} [data={}] - 退款参数对象
   * @param {string} data.order_id - 订单ID（必填）
   * @returns {Promise<Object>} 返回退款结果对象，格式：{ success: boolean }
   * @throws {Object} 如果 order_id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果订单不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果订单状态不正确（只有已完成的订单才能退款），返回错误码 400002，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 申请订单退款
   * const result = await orders.refund({
   *   order_id: 'order_id_123'
   * });
   * if (result.success) {
   *   console.log('退款成功');
   * }
   */
  async refund(data = {}) {
    const { order_id } = data;
    if (!order_id) return fail(400001, { name: 'order_id' });

    // 先验证订单是否属于当前用户
    const order = await service.orders.getByWhere({
      _id: order_id,
      user_id: this.getUserId()
    });
    if (!order) {
      return fail(404001, { name: '订单' });
    }

    // 检查订单状态
    if (order.status !== 'complete') {
      return fail(400002, { name: '只有已完成的订单才能退款' });
    }

    // 执行退款操作
    try {
      const result = await service.orders.refund(order_id);
      return result;
    } catch (error) {
      // 处理服务层抛出的错误
      if (error.message.includes('订单不存在')) {
        return fail(404001, { name: '订单' });
      }
      if (error.message.includes('只有已完成的订单才能退款')) {
        return fail(400002, { name: '只有已完成的订单才能退款' });
      }
      // 其他错误
      return fail(500001, { name: error.message || '退款失败' });
    }
  }
}
