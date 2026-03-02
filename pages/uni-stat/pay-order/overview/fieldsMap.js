/**
 * 页面上的数据都来自数据库，且多处 ui 消费，页面直接使用字段会造成耦合和冗余，固在此抽出来统一配置（clientdb 查询方法、概念文字提示等）和处理（对值再计算、格式化等）
 * title 显示所使用名称
 * field 数据库字段名
 * multiple 显示的倍数，只对number类型生效，如原值为100，multiple=0.01 则显示成1
 * tooltip 对字段解释的提示文字
 * formatter 数字格式化的配置，省缺为 ','
 * '' 空字符串 则表示不格式化
 * ',' 数字格式，例：1000 格式为 1,000
 * '%' 百分比格式 例：0.1 格式为 10%
 * '-' 日期格式 例：1655196831390(值需为时间戳) 格式为 2022-06-14
 * stat 对字段做 groupField 时需使用的数据库计算方法，省缺为 'sum'
 * 'sum' 表示对字段做求和运算
 * 'avg' 表示对字段做平均运算
 * '-1' 表示不对字段做运算
 * fix 数字保留几位小数，>1 默认不保留小数，<1 默认保留两位小数
 * value 默认值 (仅用于 uni-stat-panel 组件) todo: 可移除
 * contrast 对比值 (仅用于 uni-stat-panel 组件) todo: 可移除
 */

const fieldsGroupMap = [
	{
		title: '订单金额', group: "total_amount",
		list:[
			{ title: '下单金额', field: 'create_total_amount', tooltip: '下单：统计时间内，下单金额（包含未支付订单和退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, trendChart: true, multiple:0.01 },
			{ title: '收款金额', field: 'pay_total_amount', tooltip: '收款：统计时间内，成功支付的订单金额（包含退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, trendChart: true, multiple:0.01 },
			{ title: '退款金额', field: 'refund_total_amount', tooltip: '退款：统计时间内，发生退款的金额。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, multiple:0.01 },
		]
	},
	{
		title: '订单数量', group: "order_count",
		list:[
			{ title: '下单数量', field: 'create_order_count', tooltip: '下单：统计时间内，成功下单的订单笔数（包含未支付订单和退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
			{ title: '收款数量', field: 'pay_order_count', tooltip: '收款：统计时间内，成功支付的订单数（包含退款订单）。', formatter: '', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
			{ title: '退款数量', field: 'refund_order_count', tooltip: '退款：统计时间内，发生退款的订单数。', formatter: '', value: "-", contrast: 0, stat: 'sum', fix:0 },
		]
	},
	{
		title: '用户数量', group: "user_count",
		list:[
			{ title: '下单用户数', field: 'create_user_count', tooltip: '下单：统计时间内，成功下单的客户数（包含未支付订单和退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
			{ title: '收款用户数', field: 'pay_user_count', tooltip: '收款：统计时间内，成功支付的用户数（包含退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
			{ title: '退款用户数', field: 'refund_user_count', tooltip: '退款：统计时间内，发生退款的用户数。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0 },
		]
	},
	{
		title: '设备数量', group: "device_count",
		list:[
			{ title: '下单设备数', field: 'create_device_count', tooltip: '下单：统计时间内，成功下单的设备数（包含未支付订单和退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
			{ title: '收款设备数', field: 'pay_device_count', tooltip: '收款：统计时间内，成功支付的设备数（包含退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
			{ title: '退款设备数', field: 'refund_device_count', tooltip: '退款：统计时间内，发生退款的设备数。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:0 },
		]
	},
];

let fieldsMap = [];

fieldsGroupMap.map((item1, index1) => {
	item1.list.map((item2, index2) => {
		fieldsMap.push(item2);
	});
});


const statPanelTodayFieldsMap = [
	{ title: '下单金额（GMV）', field: 'create_total_amount', tooltip: '统计时间内，下单金额（包含未支付订单和退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, trendChart: true, multiple:0.01 },
	{ title: '收款金额（GPV）', field: 'pay_total_amount', tooltip: '统计时间内，成功支付的订单金额（包含退款订单）。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, trendChart: true, multiple:0.01 },
	//{ title: '支付订单数量', field: 'pay_order_count', tooltip: '统计时间内，成功支付的订单数（包含退款订单）。', formatter: '', value: "-", contrast: 0, stat: 'sum', fix:0, trendChart: true },
	{ title: '退款金额', field: 'refund_total_amount', tooltip: '统计时间内，发生退款的金额。', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, trendChart: true, multiple:0.01 },
	{ title: '实收金额', field: 'actual_total_amount', tooltip: '实收金额=收款金额-退款金额', formatter: ',', value: "-", contrast: 0, stat: 'sum', fix:2, trendChart: true, multiple:0.01 },
];

export {
	fieldsMap,
	fieldsGroupMap,
	statPanelTodayFieldsMap
}
