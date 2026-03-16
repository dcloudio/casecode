/**
 * 提现记录 - 模块控制器层
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
    return await service.withdrawalLogs.getList(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.withdrawalLogs.getById(_id);
  },
  // 审核（通过/拒绝）
  async audit(data = {}) {
    const { _id, status, reject_reason } = data;
    if (!_id) return fail(400001, { name: '_id' });
    if (status === undefined) return fail(400001, { name: 'status' });
    if (![1, 2].includes(status)) return fail(400002, { name: 'status', expect: '1 或 2' });
    if (status === 2 && !reject_reason) return fail(400001, { name: 'reject_reason' });
    return await service.withdrawalLogs.audit(_id, status, reject_reason);
  },
  // 确认打款
  async pay(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.withdrawalLogs.pay(_id);
  }
}
