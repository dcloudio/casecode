const rsaPublicKeyPem = require('../rsa-public-key-pem')
const {
  jwtVerify
} = require('../../../npm/index')
let authKeysCache = null

module.exports = class Auth {
  constructor (options) {
    this.options = Object.assign({
      baseUrl: 'https://appleid.apple.com',
      timeout: 10000
    }, options)
  }

  async _fetch (url, options) {
    const { baseUrl } = this.options
    return uniCloud.httpclient.request(baseUrl + url, options)
  }

  async verifyIdentityToken (identityToken) {
    // 解密出kid，拿取key
    const jwtHeader = identityToken.split('.')[0]
    const { kid } = JSON.parse(Buffer.from(jwtHeader, 'base64').toString())
    let authKeys
    if (authKeysCache) {
      authKeys = authKeysCache
    } else {
      authKeys = await this.getAuthKeys()
      authKeysCache = authKeys
    }
    const usedKey = authKeys.find(item => item.kid === kid)

    /**
     * identityToken 格式
     *
     * {
     *   iss: 'https://appleid.apple.com',
     *   aud: 'io.dcloud.hellouniapp',
     *   exp: 1610626724,
     *   iat: 1610540324,
     *   sub: '000628.30119d332d9b45a3be4a297f9391fd5c.0403',
     *   c_hash: 'oFfgewoG36cJX00KUbj45A',
     *   email: 'x2awmap99s@privaterelay.appleid.com',
     *   email_verified: 'true',
     *   is_private_email: 'true',
     *   auth_time: 1610540324,
     *   nonce_supported: true
     * }
     */
    const payload = jwtVerify(
      identityToken,
      rsaPublicKeyPem(usedKey.n, usedKey.e),
      {
        algorithms: usedKey.alg
      }
    )

    if (payload.iss !== 'https://appleid.apple.com' || payload.aud !== this.options.bundleId) {
      throw new Error('Invalid identity token')
    }

    return {
      openid: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === 'true',
      isPrivateEmail: payload.is_private_email === 'true'
    }
  }

  async getAuthKeys () {
    const { status, data } = await this._fetch('/auth/keys', {
      method: 'GET',
      dataType: 'json',
      timeout: this.options.timeout
    })
    if (status !== 200) throw new Error('request https://appleid.apple.com/auth/keys fail')
    return data.keys
  }
}
