const {
  UniCloudError
} = require('../../../../common/error')
const {
  resolveUrl
} = require('../../../../common/utils')
const {
  callQQOpenApi
} = require('../normalize')

module.exports = class Auth {
  constructor (options) {
    this.options = Object.assign({
      baseUrl: 'https://graph.qq.com',
      timeout: 5000
    }, options)
  }

  async _requestQQOpenapi ({ name, url, data, options }) {
    const defaultOptions = {
      method: 'GET',
      dataType: 'json',
      dataAsQueryString: true,
      timeout: this.options.timeout
    }
    const result = await callQQOpenApi({
      name: `auth.${name}`,
      url: resolveUrl(this.options.baseUrl, url),
      data,
      options,
      defaultOptions
    })
    return result
  }

  async getUserInfo ({
    accessToken,
    openid
  } = {}) {
    const url = '/user/get_user_info'
    const result = await this._requestQQOpenapi({
      name: 'getUserInfo',
      url,
      data: {
        oauthConsumerKey: this.options.appId,
        accessToken,
        openid
      }
    })
    return {
      nickname: result.nickname,
      avatar: result.figureurl_qq_1
    }
  }

  async getOpenidByToken ({
    accessToken
  } = {}) {
    const url = '/oauth2.0/me'
    const result = await this._requestQQOpenapi({
      name: 'getOpenidByToken',
      url,
      data: {
        accessToken,
        unionid: 1,
        fmt: 'json'
      }
    })
    if (result.clientId !== this.options.appId) {
      throw new UniCloudError({
        code: 'APPID_NOT_MATCH',
        message: 'appid not match'
      })
    }
    return {
      openid: result.openid,
      unionid: result.unionid
    }
  }

  async code2Session ({
    code
  } = {}) {
    const url = 'https://api.q.qq.com/sns/jscode2session'
    const result = await this._requestQQOpenapi({
      name: 'getOpenidByToken',
      url,
      data: {
        grant_type: 'authorization_code',
        appid: this.options.appId,
        secret: this.options.secret,
        js_code: code
      }
    })
    return result
  }
}
