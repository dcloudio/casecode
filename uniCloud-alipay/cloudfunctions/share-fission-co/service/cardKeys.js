/**
 * 卡密管理 - 服务实现层
 * @module service/cardKeys
 * @description 卡密管理模块，提供卡密的增删改查和批量导入功能。
 * 卡密用于商品兑换，支持关联商品、状态管理和订单绑定
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} CardKey
 * @property {string} [_id] - 卡密ID
 * @property {string} goods_id - 关联商品ID
 * @property {string} [goods_name] - 商品名称（查询列表时关联获取）
 * @property {string} card_no - 卡号
 * @property {string} [card_pwd] - 卡密
 * @property {string} [exchange_url] - 兑换地址
 * @property {number} [status=0] - 状态（0:未发放 1:已发放）
 * @property {string} [order_id] - 关联订单ID（发放后存在）
 * @property {number} [used_time] - 使用时间戳（毫秒）
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} CardKeyListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词（卡号），支持精确匹配和模糊搜索
 * @property {string} [goods_id=''] - 商品ID筛选
 * @property {number|string} [status=''] - 状态筛选（0:未发放 1:已发放）
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} CardKeyListResult
 * @property {CardKey[]} list - 卡密列表（包含 goods_name 字段）
 * @property {number} total - 总记录数
 */

/**
 * @typedef {Object} GoodsOption
 * @property {string} _id - 商品ID
 * @property {string} name - 商品名称
 */

/**
 * @typedef {Object} ImportItem
 * @property {string} card_no - 卡号
 * @property {string} [card_pwd] - 卡密
 * @property {string} [exchange_url] - 兑换地址
 */

/**
 * 卡密状态枚举
 * @readonly
 * @enum {number}
 */
const CardKeyStatus = {
  /** 未发放 */
  UNUSED: 0,
  /** 已发放 */
  USED: 1
};

class CardKeysService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.cardKeys;
    // 额外需要用到的集合
    this.goodsCollection = this.db.collection(Tables.goods);
  }

  /**
   * 获取商品列表（用于下拉选择）
   * @async
   * @function getGoodsList
   * @description 获取所有未删除的商品，用于卡密管理时的商品选择下拉框
   * @returns {Promise<{list: GoodsOption[]}>} 商品列表，包含 _id 和 name 字段，按排序值和创建时间倒序排列
   * @example
   * const { list } = await cardKeysService.getGoodsList();
   * // list: [{ _id: 'xxx', name: '商品A' }, ...]
   */
  async getGoodsList() {
    const { data: list } = await this.goodsCollection
      .where({ is_deleted: this._.neq(true) })
      .field({ _id: 1, name: 1 })
      .orderBy('sort_order', 'desc')
      .orderBy('create_time', 'desc')
      .get();
    return { list };
  }

  /**
   * 分页查询卡密列表
   * @async
   * @function getList
   * @description 支持关键词搜索（卡号）、商品筛选、状态筛选、自定义排序和分页。
   * 关联查询商品名称。默认按创建时间倒序排列
   * @param {CardKeyListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词（卡号），支持精确匹配和模糊搜索
   * @param {string} [data.goods_id=''] - 商品ID筛选，为空时不筛选
   * @param {number|string} [data.status=''] - 状态筛选（0:未发放 1:已发放），为空时不筛选
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按创建时间倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<CardKeyListResult>} 返回卡密列表和总数
   * @example
   * // 查询某商品的未发放卡密
   * const result = await cardKeysService.getList({
   *   goods_id: 'xxx',
   *   status: 0
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', goods_id = '', status = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 关键词搜索（卡号）
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where.card_no = keyword;
      } else {
        where.card_no = new RegExp(keyword, 'i');
      }
    }

    // 商品筛选
    if (goods_id) {
      where.goods_id = goods_id;
    }

    // 状态筛选
    if (status !== '' && status !== null && status !== undefined) {
      where.status = parseInt(status);
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按创建时间倒序
      query = query.orderBy('create_time', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder || 'desc');
    }

    // 并行执行
    const [listResult, totalResult] = await Promise.all([
      query.skip(skip).limit(pageSize).get(),
      this.collection.where(where).count()
    ]);

    let list = listResult.data;
    let total = totalResult.total;

    // 获取商品名称映射
    if (list.length > 0) {
      const goodsIds = [...new Set(list.map(item => item.goods_id).filter(Boolean))];
      if (goodsIds.length > 0) {
        const { data: goodsData } = await this.goodsCollection
          .where({ _id: this._.in(goodsIds) })
          .field({ _id: 1, name: 1 })
          .get();
        const goodsMap = {};
        goodsData.forEach(g => { goodsMap[g._id] = g.name; });
        list = list.map(item => ({
          ...item,
          goods_name: goodsMap[item.goods_id] || '-'
        }));
      }
    }

    return { list, total };
  }

  /**
   * 新增卡密记录
   * @async
   * @function add
   * @description 创建新卡密，会自动添加 create_time 字段，status 默认为 0（未发放）
   * @param {Object} [data={}] - 卡密数据对象
   * @param {string} data.goods_id - 商品ID（必填）
   * @param {string} data.card_no - 卡号（必填）
   * @param {string} [data.card_pwd] - 卡密
   * @param {string} [data.exchange_url] - 兑换地址
   * @param {number} [data.status=0] - 状态，默认为0（未发放）
   * @returns {Promise<{id: string}>} 包含新增卡密ID的对象
   * @example
   * const result = await cardKeysService.add({
   *   goods_id: 'xxx',
   *   card_no: 'CARD001',
   *   card_pwd: 'PWD123'
   * });
   */
  async add(data = {}) {
    const { _id, create_time, update_time, ...record } = data;
    record.status = record.status ?? 0;
    record.create_time = Date.now();
    const { id } = await this.collection.add(record);
    return { id };
  }

  /**
   * 批量导入卡密
   * @async
   * @function batchImport
   * @description 批量导入卡密到指定商品。会自动过滤空卡号，导入失败的记录会在控制台输出错误日志但不会中断整体导入
   * @param {string} goods_id - 商品ID，所有卡密将关联到此商品
   * @param {ImportItem[]} list - 卡密列表数组
   * @param {string} list[].card_no - 卡号（必填），会自动去除首尾空格
   * @param {string} [list[].card_pwd] - 卡密，会自动去除首尾空格
   * @param {string} [list[].exchange_url] - 兑换地址，会自动去除首尾空格
   * @returns {Promise<{count: number}>} 成功导入的记录数
   * @example
   * const result = await cardKeysService.batchImport('goods_xxx', [
   *   { card_no: 'CARD001', card_pwd: 'PWD001' },
   *   { card_no: 'CARD002', card_pwd: 'PWD002' }
   * ]);
   */
  async batchImport(goods_id, list) {
    const now = Date.now();
    const records = list.map(item => ({
      goods_id,
      card_no: String(item.card_no || '').trim(),
      card_pwd: String(item.card_pwd || '').trim(),
      exchange_url: String(item.exchange_url || '').trim(),
      status: 0,
      create_time: now
    })).filter(item => item.card_no); // 过滤掉没有卡号的记录

    if (records.length === 0) {
      return { count: 0 };
    }

    // 批量插入（uniCloud 不支持 insertMany，需要逐条插入或使用事务）
    let count = 0;
    for (const record of records) {
      try {
        await this.collection.add(record);
        count++;
      } catch (e) {
        console.error('导入卡密失败:', e);
      }
    }

    return { count };
  }
}

module.exports = new CardKeysService();
