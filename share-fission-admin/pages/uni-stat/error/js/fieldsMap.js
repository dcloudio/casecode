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

const fieldsMap = [{
	title: '最近发生时间',
	field: 'last_time',
	tooltip: '',
	formatter: '',
}, {
	title: '错误次数',
	field: 'count',
	tooltip: '相同错误在某时间段内发生的次数',
}, {
	title: '错误占比',
	computed: 'count/total_count',
	field: 'count/total_count',
	formatter: '%',
	tooltip: '某个错误发生的次数/总错误数',
}, {
	title: '平台',
	field: 'platform',
	formatter: '',
}, {
	title: '平台版本号',
	field: 'version',
	tooltip: '原生平台为客户端 SDK 版本号；小程序平台为微信、支付宝、百度等应用的版本号',
	formatter: '',
}, {
	title: '错误信息',
	field: 'msg',
	formatter: '',
}]

const popupFieldsMap = [{
	title: '创建时间',
	field: 'create_time',
	formatter: '',
}, {
	title: '客户端操作系统',
	field: 'os',
	formatter: '',
}, {
	title: '客户端 user-agent 信息',
	field: 'ua',
	formatter: '',
}]

export {
	fieldsMap,
	popupFieldsMap,
}
