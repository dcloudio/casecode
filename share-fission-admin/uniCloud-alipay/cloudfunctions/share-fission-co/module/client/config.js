/**
 * 系统配置 - 模块控制器层（客户端API）
 * @module client/config
 * @description 客户端API，提供系统配置的查询功能。系统配置为公共数据，所有查询接口均无需登录验证。
 * 客户端只能读取配置，不能修改配置（修改配置需要管理员权限）。
 */
const service = require('../../service');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。系统配置为公共数据，所有查询方法（get）均不需要登录验证。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 定义不需要登录的函数名（系统配置为公共数据，所有查询都不需要登录）
    const noAuthFunctionNames = ["get"];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 获取系统配置
   * @async
   * @function get
   * @description 获取系统配置信息，包括广告积分配置、提现配置等业务参数。
   *
   * **重要说明：**
   * - 无需登录验证，可直接调用
   * - 如果配置不存在，将返回空对象
   * - 客户端只能读取配置，不能修改配置
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用，保留用于扩展）
   * @returns {Promise<Object>} 返回系统配置对象，包含以下字段：
   *   - ad_score_base: 单次广告基础积分（非实时模式），默认30
   *   - ad_score_rate: 广告收益转积分比例（实时模式，1元=1000积分），默认1000
   *   - ad_score_self_rate: 自己获得积分比例（50%），默认0.5
   *   - ad_score_l1_rate: 一级上线获得积分比例（25%），默认0.25
   *   - ad_score_l2_rate: 二级上线获得积分比例（25%），默认0.25
   *   - ad_daily_limit: 每日广告观看次数限制，默认10
   *   - withdrawal_fee_rate: 提现手续费比例（20%），默认0.2
   *   - withdrawal_min_score: 最低提现积分，默认1000
   *   - update_time: 更新时间戳（毫秒）
   *   如果配置不存在则返回空对象
   * @example
   * // 获取系统配置
   * const config = await config.get();
   * console.log(config.ad_score_base); // 单次广告基础积分
   * console.log(config.ad_daily_limit); // 每日广告观看次数限制
   * console.log(config.withdrawal_min_score); // 最低提现积分
   * console.log(config.withdrawal_fee_rate); // 提现手续费比例
   *
   * @example
   * // 在应用启动时获取配置
   * const systemConfig = await config.get();
   * // 使用配置信息初始化应用业务逻辑
   */
  async get(data = {}) {
    const config = await service.config.get();
    delete config._id;
    return config;
  }
}
