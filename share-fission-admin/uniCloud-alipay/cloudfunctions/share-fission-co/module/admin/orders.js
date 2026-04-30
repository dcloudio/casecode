/**
 * 订单管理 - 模块控制器层
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  // 函数执行前钩子
  async _before() {
    // 登录验证中间件
    await this.middleware.auth();
  },
  // 函数执行后钩子
  _after(error, result) {
    if (error) {
      throw error
    }
    if (typeof result === "object" && !result.errCode) result.errCode = 0;
    return result
  },
  // 查列表
  async getList(data = {}) {
    return await service.orders.getList(data);
  },
  // 获取关联卡密信息
  async getCardKey(data = {}) {
    const { order_id } = data;
    if (!order_id) return fail(400001, { name: 'order_id' });
    return await service.orders.getCardKey(order_id);
  },
  // 退款
  async refund(data = {}) {
    const { order_id } = data;
    if (!order_id) return fail(400001, { name: 'order_id' });
    return await service.orders.refund(order_id);
  }
}
