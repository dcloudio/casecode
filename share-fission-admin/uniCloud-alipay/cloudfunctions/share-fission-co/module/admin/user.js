/**
 * 用户管理 - 模块控制器层
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
    return await service.user.getList(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.user.getById(_id);
  },
  // 添加
  async add(data = {}) {
    const { username } = data;
    if (!username) return fail(400001, { name: 'username' });
    return await service.user.add(data);
  },
  // 修改
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.user.update(_id, updateData);
  },
  // 删除
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail(400001, { name: 'ids' });
    return await service.user.remove(ids);
  }
}
