/**
 * 用户管理 - 模块控制器层（客户端API）
 * @module client/user
 * @description 客户端API，提供分销裂变业务特有的用户功能。
 * uni-id-co 已提供基础的用户管理功能（登录、注册、获取用户信息、更新用户信息、获取下线列表等），
 * 本模块专注于分销裂变业务特有的功能。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。所有方法都需要登录验证，因为只能操作当前用户自己的数据。
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
   * 获取当前用户的邀请码
   * @async
   * @function getInviteCode
   * @description 获取当前登录用户的邀请码（my_invite_code），用于生成邀请链接、分享邀请码等。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能获取当前用户自己的邀请码
   * - 如果用户没有邀请码，将返回空字符串
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用，保留用于扩展）
   * @returns {Promise<Object>} 返回邀请码对象，包含 invite_code 字段
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 获取当前用户的邀请码
   * const result = await user.getInviteCode();
   * console.log(result.invite_code); // 邀请码字符串
   *
   * @example
   * // 生成邀请链接
   * const { invite_code } = await user.getInviteCode();
   * const inviteUrl = `https://example.com/register?inviteCode=${invite_code}`;
   */
  async getInviteCode(data = {}) {
    const user_id = this.getUserId();
    const user = await service.user.getById(user_id);
    if (!user) {
      return fail(404001, { name: '用户' });
    }
    return {
      invite_code: user.my_invite_code || ''
    };
  },

  /**
   * 获取团队统计信息
   * @async
   * @function getTeamStats
   * @description 获取当前用户的团队统计数据，包括一级/二级下线数量、团队总人数和团队收益。
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {string} [data.timeRange='all'] - 时间范围 today|yesterday|week|all
   * @returns {Promise<Object>} 返回团队统计对象
   */
  async getTeamStats(data = {}) {
    try {
      const user_id = this.getUserId();
      if (!user_id) {
        return fail(401001, { name: '用户认证' });
      }

      return await service.user.getTeamStats(user_id, data);
    } catch (error) {
      console.error('getTeamStats error:', error);
      return fail(500001, { name: '服务器错误', message: error.message });
    }
  },

  /**
   * 获取团队成员列表
   * @async
   * @function getTeamMembers
   * @description 获取当前用户的团队成员列表，支持分页和时间筛选。
   *
   * @param {Object} [data={}] - 查询参数对象
   * @param {number} [data.level=1] - 层级 1=一级下线 2=二级下线
   * @param {string} [data.timeRange='all'] - 时间范围 today|yesterday|week|all
   * @param {number} [data.limit=20] - 每页条数
   * @param {number} [data.offset=0] - 偏移量
   * @param {boolean} [data.needTotal=false] - 是否需要总数
   * @returns {Promise<Object>} 返回团队成员列表
   */
  async getTeamMembers(data = {}) {
    try {
      const user_id = this.getUserId();
      if (!user_id) {
        return fail(401001, { name: '用户认证' });
      }

      const result = await service.user.getTeamMembers(user_id, data);

      // 格式化返回数据，添加邀请时间字段
      const list = result.list.map(member => ({
        uid: member._id,
        username: member.username,
        nickname: member.nickname,
        avatar: member.avatar,
        avatarFile: member.avatar_file,
        inviteTime: member.register_date,
        inviter_uid: member.inviter_uid
      }));

      return {
        invitedUser: list,
        total: result.total
      };
    } catch (error) {
      console.error('getTeamMembers error:', error);
      return fail(500001, { name: '服务器错误', message: error.message });
    }
  }
}
