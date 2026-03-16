/**
 * 数据库操作
 */

// 引入配置文件
const dbName = require("./config");

// 创建数据库对象
let db = uniCloud.database();

// 获取数据库命令对象
let _ = db.command;

// 获取聚合操作对象
let $ = _.aggregate;

class Dao {
	
	// 计算符合条件的文档数量
	async count(whereJson) {
		let dbRes = await db.collection(dbName.uniIdUsers).where(whereJson).count();
		return dbRes && dbRes.total ? dbRes.total : 0;
	}

	// 计算具有指定状态的新用户订单数量
	async countNewUserOrder(obj) {
		let {
			whereJson,
			status
		} = obj;
		let dbRes = await db.collection(dbName.uniIdUsers).aggregate()
			.match(whereJson) // 匹配条件
			.lookup({
				from: dbName.uniPayOrders, // 关联集合名称
				let: {
					user_id: '$_id', // 定义关联字段
				},
				pipeline: $.pipeline()
					.match(_.expr($.and([
						$.eq(['$user_id', '$$user_id']), // 关联条件
						$.in(['$status', status]) // 关联条件
					])))
					.limit(1) // 返回结果数量限制
					.done(), // 结束关联管道
				as: 'order', // 关联结果存储字段
			})
			.unwind({
				path: '$order', // 展开关联结果
			})
			.group({
				_id: null, // 分组字段为null，表示整个集合作为一个组
				count: {
					$addToSet: '$_id' // 将符合条件的文档_id添加到数组
				},
			})
			.addFields({
				count: {
					$size: '$count' // 统计数组的长度，即订单数量
				}
			})
			.end(); // 执行聚合操作并返回结果
		try {
			return dbRes.data[0].count; // 返回订单数量
		} catch (err) {
			return 0; // 出现错误时返回0
		}
	}
}

module.exports = new Dao();
