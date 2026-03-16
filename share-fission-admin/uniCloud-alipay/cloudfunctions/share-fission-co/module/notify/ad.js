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
    // function
    // this.clientInfo()
    // 当前云对象只能由服务端调用，不能由客户端调用
    console.log('this.getClientInfo().source', this.getClientInfo().source);
    if (this.getClientInfo().source != 'function') {
      throw new Error('当前云对象只能由服务端调用，不能由客户端调用');
    }
  },
  async main(data = {}) {
    const {user_id, score, source, comment} = data;
    await service.user.addScore(user_id, score, source, comment)
  }
}
