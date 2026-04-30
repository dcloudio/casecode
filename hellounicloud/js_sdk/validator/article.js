
// 表单校验规则由 DB-Schema 生成，不建议直接修改校验规则，而建议通过 DB-Schema 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema

import test1 from '@/js_sdk/validator/validateFunction/test1.js'
import test2 from '@/js_sdk/validator/validateFunction/test2.js'

export default {
  "organization": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "text": "个人",
            "value": 0
          },
          {
            "text": "公司",
            "value": 1
          }
        ]
      }
    ],
    "defaultValue": 0,
    "label": "组织机构"
  },
  "text1": {
    "rules": [
      {
        "format": "string"
      },
      {
        validateFunction: test1
      }
    ],
    "label": "组织名称"
  },
  "text2": {
    "rules": [
      {
        "format": "string"
      },
      {
        validateFunction: test2
      }
    ],
    "label": "备注"
  },
  "text3": {
    "rules": [
      {
        "format": "string",
        "errorMessage": "只能输入中文"
      },
      {
        "pattern": "[一-龥]",
        "errorMessage": "只能输入中文"
      }
    ],
    "label": "姓名"
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
  "dowload_url": {
    "rules": [
      {
        "format": "string"
      },
      {
        "format": "url"
      }
    ],
    "label": "下载地址"
  },
  "enum_link": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "label": "选项来源data-list表"
  },
  "address": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "label": "地址"
  },
  "user_number": {
    "rules": [
      {
        "format": "int"
      },
      {
        "minimum": -100,
        "maximum": 100,
        "exclusiveMinimum": true
      }
    ],
    "label": "整数框"
  },
  "birth_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "label": "生产日期"
  },
  "charge": {
    "rules": [
      {
        "format": "bool"
      }
    ],
    "label": "开关"
  },
  "system": {
    "rules": [
      {
        "format": "array"
      },
      {
        "range": [
          {
            "text": "Mac",
            "value": "Mac"
          },
          {
            "text": "Windows",
            "value": "Windows"
          },
          {
            "text": "Linux",
            "value": "Linux"
          }
        ]
      }
    ],
    "label": "多选框"
  }
}
