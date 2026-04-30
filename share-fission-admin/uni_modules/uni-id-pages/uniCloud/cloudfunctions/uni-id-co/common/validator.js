const {
  isValidString,
  getType
} = require('./utils.js')
const {
  ERROR
} = require('./error')

const baseValidator = Object.create(null)

baseValidator.username = function (username) {
  const errCode = ERROR.INVALID_USERNAME
  if (!isValidString(username)) {
    return {
      errCode
    }
  }
  if (/^\d+$/.test(username)) {
    // 用户名不能为纯数字
    return {
      errCode
    }
  };
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    // 用户名仅能使用数字、字母、“_”及“-”
    return {
      errCode
    }
  }
}

baseValidator.password = function (password) {
  const errCode = ERROR.INVALID_PASSWORD
  if (!isValidString(password)) {
    return {
      errCode
    }
  }
  if (password.length < 6) {
    // 密码长度不能小于6
    return {
      errCode
    }
  }
}

baseValidator.mobile = function (mobile) {
  const errCode = ERROR.INVALID_MOBILE
  if (getType(mobile) !== 'string') {
    return {
      errCode
    }
  }
  if (mobile && !/^1\d{10}$/.test(mobile)) {
    return {
      errCode
    }
  }
}

baseValidator.email = function (email) {
  const errCode = ERROR.INVALID_EMAIL
  if (getType(email) !== 'string') {
    return {
      errCode
    }
  }
  if (email && !/@/.test(email)) {
    return {
      errCode
    }
  }
}

baseValidator.nickname = function (nickname) {
  const errCode = ERROR.INVALID_NICKNAME
  if (nickname.indexOf('@') !== -1) {
    // 昵称不允许含@
    return {
      errCode
    }
  };
  if (/^\d+$/.test(nickname)) {
    // 昵称不能为纯数字
    return {
      errCode
    }
  };
  if (nickname.length > 100) {
    // 昵称不可超过100字符
    return {
      errCode
    }
  }
}

const baseType = ['string', 'boolean', 'number', 'null'] // undefined不会由客户端提交上来

baseType.forEach((type) => {
  baseValidator[type] = function (val) {
    if (getType(val) === type) {
      return
    }
    return {
      errCode: ERROR.INVALID_PARAM
    }
  }
})

function tokenize(name) {
  let i = 0
  const result = []
  let token = ''
  while (i < name.length) {
    const char = name[i]
    switch (char) {
      case '|':
      case '<':
      case '>':
        token && result.push(token)
        result.push(char)
        token = ''
        break
      default:
        token += char
        break
    }
    i++
    if (i === name.length && token) {
      result.push(token)
    }
  }
  return result
}

/**
 * 处理validator名
 * @param {string} name
 */
function parseValidatorName(name) {
  const tokenList = tokenize(name)
  let i = 0
  let currentToken = tokenList[i]
  const result = {
    type: 'root',
    children: [],
    parent: null
  }
  let lastRealm = result
  while (currentToken) {
    switch (currentToken) {
      case 'array': {
        const currentRealm = {
          type: 'array',
          children: [],
          parent: lastRealm
        }
        lastRealm.children.push(currentRealm)
        lastRealm = currentRealm
        break
      }
      case '<':
        if (lastRealm.type !== 'array') {
          throw new Error('Invalid validator token "<"')
        }
        break
      case '>':
        if (lastRealm.type !== 'array') {
          throw new Error('Invalid validator token ">"')
        }
        lastRealm = lastRealm.parent
        break
      case '|':
        if (lastRealm.type !== 'array' && lastRealm.type !== 'root') {
          throw new Error('Invalid validator token "|"')
        }
        break
      default:
        lastRealm.children.push({
          type: currentToken
        })
        break
    }
    i++
    currentToken = tokenList[i]
  }
  return result
}

function getRuleCategory(rule) {
  switch (rule.type) {
    case 'array':
      return 'array'
    case 'root':
      return 'root'
    default:
      return 'base'
  }
}


// 特殊符号 https://www.ibm.com/support/pages/password-strength-rules  ~!@#$%^&*_-+=`|\(){}[]:;"'<>,.?/
// const specialChar = '~!@#$%^&*_-+=`|\(){}[]:;"\'<>,.?/'
// const specialCharRegExp = /^[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]$/
// for (let i = 0, arr = specialChar.split(''); i < arr.length; i++) {
//   const char = arr[i]
//   if (!specialCharRegExp.test(char)) {
//     throw new Error('check special character error: ' + char)
//   }
// }

// 密码强度表达式
const passwordRules = {
  // 密码必须包含大小写字母、数字和特殊符号
  super: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
  // 密码必须包含字母、数字和特殊符号
  strong: /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
  // 密码必须为字母、数字和特殊符号任意两种的组合
  medium: /^(?![0-9]+$)(?![a-zA-Z]+$)(?![~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]+$)[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
  // 密码必须包含字母和数字
  weak: /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{6,16}$/,

}

function createPasswordVerifier({
  passwordStrength = ''
} = {}) {
  return function (password) {
    const passwordRegExp = passwordRules[passwordStrength]
    if (!passwordRegExp) {
      throw new Error('Invalid password strength config: ' + passwordStrength)
    }
    const errCode = ERROR.INVALID_PASSWORD
    if (!isValidString(password)) {
      return {
        errCode
      }
    }
    if (!passwordRegExp.test(password)) {
      return {
        errCode: errCode + '-' + passwordStrength
      }
    }
  }
}

function isEmpty(value) {
  return value === undefined || 
  value === null ||
  (typeof value === 'string' && value.trim() === '')
}

class Validator {
  constructor({
    passwordStrength = ''
  } = {}) {
    this.baseValidator = baseValidator
    this.customValidator = Object.create(null)
    if (passwordStrength) {
      this.mixin(
        'password',
        createPasswordVerifier({
          passwordStrength
        })
      )
    }
  }

  mixin(type, handler) {
    this.customValidator[type] = handler
  }

  getRealBaseValidator(type) {
    return this.customValidator[type] || this.baseValidator[type]
  }

  
  _isMatchUnionType(val, rule) {
    if (!rule.children || rule.children.length === 0) {
      return true
    }
    const children = rule.children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const category = getRuleCategory(child)
      let pass = false
      switch (category) {
        case 'base':
          pass = this._isMatchBaseType(val, child)
          break
        case 'array':
          pass = this._isMatchArrayType(val, child)
          break
        default:
          break
      }
      if (pass) {
        return true
      }
    }
    return false
  }

  _isMatchBaseType(val, rule) {
    const method = this.getRealBaseValidator(rule.type)
    if (typeof method !== 'function') {
      throw new Error(`invalid schema type: ${rule.type}`)
    }
    const validateRes = method(val)
    if (validateRes && validateRes.errCode) {
      return false
    }
    return true
  }

  _isMatchArrayType(arr, rule) {
    if (getType(arr) !== 'array') {
      return false
    }
    if (rule.children && rule.children.length && arr.some(item => !this._isMatchUnionType(item, rule))) {
      return false
    }
    return true
  }

  get validator() {
    const _this = this
    return new Proxy({}, {
      get: (_, prop) => {
        if (typeof prop !== 'string') {
          return
        }
        const realBaseValidator = this.getRealBaseValidator(prop)
        if (realBaseValidator) {
          return realBaseValidator
        }
        const rule = parseValidatorName(prop)
        return function (val) {
          if (!_this._isMatchUnionType(val, rule)) {
            return {
              errCode: ERROR.INVALID_PARAM
            }
          }
        }
      }
    })
  }

  validate(value = {}, schema = {}) {
    for (const schemaKey in schema) {
      let schemaValue = schema[schemaKey]
      if (getType(schemaValue) === 'string') {
        schemaValue = {
          required: true,
          type: schemaValue
        }
      }
      const {
        required,
        type
      } = schemaValue
      // value内未传入了schemaKey或对应值为undefined
      if (isEmpty(value[schemaKey])) {
        if (required) {
          return {
            errCode: ERROR.PARAM_REQUIRED,
            errMsgValue: {
              param: schemaKey
            },
            schemaKey
          }
        } else {
          //delete value[schemaKey]
          continue
        }
      }
      const validateMethod = this.validator[type]
      if (!validateMethod) {
        throw new Error(`invalid schema type: ${type}`)
      }
      const validateRes = validateMethod(value[schemaKey])
      if (validateRes) {
        validateRes.schemaKey = schemaKey
        return validateRes
      }
    }
  }
}

function checkClientInfo(clientInfo) {
  const stringNotRequired = {
    required: false,
    type: 'string'
  }
  const numberNotRequired = {
    required: false,
    type: 'number'
  }
  const numberOrStringNotRequired = {
    required: false,
    type: 'number|string'
  }
  const schema = {
    uniPlatform: 'string',
    appId: 'string',
    deviceId: stringNotRequired,
    osName: stringNotRequired,
    locale: stringNotRequired,
    clientIP: stringNotRequired,
    appName: stringNotRequired,
    appVersion: stringNotRequired,
    appVersionCode: numberOrStringNotRequired,
    channel: numberOrStringNotRequired,
    userAgent: stringNotRequired,
    uniIdToken: stringNotRequired,
    deviceBrand: stringNotRequired,
    deviceModel: stringNotRequired,
    osVersion: stringNotRequired,
    osLanguage: stringNotRequired,
    osTheme: stringNotRequired,
    romName: stringNotRequired,
    romVersion: stringNotRequired,
    devicePixelRatio: numberNotRequired,
    windowWidth: numberNotRequired,
    windowHeight: numberNotRequired,
    screenWidth: numberNotRequired,
    screenHeight: numberNotRequired
  }
  const validateRes = new Validator().validate(clientInfo, schema)
  if (validateRes) {
    if (validateRes.errCode === ERROR.PARAM_REQUIRED) {
      console.warn('- 如果使用HBuilderX运行本地云函数/云对象功能时出现此提示，请改为使用客户端调用本地云函数方式调试，或更新HBuilderX到3.4.12及以上版本。\n- 如果是缺少clientInfo.appId，请检查项目manifest.json内是否配置了DCloud AppId')
      throw new Error(`"clientInfo.${validateRes.schemaKey}" is required.`)
    } else {
      throw new Error(`Invalid client info: clienInfo.${validateRes.schemaKey}`)
    }
  }
}

module.exports = {
  Validator,
  checkClientInfo
}
