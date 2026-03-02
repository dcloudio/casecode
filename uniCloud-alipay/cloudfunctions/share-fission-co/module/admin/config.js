/**
 * 系统配置 - 模块层
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
  /**
   * 获取配置
   */
  async get() {
    const info = await service.config.get();
    return {
      info
    }
  },

  /**
   * 更新配置
   */
  async update(data = {}) {
    // 简单校验
    if (typeof data !== 'object') {
      return fail(400002, { name: 'data' });
    }
    return await service.config.update(data);
  }
};
