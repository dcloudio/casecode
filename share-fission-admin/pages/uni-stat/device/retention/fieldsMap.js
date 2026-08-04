/**
 * 页面上的数据都来自数据库，且多处 ui 消费，页面直接使用字段会造成耦合和冗余，固在此抽出来统一配置（clientdb 查询方法、概念文字提示等）和处理（对值再计算、格式化等）
 * title 显示所使用名称
 * field 数据库字段名
 * computed 计算表达式配置，只支持除法计算（需要 mapfield 函数支持，也可自行扩展）
 * tooltip 对字段解释的提示文字
 * formatter 数字格式化的配置，省缺为 ','
  	* '' 空字符串 则表示不格式化
	* ',' 数字格式，例：1000 格式为 1,000
	* '%' 百分比格式 例：0.1 格式为 10%
	* ':' 时分秒格式 例：90 格式为 00:01:30
	* '-' 日期格式 例：1655196831390(值需为时间戳) 格式为 2022-06-14
 * stat 对字段做 groupField 时需使用的数据库计算方法，省缺为 'sum'
  	* 'sum' 表示对字段做求和运算
  	* 'avg' 表示对字段做平均运算
  	* '-1' 表示不对字段做运算
 * fix 数字保留几位小数，>1 默认不保留小数，<1 默认保留两位小数
 * value 默认值 (仅用于 uni-stat-panel 组件) todo: 可移除
 * contrast 对比值 (仅用于 uni-stat-panel 组件) todo: 可移除
 */

function fieldsFactory(maps = [{
	title: '新增设备',
	field: 'new_device_count',
	stat: 0
}]) {
	let fieldsMap = [{
		title: '日期',
		field: 'start_time',
		tooltip: '',
		formatter: '-',
		stat: -1
	}]

	if (maps) {
		fieldsMap.push(...maps)
	}

	const values = [1, 2, 3, 4, 5, 6, 7, 14, 30]
	const fields = values.map(val => {
		return {
			title: `${val}天后`,
			field: `d_${val}`,
			computed: `d_${val}/${maps[0].field}`,
			formatter: '%',
			tooltip: ''
		}
	})

	fieldsMap = fieldsMap.concat(fields)

	return fieldsMap


}

export default fieldsFactory
