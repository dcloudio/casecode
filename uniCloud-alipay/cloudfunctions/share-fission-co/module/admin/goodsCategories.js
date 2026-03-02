/**
 * 商品分类 - 模块控制器层
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
    return await service.goodsCategories.getList(data);
  },
  // 获取父分类列表（用于下拉选择）
  async getParentList(data = {}) {
    return await service.goodsCategories.getParentList(data);
  },
  // 获取树形结构分类列表
  async getTree(data = {}) {
    return await service.goodsCategories.getTree(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.goodsCategories.getById(_id);
  },
  // 添加
  async add(data = {}) {
    const { name } = data;
    if (!name) return fail(400001, { name: 'name' });
    return await service.goodsCategories.add(data);
  },
  // 修改
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.goodsCategories.update(_id, updateData);
  },
  // 删除
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail(400001, { name: 'ids' });
    return await service.goodsCategories.remove(ids);
  }
}
