// 校验规则由 schema 生成，请不要直接修改当前文件，如果需要请在uniCloud控制台修改schema
// uniCloud: https://unicloud.dcloud.net.cn/



export default {
  "menu_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "name": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "icon": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "url": {
    "rules": [
      {
        "format": "string"
      },
			{
				validateFunction:function(rule,value,data,callback){
					if (value !== "" && value.indexOf("http") === -1 && value.indexOf("/") !==0){
						callback('URL必须以/开头，如/pages/index/index')
					}
					return true
				}
			}
    ]
  },
  "sort": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "parent_id": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "permission": {
    "rules": [
      {
        "format": "array"
      }
    ]
  },
  "enable": {
    "rules": [
      {
        "format": "bool"
      }
    ]
  }
}
