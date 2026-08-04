
// 表单校验规则由 DB-Schema 生成，不建议直接修改校验规则，而建议通过 DB-Schema 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema



export default {
  "nickname": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "username": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "state": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "defaultValue": 0
  },
  "phone": {
    "rules": [
      {
        "format": "string"
      }
    ]
  }
}
