// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
	"username": {
		"rules": [{
				"required": true,
				"errorMessage": '请输入用户名',
			},
			{
				"minLength": 3,
				"maxLength": 32,
				"errorMessage": '用户名长度在 {minLength} 到 {maxLength} 个字符',
			},
			{
				validateFunction: function(rule, value, data, callback) {
					// console.log(value);
					if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
						callback('用户名不能是：手机号或邮箱')
					};
					if (/^\d+$/.test(value)) {
						callback('用户名不能为纯数字')
					};
					if(/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)){
						callback('用户名不能包含中文')
					}
					return true
				}
			}
		],
		"label": "用户名"
	},
	"nickname": {
		"rules": [{
				minLength: 3,
				maxLength: 32,
				errorMessage: '昵称长度在 {minLength} 到 {maxLength} 个字符',
			},
			{
				validateFunction: function(rule, value, data, callback) {
					// console.log(value);
					if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
						callback('昵称不能是：手机号或邮箱')
					};
					if (/^\d+$/.test(value)) {
						callback('昵称不能为纯数字')
					};
					// if(/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)){
					// 	callback('昵称不能包含中文')
					// }
					return true
				}
			}
		],
		"label": "昵称"
	},
	"password": {
		"rules": [{
				"required": true,
			},
			{
				"format": "password"
			},
			{
				"minLength": 6
			}
		],
		"label": "密码"
	},
	"mobile": {
		"rules": [{
				"format": "string"
			},
			{
				"pattern": "^\\+?[0-9-]{3,20}$"
			}
		],
		"label": "手机号码"
	},
	"status": {
		"rules": [{
				"format": "int"
			},
			{
				"range": [{
						"text": "正常",
						"value": 0
					},
					{
						"text": "禁用",
						"value": 1
					},
					{
						"text": "审核中",
						"value": 2
					},
					{
						"text": "审核拒绝",
						"value": 3
					}
				]
			}
		],
		"defaultValue": 0,
		"label": "用户状态"
	},
	"email": {
		"rules": [{
				"format": "string"
			},
			{
				"format": "email"
			}
		],
		"label": "邮箱"
	},
	"role": {
		"rules": [{
			"format": "array"
		}],
		"label": "角色"
	},
	"last_login_date": {
		"rules": [{
			"format": "timestamp"
		}]
	}
}

const enumConverter = {
	"status_valuetotext": {
		"0": "正常",
		"1": "禁用",
		"2": "审核中",
		"3": "审核拒绝"
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

export {
	validator,
	enumConverter,
	filterToWhere
}
