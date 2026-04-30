/**
 * 页面上的数据都来自数据库，且多处 ui 消费，页面直接使用字段会造成耦合和无谓的重复，固在此抽出来统一配置和处理（计算、格式化等）
 * title 显示所使用名称
 * field 字段名
 * computed 计算表达式配置（需要 mapfield 函数支持）
 * tooltip 对字段解释的提示文字
 * formatter 数字格式化的配置，省缺为 ','
  	* '' 空字符串 则表示不格式化
	* ',' 数字格式，例：1000 格式为 1,000
	* '%' 百分比格式 例：0.1 格式为 10%
	* ':' 时分秒格式 例：90 格式为 00:01:30
	* '-' 日期格式 例：1655196831390(值需为时间戳) 格式为 2022-06-14
 * fix 数字保留几位小数，>1 默认不保留小数，<1 默认保留两位小数
 * value 默认值 (仅用于 uni-stat-panel 组件) todo: 可移除
 * contrast 对比值 (仅用于 uni-stat-panel 组件) todo: 可移除
 */


export default [{
	title: '日期',
	field: 'start_time',
	tooltip: '',
	formatter: '-',
}, {
	title: '日活',
	field: 'active_device_count',
	tooltip: '选中日期当天的访问用户数',
}, {
	title: '周活',
	field: 'week_active_device_count',
	tooltip: '选中日期所在自然周（包括选中日期在内）的访问用户数',
}, {
	title: '日活/周活',
	field: 'active_device_count/week_active_device_count',
	computed: 'active_device_count/week_active_device_count',
	tooltip: '选中日期的访问用户数占周访问用户数的百分比',
	formatter: '%',
}, {
	title: '月活',
	field: 'month_active_device_count',
	tooltip: '选中日期所在自然月（包括选中日期在内）的访问用户数',
}, {
	title: '日活/月活',
	field: 'active_device_count/month_active_device_count',
	computed: 'active_device_count/month_active_device_count',
	tooltip: '选中日期的访问用户数占月访问用户数的百分比',
	formatter: '%',
}]
