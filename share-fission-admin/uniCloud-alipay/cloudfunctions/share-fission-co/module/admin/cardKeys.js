/**
 * 卡密管理 - 模块控制器层
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
  // 获取商品列表（用于下拉选择）
  async getGoodsList(data = {}) {
    return await service.cardKeys.getGoodsList();
  },
  // 查列表
  async getList(data = {}) {
    return await service.cardKeys.getList(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.cardKeys.getById(_id);
  },
  // 添加
  async add(data = {}) {
    const { goods_id, card_no } = data;
    if (!goods_id) return fail(400001, { name: 'goods_id' });
    if (!card_no) return fail(400001, { name: 'card_no' });
    return await service.cardKeys.add(data);
  },
  // 修改
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.cardKeys.update(_id, updateData);
  },
  // 删除
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail(400001, { name: 'ids' });
    return await service.cardKeys.remove(ids);
  },
  // 批量导入
  async batchImport(data = {}) {
    const { goods_id, list } = data;
    if (!goods_id) return fail(400001, { name: 'goods_id' });
    if (!list || !list.length) return fail(400001, { name: 'list' });
    return await service.cardKeys.batchImport(goods_id, list);
  }
}
