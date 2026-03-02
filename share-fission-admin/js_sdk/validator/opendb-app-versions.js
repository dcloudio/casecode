// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema

const PLATFORM = [
	{
		"value": "Android",
		"text": "安卓"
	},
	{
		"value": "iOS",
		"text": "苹果"
	},
	{
		"value": "Harmony",
		"text": "鸿蒙 Next"
	}
]

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
			"format": "string"
		}],
		"label": "应用名称"
	},
	"title": {
		"rules": [{
			"format": "string"
		}],
		"label": "更新标题"
	},
	"contents": {
		"rules": [{
				"required": true
			},
			{
				"format": "string"
			}
		],
		"label": "更新内容"
	},
	"platform": {
		"rules": [{
				"required": true
			},
			/* 此处不校验数据类型，因为platform在发布app端是单选，在发布wgt时可能是多选
			{
				"format": "array"
			}, */
			{
				"range": PLATFORM
			}
		],
		"label": "平台"
	},
	"type": {
		"rules": [{
				"required": true
			}, {
				"format": "string"
			},
			{
				"range": [{
						"value": "native_app",
						"text": "原生App安装包"
					},
					{
						"value": "wgt",
						"text": "wgt资源包"
					}
				]
			}
		],
		"label": "安装包类型"
	},
	"version": {
		"rules": [{
				"required": true
			},
			{
				"format": "string"
			}
		],
		"label": "版本号"
	},
	"min_uni_version": {
		"rules": [{
			"format": "string"
		}],
		"label": "原生App最低版本"
	},
	"url": {
		"rules": [{
			"required": true
		}, {
			"format": "string"
		}],
		"label": "链接"
	},
	"stable_publish": {
		"rules": [{
			"format": "bool"
		}],
		"label": "上线发行"
	},
	"create_date": {
		"rules": [{
			"format": "timestamp"
		}],
		"label": "上传时间"
	},
	"is_silently": {
		"rules": [{
			"format": "bool"
		}],
		"label": "静默更新",
		"defaultValue": false
	},
	"is_mandatory": {
		"rules": [{
			"format": "bool"
		}],
		"label": "强制更新",
		"defaultValue": false
	},
	"uni_platform": {
		"rules": [
			{
				"required": true
			},
			{
				"format": "string"
			}
		],
		"label": "uni 平台"
	},
	"create_env": {
		"rules": [
			{
				"required": true
			},
			{
				"format": "string"
			}
		]
	},
	"store_list": {
		"rules": [{
			"format": "array"
		}],
		"label": "应用市场"
	},
}

const enumConverter = {
	"platform_valuetotext": PLATFORM,
	"type_valuetotext": {
		"native_app": "原生App安装包",
		"wgt": "wgt资源包"
	}
}

function filterToWhere(filter, command) {
  let where = {}
  for (let field in filter) {
    let { type, value } = filter[field]
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
