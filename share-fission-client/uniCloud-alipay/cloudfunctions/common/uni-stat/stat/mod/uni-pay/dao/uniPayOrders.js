/**
 * 数据库操作
 */
const BaseMod = require('../../base');
const dbName = require("./config");

class Dao extends BaseMod {

	constructor() {
		super();
		this.tablePrefix = false; // 不使用表前缀
	}

	async group(data) {
		let {
			start_time,
			end_time,
			status: status_str
		} = data;

		let status;
		if (status_str === "已下单") {
			// 留空，表示不筛选特定状态的订单
		} else if (status_str === "已付款") {
			status = {
				$gt: 0
			}; // 状态大于0表示已付款
		} else if (status_str === "已退款") {
			status = {
				$in: [2, 3]
			}; // 状态为2或3表示已退款
		}

		const dbRes = await this.aggregate(dbName.uniPayOrders, {
			match: {
				create_date: {
					$gte: start_time,
					$lte: end_time
				},
				status // 筛选指定状态的订单
			},
			group: {
				_id: {
					appid: '$appid',
					version: '$stat_data.app_version',
					platform: '$stat_data.platform',
					channel: '$stat_data.channel',
				},
				status: {
					$first: '$status'
				},
				// 支付金额
				total_fee: {
					$sum: '$total_fee'
				},
				// 退款金额
				refund_fee: {
					$sum: '$refund_fee'
				},
				// 支付笔数
				order_count: {
					$sum: 1
				},
				// 支付人数（去重复）
				user_count: {
					$addToSet: '$user_id'
				},
				// 支付设备数（去重复）
				device_count: {
					$addToSet: '$device_id'
				},
				create_date: {
					$min: '$create_date'
				}
			},
			addFields: {
				user_count: {
					$size: '$user_count'
				},
				device_count: {
					$size: '$device_count'
				}
			},
			// 按创建时间排序
			sort: {
				create_date: 1
			},
			getAll: true
		});

		let list = dbRes.data;
		list.map((item) => {
			item.status_str = status_str; // 添加状态字符串到结果对象中
		});
		return list;
	}
}

module.exports = new Dao();
