/**
 * 商品分类表 - 服务实现层
 * @module service/goodsCategories
 * @description 商品分类管理模块，支持多级分类（最多两级），提供分类的增删改查功能
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} GoodsCategory
 * @property {string} [_id] - 分类ID
 * @property {string} name - 分类名称
 * @property {string} [parent_id] - 父分类ID，空字符串或不存在表示顶级分类
 * @property {string} [parent_name] - 父分类名称（查询列表时关联获取）
 * @property {number} [level=1] - 分类层级（1:一级分类 2:二级分类）
 * @property {number} [sort=0] - 排序值，值越小越靠前
 * @property {number} [status=1] - 状态（0:禁用 1:启用）
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} CategoryListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词（按分类名称或ID搜索）
 * @property {string} [parent_id=''] - 父分类ID筛选，'top' 表示只查顶级分类
 * @property {string} [sortField='sort'] - 排序字段
 * @property {string} [sortOrder='asc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} CategoryListResult
 * @property {GoodsCategory[]} list - 分类列表（包含 parent_name 字段）
 * @property {number} total - 总记录数
 */

/**
 * @typedef {Object} ParentCategoryListResult
 * @property {GoodsCategory[]} list - 一级分类列表（仅包含 _id 和 name）
 */

class GoodsCategoriesService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.goodsCategories;
  }

  /**
   * 分页查询分类列表
   * @async
   * @function getList
   * @description 支持关键词搜索、父分类筛选、自定义排序和分页。
   * 返回结果会关联查询父分类名称。默认按排序值升序排列
   * @param {CategoryListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按分类名称或ID搜索
   * @param {string} [data.parent_id=''] - 父分类ID筛选，'top' 表示只查顶级分类
   * @param {string} [data.sortField='sort'] - 排序字段，默认 sort
   * @param {string} [data.sortOrder='asc'] - 排序方向，默认升序
   * @returns {Promise<CategoryListResult>} 返回分类列表和总数
   * @example
   * // 查询所有顶级分类
   * const result = await goodsCategoriesService.getList({
   *   parent_id: 'top'
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', parent_id = '', status, sortField = 'sort', sortOrder = 'asc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }

    // 父分类筛选
    if (parent_id === 'top') {
      // 顶级分类
      where.parent_id = this._.or([this._.eq(''), this._.exists(false)]);
    } else if (parent_id) {
      where.parent_id = parent_id;
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where._id = keyword;
      } else {
        where.name = new RegExp(keyword, 'i');
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按排序值升序
      query = query.orderBy('sort', 'asc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder || 'asc');
    }

    // 并行执行
    const [listResult, totalResult] = await Promise.all([
      query.skip(skip).limit(pageSize).get(),
      this.collection.where(where).count()
    ]);

    let list = listResult.data;
    let total = totalResult.total;

    // 获取父分类名称
    if (list.length > 0) {
      const parentIds = [...new Set(list.filter(item => item.parent_id).map(item => item.parent_id))];
      if (parentIds.length > 0) {
        const { data: parents } = await this.collection.where({ _id: this._.in(parentIds) }).field({ _id: true, name: true }).get();
        const parentMap = {};
        parents.forEach(p => { parentMap[p._id] = p.name; });
        list = list.map(item => ({
          ...item,
          parent_name: item.parent_id ? parentMap[item.parent_id] || '' : ''
        }));
      } else {
        list = list.map(item => ({ ...item, parent_name: '' }));
      }
    }

    return { list, total };
  }

  /**
   * 获取父分类列表（用于下拉选择）
   * @async
   * @function getParentList
   * @description 获取所有启用状态的一级分类，用于创建/编辑分类时的父分类下拉选择
   * @returns {Promise<ParentCategoryListResult>} 返回一级分类列表
   */
  async getParentList() {
    // 只获取顶级分类作为可选父分类
    const { data: list } = await this.collection
      .where({
        status: 1,
        level: 1
      })
      .orderBy('sort', 'asc')
      .get();
    return { list };
  }

  /**
   * 获取树形结构分类列表
   * @async
   * @function getTree
   * @description 获取所有启用状态的分类，并组织成树形结构返回
   * @param {Object} [data={}] - 查询参数
   * @param {number} [data.status=1] - 状态筛选，默认只返回启用的分类
   * @returns {Promise<{tree: Array}>} 返回树形结构的分类列表
   */
  async getTree(data = {}) {
    const { status = 1 } = data;

    const where = {};
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }

    const { data: list } = await this.collection
      .where(where)
      .orderBy('sort', 'asc')
      .get();

    // 构建树形结构
    const buildTree = (items, parentId = '') => {
      const tree = [];
      for (const item of items) {
        const itemParentId = item.parent_id || '';
        if (itemParentId === parentId) {
          const children = buildTree(items, item._id);
          tree.push({
            ...item,
            children: children.length > 0 ? children : undefined
          });
        }
      }
      return tree;
    };

    const tree = buildTree(list);
    return { tree };
  }

  /**
   * 新增分类记录
   * @async
   * @function add
   * @description 创建新分类，会自动计算层级（根据父分类）。
   * 如果指定了 parent_id 但父分类不存在，则创建为一级分类
   * @param {Object} [data={}] - 分类数据对象
   * @param {string} data.name - 分类名称（必填）
   * @param {string} [data.parent_id=''] - 父分类ID，不填则为一级分类
   * @param {number} [data.sort=0] - 排序值
   * @param {number} [data.status=1] - 状态（0:禁用 1:启用）
   * @returns {Promise<{id: string}>} 包含新增分类ID的对象
   */
  async add(data = {}) {
    const { _id, create_time, update_time, level, ...record } = data;

    // 计算层级
    if (record.parent_id) {
      const parent = await this.getById(record.parent_id);
      if (parent) {
        record.level = (parent.level || 1) + 1;
      } else {
        record.level = 1;
        record.parent_id = '';
      }
    } else {
      record.level = 1;
      record.parent_id = '';
    }

    record.sort = record.sort ?? 0;
    record.status = record.status ?? 1;
    record.create_time = Date.now();

    const { id } = await this.collection.add(record);
    return { id };
  }

  /**
   * 更新分类记录
   * @async
   * @function update
   * @description 根据ID更新分类信息。如果修改了父分类，会自动重新计算层级
   * @param {string} _id - 分类ID
   * @param {Object} [data={}] - 要更新的数据
   * @param {string} [data.name] - 分类名称
   * @param {string} [data.parent_id] - 父分类ID
   * @param {number} [data.sort] - 排序值
   * @param {number} [data.status] - 状态（0:禁用 1:启用）
   * @returns {Promise<{updated: number}>} 更新的记录数（0或1）
   */
  async update(_id, data = {}) {
    const { _id: __, create_time, level, ...rest } = data;
    const updateData = { ...rest };

    // 如果修改了父分类，需要重新计算层级
    if ('parent_id' in data) {
      if (data.parent_id) {
        const parent = await this.getById(data.parent_id);
        if (parent) {
          updateData.level = (parent.level || 1) + 1;
        } else {
          updateData.level = 1;
          updateData.parent_id = '';
        }
      } else {
        updateData.level = 1;
        updateData.parent_id = '';
      }
    }

    updateData.update_time = Date.now();
    const { updated } = await this.collection.doc(_id).update(updateData);
    return { updated };
  }

  /**
   * 删除分类记录（支持多种参数形式，级联删除子分类）
   * @async
   * @function remove
   * @description 支持三种删除方式：单个ID、ID数组批量删除、自定义where条件删除。
   * 会递归删除所有子分类
   * @param {string|string[]|Object} data - 删除条件
   *   - string: 单个记录ID，删除该条记录
   *   - string[]: ID数组，批量删除多条记录
   *   - Object: 完整的where条件对象
   * @returns {Promise<{deleted: number}>} 删除的记录数（包含子分类）
   */
  async remove(data) {
    let condition;
    let ids;
    if (typeof data === 'string') {
      condition = { _id: data };
      ids = [data];
    } else if (Array.isArray(data)) {
      condition = { _id: this._.in(data) };
      ids = data;
    } else {
      // 自定义条件，先查出符合条件的ID
      const { data: records } = await this.collection.where(data).field({ _id: true }).get();
      ids = records.map(r => r._id);
      if (ids.length === 0) {
        return { deleted: 0 };
      }
      condition = { _id: this._.in(ids) };
    }

    // 获取所有要删除的分类及其子分类
    const allIds = new Set(ids);

    // 递归查找子分类
    const findChildren = async (parentIds) => {
      if (parentIds.length === 0) return;
      const { data: children } = await this.collection.where({ parent_id: this._.in(parentIds) }).field({ _id: true }).get();
      const childIds = children.map(c => c._id);
      if (childIds.length > 0) {
        childIds.forEach(id => allIds.add(id));
        await findChildren(childIds);
      }
    };

    await findChildren(ids);

    const { deleted } = await this.collection.where({ _id: this._.in([...allIds]) }).remove();
    return { deleted };
  }
}

module.exports = new GoodsCategoriesService();
