/**
 * 商品管理 - 服务实现层
 * @module service/goods
 * @description 商品管理模块，提供商品的增删改查功能。支持软删除，关联查询分类信息
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} Goods
 * @property {string} [_id] - 商品ID
 * @property {string} name - 商品名称
 * @property {string} [category_id] - 分类ID
 * @property {string} [category_name] - 分类名称（查询列表时关联获取）
 * @property {string} [description] - 商品描述
 * @property {string} [image] - 商品图片 URL
 * @property {string[]} [images] - 商品图片列表
 * @property {number} [price] - 价格（积分）
 * @property {number} [original_price] - 原价（积分）
 * @property {number} [stock] - 库存数量
 * @property {number} [sales] - 销量
 * @property {number} [sort_order=0] - 排序值，值越大越靠前
 * @property {number} [status=1] - 状态（0:下架 1:上架）
 * @property {boolean} [is_deleted=false] - 是否已软删除
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} GoodsListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词（商品名称）
 * @property {string} [category_id] - 分类ID筛选
 * @property {number} [status] - 状态筛选（0:下架 1:上架）
 * @property {string} [sortField='sort_order'] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} GoodsListResult
 * @property {Goods[]} list - 商品列表（包含 category_name 字段，不包含已软删除的商品）
 * @property {number} total - 总记录数
 */

/**
 * 商品状态枚举
 * @readonly
 * @enum {number}
 */
const GoodsStatus = {
  /** 下架 */
  OFF_SHELF: 0,
  /** 上架 */
  ON_SHELF: 1
};

class GoodsService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.goods;
    // 额外需要用到的集合
    this.categoryCollection = this.db.collection(Tables.goodsCategories);
  }

  /**
   * 获取指定分类及其所有子分类的ID列表
   * @private
   * @param {string} categoryId - 分类ID
   * @returns {Promise<string[]>} 分类ID数组
   */
  async _getCategoryWithChildren(categoryId) {
    const allIds = [categoryId];

    const findChildren = async (parentIds) => {
      if (parentIds.length === 0) return;
      const { data: children } = await this.categoryCollection
        .where({ parent_id: this._.in(parentIds) })
        .field({ _id: true })
        .get();
      const childIds = children.map(c => c._id);
      if (childIds.length > 0) {
        allIds.push(...childIds);
        await findChildren(childIds);
      }
    };

    await findChildren([categoryId]);
    return allIds;
  }

  /**
   * 分页查询商品列表
   * @async
   * @function getList
   * @description 支持关键词搜索、分类筛选、状态筛选、自定义排序和分页。
   * 自动排除软删除的商品，并关联查询分类名称。默认按排序值倒序排列
   * @param {GoodsListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，按商品名称模糊搜索
   * @param {string} [data.category_id] - 分类ID筛选
   * @param {number} [data.status] - 状态筛选（0:下架 1:上架）
   * @param {string} [data.sortField='sort_order'] - 排序字段
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<GoodsListResult>} 返回商品列表和总数
   * @example
   * // 查询某分类下的上架商品
   * const result = await goodsService.getList({
   *   category_id: 'xxx',
   *   status: 1
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', category_id, status, sortField = 'sort_order', sortOrder = 'desc' } = data;

    let where = {
      is_deleted: false // 排除软删除的记录
    };

    if (user_id) {
      where.user_id = user_id;
    }

    // 分类筛选（包含当前分类及所有子分类）
    if (category_id) {
      const categoryIds = await this._getCategoryWithChildren(category_id);
      where.category_id = this._.in(categoryIds);
    }

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }

    // 关键词搜索
    if (keyword) {
      where.name = new RegExp(keyword, 'i');
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      query = query.orderBy('sort_order', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await this.collection.where(where).count();

    // 关联查询分类名称
    if (list.length > 0) {
      const categoryIds = [...new Set(list.filter(item => item.category_id).map(item => item.category_id))];
      if (categoryIds.length > 0) {
        const { data: categories } = await this.categoryCollection.where({ _id: this._.in(categoryIds) }).field({ _id: true, name: true }).get();
        const categoryMap = {};
        categories.forEach(c => { categoryMap[c._id] = c.name; });
        list = list.map(item => ({
          ...item,
          category_name: item.category_id ? categoryMap[item.category_id] || '' : ''
        }));
      } else {
        list = list.map(item => ({ ...item, category_name: '' }));
      }
    }

    return { list, total };
  }

  /**
   * 新增商品记录
   * @async
   * @function add
   * @description 创建新商品，会自动添加 create_time 字段，设置 is_deleted 为 false
   * @param {Object} [data={}] - 商品数据对象
   * @param {string} data.name - 商品名称（必填）
   * @param {string} [data.category_id] - 分类ID
   * @param {string} [data.description] - 商品描述
   * @param {string} [data.image] - 商品图片 URL
   * @param {string[]} [data.images] - 商品图片列表
   * @param {number} [data.price] - 价格（积分）
   * @param {number} [data.original_price] - 原价（积分）
   * @param {number} [data.stock] - 库存数量
   * @param {number} [data.sort_order=0] - 排序值
   * @param {number} [data.status=1] - 状态（0:下架 1:上架）
   * @returns {Promise<{id: string}>} 包含新增商品ID的对象
   * @example
   * const result = await goodsService.add({
   *   name: '测试商品',
   *   price: 100,
   *   status: 1
   * });
   */
  async add(data = {}) {
    const { _id, create_time, update_time, is_deleted, ...record } = data;
    record.create_time = Date.now();
    record.is_deleted = false;
    record.status = record.status ?? 1;
    record.sort_order = record.sort_order ?? 0;
    const { id } = await this.collection.add(record);
    return { id };
  }

  /**
   * 更新商品记录
   * @async
   * @function update
   * @description 根据ID更新商品信息，会自动添加 update_time 字段
   * @param {string} _id - 商品ID
   * @param {Object} [data={}] - 要更新的数据，会自动过滤 _id、create_time、is_deleted 字段
   * @param {string} [data.name] - 商品名称
   * @param {string} [data.category_id] - 分类ID
   * @param {string} [data.description] - 商品描述
   * @param {string} [data.image] - 商品图片 URL
   * @param {string[]} [data.images] - 商品图片列表
   * @param {number} [data.price] - 价格（积分）
   * @param {number} [data.original_price] - 原价（积分）
   * @param {number} [data.stock] - 库存数量
   * @param {number} [data.sort_order] - 排序值
   * @param {number} [data.status] - 状态（0:下架 1:上架）
   * @returns {Promise<{updated: number}>} 更新的记录数（0或1）
   * @example
   * await goodsService.update('xxx', {
   *   price: 200,
   *   status: 0
   * });
   */
  async update(_id, data = {}) {
    const { _id: __, create_time, is_deleted, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };
    const { updated } = await this.collection.doc(_id).update(updateData);
    return { updated };
  }

  /**
   * 删除商品记录（软删除，支持多种参数形式）
   * @async
   * @function remove
   * @description 支持三种删除方式：单个ID、ID数组批量删除、自定义where条件删除。
   * 软删除商品，将 is_deleted 设置为 true，而非真正删除数据
   * @param {string|string[]|Object} data - 删除条件
   *   - string: 单个记录ID，删除该条记录
   *   - string[]: ID数组，批量删除多条记录
   *   - Object: 完整的where条件对象
   * @returns {Promise<{deleted: number}>} 更新的记录数（软删除实际是更新操作）
   * @example
   * // 根据ID删除单条记录
   * await goodsService.remove('xxx');
   */
  async remove(data) {
    let condition;
    if (typeof data === 'string') {
      condition = { _id: data };
    } else if (Array.isArray(data)) {
      condition = { _id: this._.in(data) };
    } else {
      condition = data;
    }
    const { updated } = await this.collection.where(condition).update({
      is_deleted: true,
      update_time: Date.now()
    });
    return { deleted: updated };
  }
}

module.exports = new GoodsService();
