const { ErrorCodes } = require('../constants')

/**
 * 替换消息中的占位符
 * @param {string} template - 消息模板，如 '{name}参数格式错误'
 * @param {Object} vars - 变量对象，如 { name: 'nickname' }
 * @returns {string} 替换后的消息
 */
function replaceVars(template, vars) {
  if (!vars || typeof vars !== 'object') return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars.hasOwnProperty(key) ? vars[key] : ''
  })
}

/**
 * 生成成功响应
 * @param {Object} [data={}] - 返回的数据
 * @returns {Object} 成功响应对象
 *
 * @example
 * // 返回数据
 * success({ list: [], total: 0 })
 * // 输出: { errCode: 0, list: [], total: 0 }
 *
 * // 无数据
 * success()
 * // 输出: { errCode: 0 }
 */
function success(data = {}) {
  if (typeof data === "object") {
    data.errCode = 0;
  }
  return data;
}

/**
 * 生成失败响应
 * @param {number} errCode - 错误码
 * @param {string|Object} [msgOrVars] - 错误消息字符串 或 变量对象
 * @returns {Object} 错误响应对象
 *
 * @example
 * // 使用变量替换
 * fail(400002, { name: 'nickname' })
 * // 输出: { errCode: 400002, errMsg: 'nickname参数格式错误' }
 *
 * // 自定义消息
 * fail(400002, '手机号格式不正确')
 * // 输出: { errCode: 400002, errMsg: '手机号格式不正确' }
 *
 * // 使用默认消息
 * fail(404001)
 * // 输出: { errCode: 404001, errMsg: '用户不存在' }
 */
function fail(errCode, msgOrVars) {
  const template = ErrorCodes[errCode] || ''
  let finalMsg = template

  if (typeof msgOrVars === 'string') {
    // 自定义消息字符串
    finalMsg = msgOrVars
  } else if (typeof msgOrVars === 'object') {
    // 变量替换
    finalMsg = replaceVars(template, msgOrVars)
  }

  return {
    errCode,
    errMsg: finalMsg
  }
}

module.exports = {
  success,
  fail
}
