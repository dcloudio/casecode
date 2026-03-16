const {
  isFn,
  isPlainObject
} = require('./utils')

/**
 * 实例参数处理，注意：不进行递归处理
 * @param {Object} params 初始参数
 * @param {Object} rule 规则集
 * @returns {Object} 处理后的参数
 */
function parseParams (params = {}, rule) {
  if (!rule || !params) {
    return params
  }
  const internalKeys = ['_pre', '_purify', '_post']
  // 转换之前的处理
  if (rule._pre) {
    params = rule._pre(params)
  }
  // 净化参数
  let purify = { shouldDelete: new Set([]) }
  if (rule._purify) {
    const _purify = rule._purify
    for (const purifyKey in _purify) {
      _purify[purifyKey] = new Set(_purify[purifyKey])
    }
    purify = Object.assign(purify, _purify)
  }
  if (isPlainObject(rule)) {
    for (const key in rule) {
      const parser = rule[key]
      if (isFn(parser) && internalKeys.indexOf(key) === -1) {
        params[key] = parser(params)
      } else if (typeof parser === 'string' && internalKeys.indexOf(key) === -1) {
        // 直接转换属性名称的删除旧属性名
        params[key] = params[parser]
        purify.shouldDelete.add(parser)
      }
    }
  } else if (isFn(rule)) {
    params = rule(params)
  }

  if (purify.shouldDelete) {
    for (const item of purify.shouldDelete) {
      delete params[item]
    }
  }

  // 转换之后的处理
  if (rule._post) {
    params = rule._post(params)
  }

  return params
}

/**
 * 返回一个提供应用上下文的应用实例。应用实例挂载的整个组件树共享同一个上下文
 * @param {class} ApiClass 实例类
 * @param {Object} options 参数
 * @returns {Object} 实例类对象
 */
module.exports = function createApi (ApiClass, options) {
  const apiInstance = new ApiClass(options)
  return new Proxy(apiInstance, {
    get: function (obj, prop) {
      if (typeof obj[prop] === 'function' && prop.indexOf('_') !== 0 && obj._protocols && obj._protocols[prop]) {
        const protocol = obj._protocols[prop]
        return async function (params) {
          params = parseParams(params, protocol.args)
          let result = await obj[prop](params)
          result = parseParams(result, protocol.returnValue)
          return result
        }
      } else {
        return obj[prop]
      }
    }
  })
}
