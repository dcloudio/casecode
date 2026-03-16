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

export default [{
	title: '受访页',
	field: 'path',
	tooltip: '设备进入应用访问的所有页面，例如设备从页面1进入应用，跳转到页面2，1,2均为受访页',
	stat: -1
}, {
	title: '页面名称',
	field: 'title',
	stat: -1
},
{
	title: '访问次数',
	field: 'visit_times',
	tooltip: '访问过应用内任意页面总次数，多个页面之间跳转、同一页面的重复访问计为多次访问；',
	value: 0
}, {
	title: '退出页次数',
	field: 'exit_times',
	tooltip: '作为访问会话最后一个访问页面(即离开页）的次数',
	value: 0
}, {
	title: '退出率',
	field: 'exitRate',
	computed: 'exit_times/visit_times',
	formatter: '%',
	tooltip: '在此页面，选择离开应用占此页面访问次数的比例',
	// value: 0,
	stat: -1
}, {
	title: '访问总时长(秒)',
	field: 'duration',
	disabled: true,
}, {
	title: '次均停留时长',
	field: 'avg_device_session_time',
	computed: 'duration/visit_times',
	formatter: ':',
	tooltip: '平均每次打开应用停留在应用内的总时长，即应用停留总时长/启动次数',
	value: 0
}, {
	title: '设备平均停留时长',
	field: 'avg_user_time',
	computed: 'duration/visit_devices',
	formatter: ':',
	tooltip: '平均每个设备停留在应用内的总时长，即应用停留总时长/访问设备数',
	value: 0
}, {
	title: '分享次数',
	field: 'share_count',
	tooltip: '页面被分享成功的次数',
	value: 0
}]
