``` js
{
	"bsonType": "object",
	"required": ["title", "slider"],
	"permission": {
		"read": true,
		"create": true,
		"update": true,
		"delete": true
	},
	"properties": {
		"_id": {
			"description": "ID，系统自动生成",
			"foreignKey": "comment.article_id"
		},
		"username": {
			"bsonType":"string",
			"title":"真实姓名",
			"description":"限制只能输入中文",
			"pattern":"^[\u4e00-\u9fa5]+$",
			"errorMessage":"只能输入中文"
		},
		"gender": {
			"bsonType": "int",
			"title": "性别",
			"description": "用户性别：0 未知 1 男性 2 女性",
			"defaultValue": 0,
			"enum": [
				{
				  "text": "未知",
				  "value": 0
				},
				{
				  "text": "男",
				  "value": 1
				},
				{
				  "text": "女",
				  "value": 2
				}
			]
		},
		"birth_date": {
			"bsonType": "timestamp",
			"title": "生日"
		},
		"weight": {
			"bsonType": "int",
			"title": "体重",
			"exclusiveMinimum":false,
			"exclusiveMaximum":true,
			"minimum":50,
			"maximum":500,
			"description":"限输入 >50 && <=500"
		},
		"mobile": {
			"bsonType": "string",
			"title": "手机号码",
			"description": "手机号码",
			"pattern": "^\\+?[0-9-]{3,20}$"
		},
		"email": {
			"bsonType": "string",
			"description": "请输入你的邮箱账号",
			"title": "邮箱账号",
			"format": "email"
		},
		"url": {
			"bsonType": "string",
			"description": "请输入网址的地址",
			"title": "个人博客",
			"format": "url"
		},
		"favorite_book": {
			"bsonType": "string",
			"title": "喜欢的书",
			"description":"选项来源book表",
			"enum": {
				"collection": "book", // 表名，这里使用 uni-id-roles表举例，在uniCloud控制台使用 opendb 创建此表
				"field": "title as text, _id as value", //字段筛选，需要 as 成前端组件支持的字段名 text、value。text、value是datacom组件规范的标准
				//"where": "'type' != formData.organization", // 查询条件
				"orderby": "desc" // 排序字段及正序倒叙设置
			}
		},
		"address": {
		  "bsonType": "string",
		  "title": "地址",
		  "description": "",
		  "enumType": "tree",
		  "enum": {
		    "collection": "opendb-city-china",
		    "orderby": "value asc",
		    "field": "code as value, name as text"
		  }
		},
		"party_member": {
			"bsonType": "bool",
			"description": "字段类型为bool时，默认使用switch组件",
			"title": "是否为党员"
		},
		"hobby": {
			"bsonType": "array",
			"description": "字段类型为Array时，默认使用uni-data-checkbox组件",
			"title": "业余爱好",
			"enum": [{
					"text": "唱歌",
					"value": "Sing"
				},
				{
					"text": "跳舞",
					"value": "dance"
				},
				{
					"text": "画画",
					"value": "draw"
				}
			],
			"component": {
				"name": "uni-data-checkbox",
				"props": {
					"multiple": true
				}
			}
		},
		"comment":{
			"bsonType":"string",
			"title":"备注",
			"description":"拒绝违禁词,如：test",
			"validateFunction":"word_filter",
			"component":{
				"name":"textarea"
			}
		},
		"create_time": {
			"bsonType": "timestamp",
			"description": "创建时间",
			"forceDefaultValue": {
				"$env": "now"
			}
		},
		"ip":{
			"bsonType":"string",
			"forceDefaultValue":{
				"$env":"clientIP"
			}
		}
		// "user_number": {
		// 	"bsonType": "int",
		// 	"description": "请输入-100<=，<100的整数",
		// 	"title": "整数框",
		// 	"maximum": 100,
		// 	"minimum": -100,
		// 	"exclusiveMinimum": true
		// },
		// "slider": {
		// 	"bsonType": "int",
		// 	"description": "必填字段且配置minimum、maximum，会以slider组件渲染",
		// 	"title": "含100不含0",
		// 	"maximum": 100,
		// 	"exclusiveMaximum": false,
		// 	"minimum": 0,
		// 	"exclusiveMinimum": true
		// },
	}
}
```