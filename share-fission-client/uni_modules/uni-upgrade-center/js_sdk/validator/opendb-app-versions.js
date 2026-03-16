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
				"range": [{
						"value": "Android",
						"text": "安卓"
					},
					{
						"value": "iOS",
						"text": "苹果"
					}
				]
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
		"label": "包地址"
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
	}
}

const enumConverter = {
	"platform_valuetotext": [{
			"value": "Android",
			"text": "安卓"
		},
		{
			"value": "iOS",
			"text": "苹果"
		}
	],
	"type_valuetotext": {
		"native_app": "原生App安装包",
		"wgt": "wgt资源包"
	}
}

export {
	validator,
	enumConverter
}
