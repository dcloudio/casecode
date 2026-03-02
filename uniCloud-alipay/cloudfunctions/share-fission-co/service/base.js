/**
 * 基础服务类
 * @module service/base
 * @description 提供通用的增删改查功能
 */
const db = uniCloud.database();
const _ = db.command;

class BaseService {
  constructor() {
    this.db = db;
    this._ = _;
  }

  /**
   * 获取集合引用
   * @returns {Object} 集合引用
   */
  get collection() {
    if (!this.tableName) {
      throw new Error('tableName is required');
    }
    return this.db.collection(this.tableName);
  }

  /**
   * 根据ID获取单条记录
   * @async
   * @param {string} _id - 记录ID
   * @returns {Promise<Object|undefined>} 详情，如果不存在则返回 undefined
   */
  async getById(_id) {
    if (!_id) return undefined;
    const { data: [info] } = await this.collection.doc(_id).get();
    return info;
  }

  /**
   * 根据where条件获取单条记录
   * @async
   * @param {Object} where - 查询条件对象
   * @returns {Promise<Object|undefined>} 详情，如果不存在则返回 undefined
   */
  async getByWhere(where) {
    if (!where || Object.keys(where).length === 0) return undefined;
    const { data: [info] } = await this.collection.where(where).limit(1).get();
    return info;
  }

  /**
   * 新增记录（支持批量）
   * @async
   * @description 创建新记录，会自动添加 create_time 字段。支持传入对象（单条）或数组（批量）。
   * @param {Object|Object[]} [data={}] - 数据对象或对象数组
   * @returns {Promise<{id: string}|{inserted: number, ids: string[]}>} 单条返回包含id的对象，批量返回包含inserted数量和ids数组的对象
   */
  async add(data = {}) {
    // 批量添加处理
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { inserted: 0, ids: [] };
      }
      const now = Date.now();
      const records = data.map(item => {
        const { _id, create_time, update_time, ...record } = item;
        return {
          ...record,
          create_time: now
        };
      });
      const result = await this.collection.add(records);
      return {
        inserted: result.inserted,
        ids: result.ids
      };
    }

    // 单条添加处理
    const { _id, create_time, update_time, ...record } = data;
    record.create_time = Date.now();
    const { id } = await this.collection.add(record);
    return { id, ...record };
  }

  /**
   * 更新记录
   * @async
   * @description 根据ID或条件更新信息，会自动添加 update_time 字段
   * @param {string|Object} condition - 记录ID 或 where查询条件
   * @param {Object} [data={}] - 要更新的数据，会自动过滤 _id 和 create_time 字段
   * @returns {Promise<{updated: number}>} 更新的记录数
   */
  async update(condition, data = {}) {
    const { _id: __, create_time, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };

    if (!condition) {
      throw new Error('Update condition is required');
    }

    if (typeof condition !== "object") {
      const { updated } = await this.collection.doc(condition).update(updateData);
      return { updated };
    } else {
      const { updated } = await this.collection.where(condition).update(updateData);
      return { updated };
    }
  }

  /**
   * 删除记录（支持多种参数形式）
   * @async
   * @description 支持三种删除方式：单个ID、ID数组批量删除、自定义where条件删除。为了安全起见，禁止传入空对象进行全表删除。
   * @param {string|string[]|Object} condition - 删除条件
   *   - string: 单个记录ID，删除该条记录
   *   - string[]: ID数组，批量删除多条记录
   *   - Object: 完整的where条件对象
   * @returns {Promise<{deleted: number}>} 删除的记录数
   */
  async remove(condition) {
    if (!condition) {
      throw new Error('Remove condition is required');
    }

    let where;
    if (Array.isArray(condition)) {
      if (condition.length === 0) {
        return { deleted: 0 };
      }
      where = { _id: _.in(condition) };
    } else if (typeof condition === 'object') {
      if (Object.keys(condition).length === 0) {
        throw new Error('Remove with empty condition is not allowed for safety');
      }
      where = condition;
    } else {
      where = { _id: condition };
    }

    const { deleted } = await this.collection.where(where).remove();
    return { deleted };
  }
}

module.exports = BaseService;
