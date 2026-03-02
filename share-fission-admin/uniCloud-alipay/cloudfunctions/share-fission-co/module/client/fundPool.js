/**
 * 资金池 - 模块控制器层（客户端API）
 * @module client/fundPool
 * @description 客户端API，提供资金池信息的查询功能。资金池信息为公共数据，所有查询接口均无需登录验证。
 * 客户端只能读取资金池状态，不能修改（修改需要管理员权限）。
 */
const service = require('../../service');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。资金池信息为公共数据，所有查询方法（get）均不需要登录验证。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 定义不需要登录的函数名（资金池信息为公共数据，所有查询都不需要登录）
    const noAuthFunctionNames = ["get"];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 获取资金池信息
   * @async
   * @function get
   * @description 获取资金池当前状态，包括总现金、总积分和兑换比例。
   *
   * **重要说明：**
   * - 无需登录验证，可直接调用
   * - 如果资金池记录不存在，将返回默认值
   * - 客户端只能读取资金池信息，不能修改（修改需要管理员权限）
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用，保留用于扩展）
   * @returns {Promise<Object>} 返回资金池信息对象，包含以下字段：
   *   - total_cash: 资金池总现金（元），默认0
   *   - total_score: 资金池总积分，默认0
   *   - exchange_rate: 当前汇率（元/积分），默认0.01
   *   - update_time: 最后更新时间戳（毫秒），如果不存在则为null
   *   如果资金池记录不存在，将返回默认值
   * @example
   * // 获取资金池信息
   * const fundPool = await fundPool.get();
   * console.log(fundPool.total_cash); // 资金池总现金（元）
   * console.log(fundPool.total_score); // 资金池总积分
   * console.log(fundPool.exchange_rate); // 当前汇率（元/积分）
   *
   * @example
   * // 在应用启动时获取资金池状态
   * const pool = await fundPool.get();
   * // 使用资金池信息展示给用户
   */
  async get(data = {}) {
    const info = await service.fundPoolLogs.getPool();
    delete info._id;
    return info;
  }
}
