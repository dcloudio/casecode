// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
	"appid": {
		"rules": [{
				"required": true
			},
			{
				"format": "string"
			}
		],
		"label": "AppID"
	},
	"name": {
		"rules": [{
				"required": true
			},
			{
				"format": "string"
			}
		],
		"label": "应用名称"
	},
	"app_type": {
		"rules": [{
				"required": true
			},
			{
				"format": "int"
			}
		],
		"label": "应用类型"
	},
	"icon_url": {
		"rules": [{
			"format": "string"
		}],
		"label": "应用图标"
	},
	"introduction": {
		"rules": [{
			"format": "string"
		}],
		"label": "应用简介"
	},
	"description": {
		"rules": [{
			"format": "string"
		}],
		"label": "应用描述"
	},
	"screenshot": {
		"rules": [{
			"format": "array"
		}],
		"label": "应用截图"
	},
	"create_date": {
		"rules": [{
			"format": "timestamp"
		}],
		"label": "发行时间"
	}
}

function filterToWhere(filter, command) {
	let where = {}
	for (let field in filter) {
		let {
			type,
			value
		} = filter[field]
		switch (type) {
			case "search":
				if (typeof value === 'string' && value.length) {
					where[field] = new RegExp(value)
				}
				break;
			case "select":
				if (value.length) {
					let selectValue = []
					for (let s of value) {
						selectValue.push(command.eq(s))
					}
					where[field] = command.or(selectValue)
				}
				break;
			case "range":
				if (value.length) {
					let gt = value[0]
					let lt = value[1]
					where[field] = command.and([command.gte(gt), command.lte(lt)])
				}
				break;
			case "date":
				if (value.length) {
					let [s, e] = value
					let startDate = new Date(s)
					let endDate = new Date(e)
					where[field] = command.and([command.gte(startDate), command.lte(endDate)])
				}
				break;
			case "timestamp":
				if (value.length) {
					let [startDate, endDate] = value
					where[field] = command.and([command.gte(startDate), command.lte(endDate)])
				}
				break;
		}
	}
	return where
}
const enumConverter = {}
const mpPlatform = {
	'mp_weixin': '微信小程序',
	'mp_alipay': '支付宝小程序',
	'mp_baidu': '百度小程序',
	'mp_toutiao': '字节小程序',
	'mp_qq': 'QQ小程序',
	'mp_dingtalk': '钉钉小程序',
	'mp_kuaishou': '快手小程序',
	'mp_lark': '飞书小程序',
	'mp_jd': '京东小程序',
	'quickapp': '快应用'
}

export {
	enumConverter,
	validator,
	filterToWhere,
	mpPlatform
}
