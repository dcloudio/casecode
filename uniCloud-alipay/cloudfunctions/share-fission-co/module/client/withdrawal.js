/**
 * 提现记录 - 模块控制器层（客户端API）
 * @module client/withdrawal
 * @description 客户端API，所有操作都只能操作当前登录用户自己的提现记录。
 * 支持提现记录查询功能。提现记录由系统自动生成，客户端只能查询，不能添加、修改或删除。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。所有方法都需要登录验证，因为只能查询当前用户自己的提现记录。
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
   * 分页查询提现记录列表
   * @async
   * @function getList
   * @description 查询当前登录用户的提现记录列表，支持状态筛选、自定义排序和分页。
   * 默认按创建时间倒序排列。只能查询当前登录用户自己的数据。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 自动过滤，只返回当前用户的记录
   * - 支持按状态筛选（0:待审核 1:审核通过 2:审核拒绝 3:已打款）
   * - 不支持关键词搜索（客户端只能查看自己的记录，无需搜索）
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {number} [data.status] - 状态筛选（0:待审核 1:审核通过 2:审核拒绝 3:已打款），不传表示不筛选
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_time 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<Object>} 返回提现记录列表和总数，格式：{ list: Array, total: number }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询第一页数据
   * const result = await withdrawalLogs.getList({
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   * console.log(result.list); // 提现记录列表
   * console.log(result.total); // 总记录数
   *
   * @example
   * // 查询待审核的提现申请
   * const result = await withdrawalLogs.getList({
   *   status: 0,
   *   pageIndex: 1,
   *   pageSize: 10
   * });
   *
   * @example
   * // 自定义排序
   * const result = await withdrawalLogs.getList({
   *   sortField: 'create_time',
   *   sortOrder: 'asc',
   *   pageIndex: 1,
   *   pageSize: 20
   * });
   */
  async getList(data = {}) {
    // 客户端只能查询当前用户的提现记录，忽略用户传入的keyword参数
    const { keyword, ...restData } = data;
    return await service.withdrawalLogs.getList({
      ...restData,
      user_id: this.getUserId() // 只能查询当前用户的
    });
  },

  /**
   * 根据ID查询提现记录详情
   * @async
   * @function getById
   * @description 根据记录ID查询当前登录用户的提现记录详情。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能查询当前用户自己的记录
   * - 如果记录不存在或不属于当前用户，将返回 404 错误
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} data._id - 记录ID（必填）
   * @returns {Promise<Object>} 返回提现记录详情对象，包含 _id、user_id、score、exchange_rate、amount、fee_rate、fee、actual_amount、method、account_info、status、reject_reason、create_time、audit_time、pay_time 等字段
   * @throws {Object} 如果 _id 参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果记录不存在或不属于当前用户，返回错误码 404001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 查询指定提现记录详情
   * const record = await withdrawalLogs.getById({
   *   _id: 'record_id_123'
   * });
   * console.log(record.score); // 提现积分数
   * console.log(record.amount); // 提现金额（元）
   * console.log(record.actual_amount); // 实际到账金额（元）
   * console.log(record.status); // 状态（0:待审核 1:审核通过 2:审核拒绝 3:已打款）
   * console.log(record.account_info); // 收款账户信息
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.withdrawalLogs.getByWhere({
      _id,
      user_id: this.getUserId()
    });
    if (!info) {
      return fail(404001, { name: '提现记录' });
    }
    return info;
  },

  /**
   * 申请提现
   * @async
   * @function apply
   * @description 用户申请提现，需要登录验证。会自动计算手续费和实际到账金额，并扣除用户积分。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 自动从系统配置获取手续费比例和最低提现积分
   * - 提现积分需要大于最低提现积分
   * - 用户积分需要足够
   * - 提现申请创建后状态为待审核
   *
   * @param {Object} [data={}] - 提现申请参数
   * @param {number} data.score - 提现积分数量（必填）
   * @param {string} data.method - 提现方式（必填，可选值：'alipay'|'bank'）
   * @param {Object} data.account_info - 收款账户信息（必填）
   * @param {string} data.account_info.type - 账户类型（'alipay'|'bank'）
   * @param {string} data.account_info.account - 账号（支付宝账号或银行卡号）
   * @param {string} data.account_info.name - 真实姓名
   * @param {string} [data.account_info.bank_name] - 开户银行（银行卡时必填）
   * @returns {Promise<Object>} 返回新创建的提现记录ID，格式：{ id: string }
   * @throws {Object} 如果参数缺失，返回错误码 400001，格式：{ errCode: number, errMsg: string }
   * @throws {Object} 如果积分不足或低于最低提现，返回业务错误
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 支付宝提现
   * const result = await withdrawal.apply({
   *   score: 1000,
   *   method: 'alipay',
   *   account_info: {
   *     type: 'alipay',
   *     account: '13800138000',
   *     name: '张三'
   *   }
   * });
   * console.log(result.id); // 提现记录ID
   *
   * @example
   * // 银行卡提现
   * const result = await withdrawal.apply({
   *   score: 2000,
   *   method: 'bank',
   *   account_info: {
   *     type: 'bank',
   *     account: '6222021234567890123',
   *     name: '张三',
   *     bank_name: '中国工商银行'
   *   }
   * });
   */
  async apply(data = {}) {
    const { score, method, account_info } = data;

    // 参数验证
    if (!score) return fail(400001, { name: 'score' });
    if (!method) return fail(400001, { name: 'method' });
    if (!account_info) return fail(400001, { name: 'account_info' });
    if (!account_info.account) return fail(400001, { name: 'account_info.account' });
    if (!account_info.name) return fail(400001, { name: 'account_info.name' });

    // 银行卡提现需要银行名称
    if (method === 'bank' && !account_info.bank_name) {
      return fail(400001, { name: 'account_info.bank_name' });
    }

    // 调用 service 层申请提现
    return await service.withdrawalLogs.apply({
      user_id: this.getUserId(),
      score,
      method,
      account_info: {
        type: method,
        ...account_info
      }
    });
  }
}
