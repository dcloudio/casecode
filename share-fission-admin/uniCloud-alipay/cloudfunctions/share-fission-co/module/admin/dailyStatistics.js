/**
 * 每日统计 - 模块控制器层
 */
const service = require('../../service');

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
    return await service.dailyStatistics.getList(data);
  },
  // 填写广告收入
  async fillRevenue(data = {}) {
    return await service.dailyStatistics.fillRevenue(data);
  },
  // 更新备注
  async updateRemark(data = {}) {
    const { _id, remark } = data;
    return await service.dailyStatistics.updateRemark(_id, remark);
  }
}
