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
	value: '今天',
	contrast: '昨天',
	// stat: -1
}, {
	title: '新增用户',
	field: 'new_user_count',
	tooltip: '首次访问应用的用户数（以用户为判断标准，去重）',
	value: 0,
	contrast: 0
}, {
	title: '活跃用户',
	field: 'active_user_count',
	tooltip: '访问过应用内任意页面的总用户数，今日数据为每小时活跃用户累加（未虑重），昨日数据为全天活跃用户虑重后结果。',
	value: 0,
	contrast: 0
}, {
	title: '次均停留时长',
	field: 'avg_user_session_time',
	computed: 'duration/user_session_times',
	formatter: ':',
	tooltip: '平均每次打开应用停留在应用内的总时长，即应用停留总时长/启动次数',
	value: 0,
	contrast: 0,
	//stat: 'avg'
}, {
	title: '人均停留时长 ',
	field: 'avg_user_time',
	computed: 'duration/active_user_count',
	formatter: ':',
	tooltip: '平均每个用户停留在应用内的总时长，即应用停留总时长/活跃用户',
	value: 0,
	contrast: 0,
	//stat: 'avg'
}, {
	title: '总用户数',
	field: 'total_users',
	tooltip: '从添加统计到当前选择时间的总用户数（去重）',
	value: 0,
	contrast: 0
}]

const resFieldsMap = [{
	title: '受访页',
	field: 'path',
	tooltip: '用户进入应用访问的所有页面，例如用户从页面1进入应用，跳转到页面2，1,2均为受访页',
	formatter: ''
}, {
	title: '访问次数',
	field: 'visit_times',
	tooltip: '访问该页面的总次数',
	value: 0

}, {
	title: '占比',
	field: 'rate',
	computed: 'visit_times/total_app_access',
	tooltip: '某个页面的访问次数占所有页面访问次数的比例',
	formatter: '%',
}]

const entFieldsMap = [{
	title: '入口页',
	field: 'path',
	tooltip: '用户进入应用访问的第一个页面，例如用户从页面1进入应用，跳转到页面2，1为入口页，而2不是',
	formatter: ''
}, {
	title: '访问次数',
	field: 'entry_count',
	tooltip: '访问该页面的总次数',
	value: 0
}, {
	title: '占比',
	field: 'rate',
	computed: 'entry_count/total_app_access',
	tooltip: '某个页面的访问次数占所有页面访问次数的比例',
	formatter: '%'
}]

export {
	fieldsMap,
	resFieldsMap,
	entFieldsMap
}
