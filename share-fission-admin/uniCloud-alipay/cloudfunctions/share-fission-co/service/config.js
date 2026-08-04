/**
 * 系统配置 - 服务实现层
 * @module service/config
 * @description 提供系统配置的读取和更新功能，支持应用名称、Logo、描述、版权信息等配置项管理
 */
const { Tables } = require('../constants');
const BaseService = require('./base');

/** @constant {string} CONFIG_ID - 主配置文档的固定ID */
const CONFIG_ID = 'main';

/**
 * @typedef {Object} SystemConfig
 * @property {string} [_id] - 配置文档ID
 * @property {string} [app_name] - 应用名称
 * @property {string} [app_logo] - 应用 Logo URL
 * @property {string} [app_description] - 应用描述
 * @property {string} [copyright] - 版权信息
 * @property {string} [icp_number] - ICP 备案号
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} UpdateResult
 * @property {Object} result - 数据库操作结果
 * @property {number} [result.updated] - 更新的记录数（更新操作时返回）
 * @property {string} [result.id] - 新增记录的ID（新增操作时返回）
 */

class ConfigService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.systemConfig;
  }

  /**
   * 获取系统配置
   * @async
   * @function get
   * @returns {Promise<SystemConfig>} 系统配置对象，如果配置不存在则返回空对象
   * @example
   * const config = await configService.get();
   * console.log(config.app_name); // '分销裂变系统'
   */
  async get() {
    const { data: [info] } = await this.collection.doc(CONFIG_ID).get();
    return info || {};
  }

  /**
   * 更新系统配置
   * @async
   * @function update
   * @description 更新系统配置，如果配置不存在则自动创建。会自动添加 update_time 字段
   * @param {SystemConfig} [data={}] - 配置数据对象
   * @param {string} [data.app_name] - 应用名称
   * @param {string} [data.app_logo] - 应用 Logo URL
   * @param {string} [data.app_description] - 应用描述
   * @param {string} [data.copyright] - 版权信息
   * @param {string} [data.icp_number] - ICP 备案号
   * @returns {Promise<UpdateResult>} 更新结果，包含数据库操作返回值
   * @example
   * const result = await configService.update({
   *   app_name: '分销裂变系统',
   *   copyright: 'Copyright © 2024'
   * });
   */
  async update(data = {}) {
    const { _id, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };

    // 检查是否存在
    const { total } = await this.collection.where({ _id: CONFIG_ID }).count();

    let res;
    if (total > 0) {
      res = await this.collection.doc(CONFIG_ID).update(updateData);
    } else {
      res = await this.collection.add({
        _id: CONFIG_ID,
        ...updateData
      });
    }

    return { result: res };
  }
}

module.exports = new ConfigService();
