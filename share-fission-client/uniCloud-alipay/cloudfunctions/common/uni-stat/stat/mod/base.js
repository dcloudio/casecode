/**
 * @class BaseMod 数据模型基类，提供基础服务支持
 */
const {
	getConfig
} = require('../../shared')
//基类
module.exports = class BaseMod {
	constructor() {
		//配置信息
		this.config = getConfig('config')
		//开启/关闭debug
		this.debug = this.config.debug
		//主键
		this.primaryKey = '_id'
		//单次查询最多返回 500 条数据(阿里云500，腾讯云1000，这里取最小值)
		this.selectMaxLimit = 500
		//数据表前缀
		this.tablePrefix = 'uni-stat'
		//数据表连接符
		this.tableConnectors = '-'
		//数据表名
		this.tableName = ''
		//参数
		this.params = {}
		//数据库连接
		this._dbConnection()
		//redis连接
		this._redisConnection()
	}

	/**
	 * 建立uniCloud数据库连接
	 */
	_dbConnection() {
		if (!this.db) {
			try {
				this.db = uniCloud.database()
				this.dbCmd = this.db.command
				this.dbAggregate = this.dbCmd.aggregate
			} catch (e) {
				console.error('database connection failed: ' + e)
				throw new Error('database connection failed: ' + e)
			}
		}
	}

	/**
	 * 建立uniCloud redis连接
	 */
	_redisConnection() {
		if (this.config.redis && !this.redis) {
			try {
				this.redis = uniCloud.redis()
			} catch (e) {
				console.log('redis server connection failed: ' + e)
			}
		}
	}

	/**
	 * 获取uni统计配置项
	 * @param {String} key
	 */
	getConfig(key) {
		return this.config[key]
	}

	/**
	 * 获取带前缀的数据表名称
	 * @param {String} tab 表名
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	getTableName(tab, useDBPre = true) {
		tab = tab || this.tableName
		const table = (useDBPre && this.tablePrefix && tab.indexOf(this.tablePrefix) !== 0) ? this.tablePrefix + this
			.tableConnectors + tab : tab
		return table
	}

	/**
	 * 获取数据集
	 * @param {String} tab表名
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	getCollection(tab, useDBPre = true) {
		return this.db.collection(this.getTableName(tab, useDBPre))
	}

	/**
	 * 获取reids缓存
	 * @param {String} key reids缓存键值
	 */
	async getCache(key) {
		if (!this.redis || !key) {
			return false
		}
		let cacheResult = await this.redis.get(key)

		if (this.debug) {
			console.log('get cache result by key:' + key, cacheResult)
		}

		if (cacheResult) {
			try {
				cacheResult = JSON.parse(cacheResult)
			} catch (e) {
				if (this.debug) {
					console.log('json parse error: ' + e)
				}
			}
		}
		return cacheResult
	}

	/**
	 * 设置redis缓存
	 * @param {String} key 键值
	 * @param {String} val 值
	 * @param {Number} expireTime 过期时间
	 */
	async setCache(key, val, expireTime) {
		if (!this.redis || !key) {
			return false
		}

		if (val instanceof Object) {
			val = JSON.stringify(val)
		}

		if (this.debug) {
			console.log('set cache result by key:' + key, val)
		}

		return await this.redis.set(key, val, 'EX', expireTime || this.config.cachetime)
	}

	/**
	 * 清除redis缓存
	 * @param {String} key 键值
	 */
	async clearCache(key) {
		if (!this.redis || !key) {
			return false
		}

		if (this.debug) {
			console.log('delete cache by key:' + key)
		}

		return await this.redis.del(key)
	}

	getCacheKeyByParams(params) {
		return Object.keys(params).map((key) => key + ':' + params[key]).join('-')
	}

	/**
	 * 通过数据表主键（_id）获取数据
	 * @param {String} tab 表名
	 * @param {String} id 主键值
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async getById(tab, id, useDBPre = true) {
		const condition = {}
		condition[this.primaryKey] = id
		const info = await this.getCollection(tab, useDBPre).where(condition).get()
		return (info && info.data.length > 0) ? info.data[0] : []
	}

	/**
	 * 插入数据到数据表
	 * @param {String} tab 表名
	 * @param {Object} params 字段参数
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async insert(tab, params, useDBPre = true) {
		params = params || this.params
		return await this.getCollection(tab, useDBPre).add(params)
	}

	/**
	 * 修改数据表数据
	 * @param {String} tab 表名
	 * @param {Object} params 字段参数
	 * @param {Object} condition 条件
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async update(tab, params, condition, useDBPre = true) {
		params = params || this.params
		return await this.getCollection(tab).where(condition).update(params)
	}

	/**
	 * 删除数据表数据
	 * @param {String} tab 表名
	 * @param {Object} condition 条件
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async delete(tab, condition, useDBPre = true) {
		if (!condition) {
			return false
		}
		return await this.getCollection(tab, useDBPre).where(condition).remove()
	}

	/**
	 * 批量插入 - 云服务空间对单条mongo语句执行时间有限制，所以批量插入需限制每次执行条数
	 * @param {String} tab 表名
	 * @param {Object} data 数据集合
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async batchInsert(tab, data, useDBPre = true) {
		let batchInsertNum = this.getConfig('batchInsertNum') || 1000
		batchInsertNum = Math.min(batchInsertNum, 1000) // 兼容支付宝云最大1000
		const insertNum = Math.ceil(data.length / batchInsertNum)
		let start;
		let end;
		let fillData;
		let insertRes;
		const res = {
			code: 0,
			msg: 'success',
			data: {
				inserted: 0
			}
		}
		for (let p = 0; p < insertNum; p++) {
			start = p * batchInsertNum
			end = Math.min(start + batchInsertNum, data.length)
			fillData = []
			for (let i = start; i < end; i++) {
				fillData.push(data[i])
			}
			if (fillData.length > 0) {
				insertRes = await this.insert(tab, fillData, useDBPre)
				if (insertRes && insertRes.inserted) {
					res.data.inserted += insertRes.inserted
				}
			}
		}
		return res
	}

	/**
	 * 批量删除 - 云服务空间对单条mongo语句执行时间有限制，所以批量删除需限制每次执行条数
	 * @param {String} tab 表名
	 * @param {Object} condition 条件
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async batchDelete(tab, condition, useDBPre = true) {
		const batchDeletetNum = 5000;
		let deleteIds;
		let delRes;
		let thisCondition
		const res = {
			code: 0,
			msg: 'success',
			data: {
				deleted: 0
			}
		}
		let run = true
		while (run) {
			const dataRes = await this.getCollection(tab).where(condition).limit(batchDeletetNum).get()
			if (dataRes && dataRes.data.length > 0) {
				deleteIds = []
				for (let i = 0; i < dataRes.data.length; i++) {
					deleteIds.push(dataRes.data[i][this.primaryKey])
				}
				if (deleteIds.length > 0) {
					thisCondition = {}
					thisCondition[this.primaryKey] = {
						$in: deleteIds
					}
					delRes = await this.delete(tab, thisCondition, useDBPre)
					if (delRes && delRes.deleted) {
						res.data.deleted += delRes.deleted
					}
				}
			} else {
				run = false
			}
		}
		return res
	}

	/**
	 * 基础查询
	 * @param {String} tab 表名
	 * @param {Object} params 查询参数 where：where条件，field：返回字段，skip：跳过的文档数，limit：返回的记录数，orderBy：排序，count：返回查询结果的数量
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async select(tab, params, useDBPre = true) {
		const {
			where,
			field,
			skip,
			limit,
			orderBy,
			count
		} = params

		const query = this.getCollection(tab, useDBPre)

		//拼接where条件
		if (where) {
			if (where.length > 0) {
				where.forEach(key => {
					query.where(where[key])
				})
			} else {
				query.where(where)
			}
		}

		//排序
		if (orderBy) {
			Object.keys(orderBy).forEach(key => {
				query.orderBy(key, orderBy[key])
			})
		}

		//指定跳过的文档数
		if (skip) {
			query.skip(skip)
		}

		//指定返回的记录数
		if (limit) {
			query.limit(limit)
		}

		//指定返回字段
		if (field) {
			query.field(field)
		}

		//指定返回查询结果数量
		if (count) {
			return await query.count()
		}

		//返回查询结果数据
		return await query.get()
	}

	/**
	 * 查询并返回全部数据
	 * @param {String} tab 表名
	 * @param {Object} condition 条件
	 * @param {Object} field 指定查询返回字段
	 * @param {Boolean} useDBPre 是否使用数据表前缀
	 */
	async selectAll(tab, condition, field = {}, useDBPre = true) {
		const countRes = await this.getCollection(tab, useDBPre).where(condition).count()
		if (countRes && countRes.total > 0) {
			const pageCount = Math.ceil(countRes.total / this.selectMaxLimit)
			let res, returnData
			for (let p = 0; p < pageCount; p++) {
				res = await this.getCollection(tab, useDBPre).where(condition).orderBy(this.primaryKey, 'asc').skip(p *
					this.selectMaxLimit).limit(this.selectMaxLimit).field(field).get()
				if (!returnData) {
					returnData = res
				} else {
					returnData.affectedDocs += res.affectedDocs
					for (const i in res.data) {
						returnData.data.push(res.data[i])
					}
				}
			}
			return returnData
		}
		return {
			affectedDocs: 0,
			data: []
		}
	}

	/**
	 * 聚合查询
	 * @param {String} tab 表名
	 * @param {Object} params 聚合参数
	 */
	async aggregate(tab, params) {
		let {
			project,
			match,
			lookup,
			group,
			skip,
			limit,
			sort,
			getAll,
			useDBPre,
			addFields
		} = params
		//useDBPre 是否使用数据表前缀
		useDBPre = (useDBPre !== null && useDBPre !== undefined) ? useDBPre : true
		const query = this.getCollection(tab, useDBPre).aggregate()

		//设置匹配条件
		if (match) {
			query.match(match)
		}

		//设置返回字段
		if (project) {
			query.project(project)
		}

		//数据表关联
		if (lookup) {
			query.lookup(lookup)
		}

		//分组
		if (group) {
			if (group.length > 0) {
				for (const gi in group) {
					query.group(group[gi])
				}
			} else {
				query.group(group)
			}
		}

		//添加字段
		if (addFields) {
			query.addFields(addFields)
		}

		//排序
		if (sort) {
			query.sort(sort)
		}

		//分页
		if (skip) {
			query.skip(skip)
		}
		if (limit) {
			query.limit(limit)
		} else if (!getAll) {
			query.limit(this.selectMaxLimit)
		}

		//如果未指定全部返回则直接返回查询结果
		if (!getAll) {
			return await query.end()
		}

		//若指定了全部返回则分页查询全部结果后再返回
		const resCount = await query.group({
			_id: {},
			aggregate_count: {
				$sum: 1
			}
		}).end()

		if (resCount && resCount.data.length > 0 && resCount.data[0].aggregate_count > 0) {
			//分页查询
			const total = resCount.data[0].aggregate_count
			const pageCount = Math.ceil(total / this.selectMaxLimit)
			let res, returnData
			params.limit = this.selectMaxLimit
			params.getAll = false
			//结果合并
			for (let p = 0; p < pageCount; p++) {
				params.skip = p * params.limit
				res = await this.aggregate(tab, params)
				if (!returnData) {
					returnData = res
				} else {
					returnData.affectedDocs += res.affectedDocs
					for (const i in res.data) {
						returnData.data.push(res.data[i])
					}
				}
			}
			return returnData
		} else {
			return {
				affectedDocs: 0,
				data: []
			}
		}
	}
}
