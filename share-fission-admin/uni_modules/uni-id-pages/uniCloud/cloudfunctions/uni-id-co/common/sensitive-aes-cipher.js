const crypto = require('crypto')
const { ERROR } = require('./error')

function checkSecret (secret) {
  if (!secret) {
    throw {
      errCode: ERROR.CONFIG_FIELD_REQUIRED,
      errMsgValue: {
        field: 'sensitiveInfoEncryptSecret'
      }
    }
  }

  if (secret.length !== 32) {
    throw {
      errCode: ERROR.CONFIG_FIELD_INVALID,
      errMsgValue: {
        field: 'sensitiveInfoEncryptSecret'
      }
    }
  }
}
function encryptData (text = '') {
  const encryptSecret = this.config.sensitiveInfoEncryptSecret

  if (!text || !encryptSecret) return text

  checkSecret(encryptSecret)

  const iv = encryptSecret.slice(-16)

  const cipher = crypto.createCipheriv('aes-256-cbc', encryptSecret, iv)

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(text, 'utf-8')),
    cipher.final()
  ])

  return encrypted.toString('base64')
}

function decryptData (text = '') {
  const encryptSecret = this.config.sensitiveInfoEncryptSecret

  if (!text || !encryptSecret) return text

  checkSecret(encryptSecret)

  const iv = encryptSecret.slice(-16)

  const cipher = crypto.createDecipheriv('aes-256-cbc', encryptSecret, iv)

  const decrypted = Buffer.concat([
    cipher.update(Buffer.from(text, 'base64')),
    cipher.final()
  ])

  return decrypted.toString('utf-8')
}

module.exports = {
  encryptData,
  decryptData
}
