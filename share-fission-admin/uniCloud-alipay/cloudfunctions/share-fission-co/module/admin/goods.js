/**
 * 商品管理 - 模块控制器层
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
    return await service.goods.getList(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.goods.getById(_id);
  },
  // 添加
  async add(data = {}) {
    const { name, category, score_cost, stock } = data;
    if (!name) return fail(400001, { name: 'name' });
    if (!category) return fail(400001, { name: 'category' });
    if (score_cost === undefined) return fail(400001, { name: 'score_cost' });
    if (stock === undefined) return fail(400001, { name: 'stock' });
    return await service.goods.add(data);
  },
  // 修改
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.goods.update(_id, updateData);
  },
  // 删除（软删除）
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail(400001, { name: 'ids' });
    return await service.goods.remove(ids);
  }
}
