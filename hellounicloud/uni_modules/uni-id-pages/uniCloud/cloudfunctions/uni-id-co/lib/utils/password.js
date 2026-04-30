const {
  getType
} = require('../../common/utils')
const crypto = require('crypto')
const createConfig = require('uni-config-center')
const shareConfig = createConfig({
  pluginId: 'uni-id'
})
let customPassword = {}
if (shareConfig.hasFile('custom-password.js')) {
  customPassword = shareConfig.requireFile('custom-password.js') || {}
}

const passwordAlgorithmMap = {
  UNI_ID_HMAC_SHA1: 'hmac-sha1',
  UNI_ID_HMAC_SHA256: 'hmac-sha256',
  UNI_ID_CUSTOM: 'custom'
}

const passwordAlgorithmKeyMap = Object.keys(passwordAlgorithmMap).reduce((res, item) => {
  res[passwordAlgorithmMap[item]] = item
  return res
}, {})

const passwordExtMethod = {
  [passwordAlgorithmMap.UNI_ID_HMAC_SHA1]: {
    verify ({ password }) {
      const { password_secret_version: passwordSecretVersion } = this.userRecord

      const passwordSecret = this._getSecretByVersion({
        version: passwordSecretVersion
      })

      const { passwordHash } = this.encrypt({
        password,
        passwordSecret
      })

      return passwordHash === this.userRecord.password
    },
    encrypt ({ password, passwordSecret }) {
      const { value: secret, version } = passwordSecret
      const hmac = crypto.createHmac('sha1', secret.toString('ascii'))

      hmac.update(password)

      return {
        passwordHash: hmac.digest('hex'),
        version
      }
    }
  },
  [passwordAlgorithmMap.UNI_ID_HMAC_SHA256]: {
    verify ({ password }) {
      const parse = this._parsePassword()
      const passwordHash = crypto.createHmac(parse.algorithm, parse.salt).update(password).digest('hex')

      return passwordHash === parse.hash
    },
    encrypt ({ password, passwordSecret }) {
      const { version } = passwordSecret

      // 默认使用 sha256 加密算法
      const salt = crypto.randomBytes(10).toString('hex')
      const sha256Hash = crypto.createHmac(passwordAlgorithmMap.UNI_ID_HMAC_SHA256.substring(5), salt).update(password).digest('hex')
      const algorithm = passwordAlgorithmKeyMap[passwordAlgorithmMap.UNI_ID_HMAC_SHA256]
      // B 为固定值，对应 PasswordMethodMaps 中的 sha256算法
      // hash 格式 $[PasswordMethodFlagMapsKey]$[salt size]$[salt][Hash]
      const passwordHash = `$${algorithm}$${salt.length}$${salt}${sha256Hash}`

      return {
        passwordHash,
        version
      }
    }
  },
  [passwordAlgorithmMap.UNI_ID_CUSTOM]: {
    verify ({ password, passwordSecret }) {
      if (!customPassword.verifyPassword) throw new Error('verifyPassword method not found in custom password file')

      // return true or false
      return customPassword.verifyPassword({
        password,
        passwordSecret,
        userRecord: this.userRecord,
        clientInfo: this.clientInfo
      })
    },
    encrypt ({ password, passwordSecret }) {
      if (!customPassword.encryptPassword) throw new Error('encryptPassword method not found in custom password file')

      // return object<{passwordHash: string, version: number}>
      return customPassword.encryptPassword({
        password,
        passwordSecret,
        clientInfo: this.clientInfo
      })
    }
  }
}

class PasswordUtils {
  constructor ({
    userRecord = {},
    clientInfo,
    passwordSecret
  } = {}) {
    if (!clientInfo) throw new Error('Invalid clientInfo')
    if (!passwordSecret) throw new Error('Invalid password secret')

    this.clientInfo = clientInfo
    this.userRecord = userRecord
    this.passwordSecret = this.prePasswordSecret(passwordSecret)
  }

  /**
   * passwordSecret 预处理
   * @param passwordSecret
   * @return {*[]}
   */
  prePasswordSecret (passwordSecret) {
    const newPasswordSecret = []
    if (getType(passwordSecret) === 'string') {
      newPasswordSecret.push({
        value: passwordSecret,
        type: passwordAlgorithmMap.UNI_ID_HMAC_SHA1
      })
    } else if (getType(passwordSecret) === 'array') {
      for (const secret of passwordSecret.sort((a, b) => a.version - b.version)) {
        newPasswordSecret.push({
          ...secret,
          // 没有 type 设置默认 type hmac-sha1
          type: secret.type || passwordAlgorithmMap.UNI_ID_HMAC_SHA1
        })
      }
    } else {
      throw new Error('Invalid password secret')
    }

    return newPasswordSecret
  }

  /**
   * 获取最新加密密钥
   * @return {*}
   * @private
   */
  _getLastestSecret () {
    return this.passwordSecret[this.passwordSecret.length - 1]
  }

  _getOldestSecret () {
    return this.passwordSecret[0]
  }

  _getSecretByVersion ({ version } = {}) {
    if (!version && version !== 0) {
      return this._getOldestSecret()
    }
    if (this.passwordSecret.length === 1) {
      return this.passwordSecret[0]
    }
    return this.passwordSecret.find(item => item.version === version)
  }

  /**
   * 获取密码的验证/加密方法
   * @param passwordSecret
   * @return {*[]}
   * @private
   */
  _getPasswordExt (passwordSecret) {
    const ext = passwordExtMethod[passwordSecret.type]
    if (!ext) {
      throw new Error(`暂不支持 ${passwordSecret.type} 类型的加密算法`)
    }

    const passwordExt = Object.create(null)

    for (const key in ext) {
      passwordExt[key] = ext[key].bind(Object.assign(this, Object.keys(ext).reduce((res, item) => {
        if (item !== key) {
          res[item] = ext[item].bind(this)
        }
        return res
      }, {})))
    }

    return passwordExt
  }

  _parsePassword () {
    const [algorithmKey = '', cost = 0, hashStr = ''] = this.userRecord.password.split('$').filter(key => key)
    const algorithm = passwordAlgorithmMap[algorithmKey] ? passwordAlgorithmMap[algorithmKey].substring(5) : null
    const salt = hashStr.substring(0, Number(cost))
    const hash = hashStr.substring(Number(cost))

    return {
      algorithm,
      salt,
      hash
    }
  }

  /**
   * 生成加密后的密码
   * @param {String} password 密码
   */
  generatePasswordHash ({ password }) {
    if (!password) throw new Error('Invalid password')

    const passwordSecret = this._getLastestSecret()
    const ext = this._getPasswordExt(passwordSecret)

    const { passwordHash, version } = ext.encrypt({
      password,
      passwordSecret
    })

    return {
      passwordHash,
      version
    }
  }

  /**
   * 密码校验
   * @param {String} password
   * @param {Boolean} autoRefresh
   * @return {{refreshPasswordInfo: {version: *, passwordHash: *}, success: boolean}|{success: boolean}}
   */
  checkUserPassword ({ password, autoRefresh = true }) {
    if (!password) throw new Error('Invalid password')

    const { password_secret_version: passwordSecretVersion } = this.userRecord
    const passwordSecret = this._getSecretByVersion({
      version: passwordSecretVersion
    })
    const ext = this._getPasswordExt(passwordSecret)

    const success = ext.verify({ password, passwordSecret })

    if (!success) {
      return {
        success: false
      }
    }

    let refreshPasswordInfo
    if (autoRefresh && passwordSecretVersion !== this._getLastestSecret().version) {
      refreshPasswordInfo = this.generatePasswordHash({ password })
    }

    return {
      success: true,
      refreshPasswordInfo
    }
  }
}

module.exports = PasswordUtils
