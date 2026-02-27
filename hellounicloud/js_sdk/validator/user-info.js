// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema
import word_filter from './validateFunction/word_filter.js'

const validator = {
  "username": {
    "rules": [
      {
        "format": "string",
        "errorMessage": "只能输入中文"
      },
      {
        "pattern": "^[\\u4e00-\\u9fa5]+$",
        "errorMessage": "只能输入中文"
      }
    ],
    "label": "真实姓名"
  },
  "gender": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
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
      }
    ],
    "defaultValue": 0,
    "label": "性别"
  },
  "birth_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "label": "生日"
  },
  "weight": {
    "rules": [
      {
        "format": "int"
      },
      {
        "minimum": 50,
        "maximum": 500,
        "exclusiveMinimum": false,
        "exclusiveMaximum": true
      }
    ],
    "label": "体重"
  },
  "mobile": {
    "rules": [
      {
        "format": "string"
      },
      {
        "pattern": "^\\+?[0-9-]{3,20}$"
      }
    ],
    "label": "手机号码"
  },
  "email": {
    "rules": [
      {
        "format": "string"
      },
      {
        "format": "email"
      }
    ],
    "label": "邮箱账号"
  },
  "url": {
    "rules": [
      {
        "format": "string"
      },
      {
        "format": "url"
      }
    ],
    "label": "个人博客"
  },
  "favorite_book_id": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "label": "喜欢的书"
  },
  "address_code": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "label": "地址"
  },
  "party_member": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "label": "是否为党员"
  },
  "hobby": {
    "rules": [
      {
        "format": "array"
      },
      {
        "range": [
          {
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
        ]
      }
    ],
    "label": "业余爱好"
  },
  "comment": {
    "rules": [
      {
        "format": "string"
      },
      {
        validateFunction: word_filter
      }
    ],
    "label": "备注"
  }
}

const enumConverter = {
  "gender_valuetotext": {
    "0": "未知",
    "1": "男",
    "2": "女"
  },
  "hobby_valuetotext": [
    {
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
  ]
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

export { validator, enumConverter, filterToWhere }
