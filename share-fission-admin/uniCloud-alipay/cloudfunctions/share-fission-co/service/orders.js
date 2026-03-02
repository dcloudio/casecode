/**
 * 订单表 - 服务实现层
 * @module service/orders
 * @description 订单管理模块，提供订单查询、卡密获取、订单退款等功能。
 * 使用聚合查询关联用户信息，支持事务处理退款操作
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} GoodsInfo
 * @property {string} _id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 商品价格（积分）
 * @property {string} [image] - 商品图片
 */

/**
 * @typedef {Object} Order
 * @property {string} [_id] - 订单ID
 * @property {string} order_no - 订单号
 * @property {string} user_id - 用户ID
 * @property {string} [user_nickname] - 用户昵称（聚合查询时关联获取）
 * @property {GoodsInfo} goods_info - 商品信息快照
 * @property {string} [goods_name] - 商品名称（从 goods_info 中提取）
 * @property {number} score_cost - 消耗积分数量
 * @property {string} status - 订单状态（pending:待支付 complete:已完成 cancel:已取消）
 * @property {string} [card_key_id] - 关联的卡密ID
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} OrderListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词（订单号、商品名称）
 * @property {string} [status=''] - 订单状态筛选
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} OrderListResult
 * @property {Order[]} list - 订单列表（包含 goods_name 和 user_nickname 字段）
 * @property {number} total - 总记录数
 */

/**
 * @typedef {Object} CardKey
 * @property {string} [_id] - 卡密ID
 * @property {string} goods_id - 商品ID
 * @property {string} card_no - 卡号
 * @property {string} [card_pwd] - 卡密
 * @property {string} [exchange_url] - 兑换地址
 * @property {number} status - 状态（0:未发放 1:已发放）
 * @property {string} [order_id] - 关联订单ID
 * @property {number} [used_time] - 使用时间戳
 */

/**
 * 订单状态枚举
 * @readonly
 * @enum {string}
 */
const OrderStatus = {
  /** 待支付 */
  PENDING: 'pending',
  /** 已完成 */
  COMPLETE: 'complete',
  /** 已取消 */
  CANCEL: 'cancel'
};

class OrdersService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.orders;
    // 额外需要用到的集合
    this.goodsCollection = this.db.collection(Tables.goods);
    this.cardKeysCollection = this.db.collection(Tables.cardKeys);
    this.usersCollection = this.db.collection(Tables.users);
    this.scoresCollection = this.db.collection(Tables.scores);
  }

  /**
   * 生成 25 位纯数字订单号
   * @private
   * @returns {string}
   */
  _genOrderNo() {
    const ts = String(Date.now());
    const rand = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
    return (ts + rand).slice(0, 25);
  }

  /**
   * 积分兑换下单（创建订单）
   * @async
   * @function create
   * @description 用户使用积分兑换商品。校验商品上架与卡密库存，扣减用户积分，创建订单并绑定卡密（若有），写积分支出记录。
   * @param {string} user_id - 用户ID
   * @param {string} goods_id - 商品ID
   * @returns {Promise<Object>} 返回创建的订单对象
   * @throws {Error} 商品不存在、已下架、已删除、库存不足、用户积分不足、创建失败
   */
  async create(user_id, goods_id) {
    if (!goods_id) {
      throw new Error('商品ID不能为空');
    }

    const { data: [goods] } = await this.goodsCollection.doc(goods_id).get();
    if (!goods) {
      throw new Error('商品不存在');
    }
    if (goods.status !== 1) {
      throw new Error('商品已下架');
    }
    if (goods.is_deleted === true) {
      throw new Error('商品不存在');
    }

    const score_cost = Number(goods.score_cost) || 0;
    if (score_cost <= 0) {
      throw new Error('商品积分配置异常');
    }

    // 取一张该商品的未发放卡密，作为可兑换库存
    const { data: cardKeyList } = await this.cardKeysCollection
      .where({ goods_id, status: 0 })
      .limit(1)
      .get();
    const cardKey = cardKeyList && cardKeyList[0];
    if (!cardKey) {
      throw new Error('库存不足');
    }

    const { data: [user] } = await this.usersCollection.doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }
    const currentScore = Number(user.score) || 0;
    if (currentScore < score_cost) {
      throw new Error('积分不足');
    }

    const now = Date.now();
    const order_no = this._genOrderNo();
    const goods_info = {
      goods_id: goods._id,
      name: goods.name || '',
      image: (Array.isArray(goods.images) && goods.images[0]) ? goods.images[0] : '',
      score_cost: score_cost
    };

    const transaction = await this.db.startTransaction();
    try {
      const orderDoc = {
        order_no,
        user_id,
        goods_info,
        score_cost,
        status: OrderStatus.COMPLETE,
        card_key_id: cardKey._id,
        create_time: now,
        complete_time: now
      };
      const addRes = await transaction.collection(Tables.orders).add(orderDoc);
      const order_id = addRes.id;

      await transaction.collection(Tables.users).doc(user_id).update({
        score: this._.inc(-score_cost)
      });

      await transaction.collection(Tables.scores).add({
        user_id,
        score: -score_cost,
        type: 2, // 支出
        balance: currentScore - score_cost,
        source: 'order',
        order_id,
        comment: '积分兑换',
        create_date: now
      });

      await transaction.collection(Tables.cardKeys).doc(cardKey._id).update({
        status: 1,
        order_id,
        used_time: now
      });

      // 更新商品销量
      await transaction.collection(Tables.goods).doc(goods_id).update({
        sales_count: this._.inc(1)
      });

      await transaction.commit();

      return {
        _id: order_id,
        ...orderDoc
      };
    } catch (e) {
      await transaction.rollback();
      throw new Error('下单失败：' + e.message);
    }
  }

  /**
   * 分页查询订单列表
   * @async
   * @function getList
   * @description 使用聚合管道查询订单列表，关联用户表获取昵称。
   * 支持关键词搜索（订单号、商品名称）、状态筛选、自定义排序和分页。
   * 默认按创建时间倒序排列
   * @param {OrderListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持订单号、商品名称搜索
   * @param {string} [data.status=''] - 订单状态筛选
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_time 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<OrderListResult>} 返回订单列表和总数
   * @example
   * // 查询已完成的订单
   * const result = await ordersService.getList({
   *   status: 'complete',
   *   pageSize: 10
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', status = '', sortField = '', sortOrder = 'desc' } = data;

    let matchConditions = [];

    // user_id 筛选
    if (user_id) {
      matchConditions.push({ user_id: user_id });
    }

    // 状态筛选
    if (status) {
      matchConditions.push({ status: status });
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        matchConditions.push({
          $or: [
            { order_no: keyword },
            { 'goods_info.name': keyword }
          ]
        });
      } else {
        matchConditions.push({
          $or: [
            { order_no: { $regex: keyword, $options: 'i' } },
            { 'goods_info.name': { $regex: keyword, $options: 'i' } }
          ]
        });
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建聚合管道
    let pipeline = [];

    // 匹配条件
    if (matchConditions.length > 0) {
      pipeline.push({
        $match: matchConditions.length === 1 ? matchConditions[0] : { $and: matchConditions }
      });
    }

    // 关联用户表获取昵称
    pipeline.push({
      $lookup: {
        from: Tables.users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_info'
      }
    });

    // 添加计算字段
    pipeline.push({
      $addFields: {
        goods_name: '$goods_info.name',
        user_nickname: { $arrayElemAt: ['$user_info.nickname', 0] }
      }
    });

    // 排序
    let sortObj = {};
    if (sortField && sortOrder) {
      sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj['create_time'] = -1;
    }
    if (sortField !== '_id') {
      sortObj['_id'] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });

    // 统计总数的管道
    const countPipeline = [...pipeline, { $count: 'total' }];

    // 分页
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    // 移除不需要的字段
    pipeline.push({
      $project: {
        user_info: 0
      }
    });

    // 执行查询
    const [listResult, countResult] = await Promise.all([
      this.collection.aggregate(pipeline).end(),
      this.collection.aggregate(countPipeline).end()
    ]);

    return {
      list: listResult.data || [],
      total: countResult.data[0]?.total || 0
    };
  }

  /**
   * 获取订单关联的卡密信息
   * @async
   * @function getCardKey
   * @description 根据订单ID获取关联的卡密信息。优先通过订单中的 card_key_id 查询，
   * 如果不存在则通过 order_id 反查卡密表
   * @param {string} order_id - 订单ID
   * @returns {Promise<CardKey|null>} 卡密信息，如果不存在则返回 null
   * @throws {Error} 订单不存在
   * @example
   * const cardKey = await ordersService.getCardKey('xxx');
   */
  async getCardKey(order_id) {
    // 先获取订单信息
    const { data: [order] } = await this.collection.doc(order_id).get();
    if (!order) {
      throw new Error('订单不存在');
    }

    // 如果订单有关联的卡密ID
    if (order.card_key_id) {
      const { data: [cardKey] } = await this.cardKeysCollection.doc(order.card_key_id).get();
      return cardKey || null;
    }

    // 也可以通过 order_id 反查卡密表
    const { data: [cardKey] } = await this.cardKeysCollection.where({ order_id }).get();
    return cardKey || null;
  }

  /**
   * 订单退款
   * @async
   * @function refund
   * @description 对已完成的订单进行退款操作。使用数据库事务确保数据一致性，包括：
   * 1. 更新订单状态为已取消
   * 2. 退还用户积分
   * 3. 创建积分变动记录
   * 4. 释放关联的卡密（如果有）
   * @param {string} order_id - 订单ID
   * @returns {Promise<{success: boolean}>} 退款结果
   * @throws {Error} 订单不存在
   * @throws {Error} 只有已完成的订单才能退款
   * @throws {Error} 用户不存在
   * @throws {Error} 退款失败：[具体错误信息]
   */
  async refund(order_id) {
    // 获取订单信息
    const { data: [order] } = await this.collection.doc(order_id).get();
    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态
    if (order.status !== 'complete') {
      throw new Error('只有已完成的订单才能退款');
    }

    const { user_id, score_cost, card_key_id } = order;

    // 获取用户当前积分
    const { data: [user] } = await this.usersCollection.doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }

    const currentScore = user.score || 0;
    const newBalance = currentScore + score_cost;

    // 开始事务操作
    const transaction = await this.db.startTransaction();

    try {
      // 1. 更新订单状态为已取消
      await transaction.collection(Tables.orders).doc(order_id).update({
        status: 'cancel',
        update_time: Date.now()
      });

      // 2. 更新用户积分
      await transaction.collection(Tables.users).doc(user_id).update({
        score: this._.inc(score_cost)
      });

      // 3. 创建积分变更记录
      await transaction.collection(Tables.scores).add({
        user_id,
        score: score_cost,
        type: 1, // 收入
        balance: newBalance,
        source: 'refund',
        order_id,
        comment: '订单退款',
        create_date: Date.now()
      });

      // 4. 释放卡密（如果有）
      if (card_key_id) {
        await transaction.collection(Tables.cardKeys).doc(card_key_id).update({
          status: 0, // 未发放
          order_id: this._.remove(),
          used_time: this._.remove()
        });
      }

      // 5. 减少商品销量
      const goods_id = order.goods_info?.goods_id;
      if (goods_id) {
        await transaction.collection(Tables.goods).doc(goods_id).update({
          sales_count: this._.inc(-1)
        });
      }

      await transaction.commit();

      return { success: true };
    } catch (e) {
      await transaction.rollback();
      throw new Error('退款失败：' + e.message);
    }
  }
}

module.exports = new OrdersService();
