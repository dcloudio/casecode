// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "appid": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "version": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "platform": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "channel": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "sdk_version": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_id": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_net": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_os": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_os_version": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_vendor": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_model": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_is_root": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "device_os_name": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_batt_level": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "device_batt_temp": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "device_memory_use_size": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "device_memory_total_size": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "device_disk_use_size": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "device_disk_total_size": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "device_abis": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "app_count": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "app_use_memory_size": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "app_webview_count": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "app_use_duration": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "app_run_fore": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "package_name": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "package_version": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "page_url": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "error_msg": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "create_time": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  }
}

const enumConverter = {}

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
