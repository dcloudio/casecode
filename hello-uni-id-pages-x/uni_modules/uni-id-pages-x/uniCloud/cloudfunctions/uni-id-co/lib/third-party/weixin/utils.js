const crypto = require('crypto')
const {
  isPlainObject
} = require('../../../common/utils')

// 退款通知解密key=md5(key)
function decryptData (encryptedData, key, iv = '') {
  // 解密
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
  // 设置自动 padding 为 true，删除填充补位
  decipher.setAutoPadding(true)
  let decoded = decipher.update(encryptedData, 'base64', 'utf8')
  decoded += decipher.final('utf8')
  return decoded
}

function md5 (str, encoding = 'utf8') {
  return crypto
    .createHash('md5')
    .update(str, encoding)
    .digest('hex')
}

function sha256 (str, key, encoding = 'utf8') {
  return crypto
    .createHmac('sha256', key)
    .update(str, encoding)
    .digest('hex')
}

function getSignStr (obj) {
  return Object.keys(obj)
    .filter(key => key !== 'sign' && obj[key] !== undefined && obj[key] !== '')
    .sort()
    .map(key => key + '=' + obj[key])
    .join('&')
}

function getNonceStr (length = 16) {
  let str = ''
  while (str.length < length) {
    str += Math.random().toString(32).substring(2)
  }
  return str.substring(0, length)
}

// 简易版Object转XML，只可在微信支付时使用，不支持嵌套
function buildXML (obj, rootName = 'xml') {
  const content = Object.keys(obj).map(item => {
    if (isPlainObject(obj[item])) {
      return `<${item}><![CDATA[${JSON.stringify(obj[item])}]]></${item}>`
    } else {
      return `<${item}><![CDATA[${obj[item]}]]></${item}>`
    }
  })
  return `<${rootName}>${content.join('')}</${rootName}>`
}

function isXML (str) {
  const reg = /^(<\?xml.*\?>)?(\r?\n)*<xml>(.|\r?\n)*<\/xml>$/i
  return reg.test(str.trim())
};

// 简易版XML转Object，只可在微信支付时使用，不支持嵌套
function parseXML (xml) {
  const xmlReg = /<(?:xml|root).*?>([\s|\S]*)<\/(?:xml|root)>/
  const str = xmlReg.exec(xml)[1]
  const obj = {}
  const nodeReg = /<(.*?)>(?:<!\[CDATA\[){0,1}(.*?)(?:\]\]>){0,1}<\/.*?>/g
  let matches = null
  // eslint-disable-next-line no-cond-assign
  while ((matches = nodeReg.exec(str))) {
    obj[matches[1]] = matches[2]
  }
  return obj
}

module.exports = {
  decryptData,
  md5,
  sha256,
  getSignStr,
  getNonceStr,
  buildXML,
  parseXML,
  isXML
}
