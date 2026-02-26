const {
  callWxOpenApi,
  buildUrl
} = require('../normalize')

module.exports = class Auth {
  constructor (options) {
    this.options = Object.assign({
      baseUrl: 'https://api.weixin.qq.com',
      timeout: 5000
    }, options)
  }

  async _requestWxOpenapi ({ name, url, data, options }) {
    const defaultOptions = {
      method: 'GET',
      dataType: 'json',
      dataAsQueryString: true,
      timeout: this.options.timeout
    }
    const result = await callWxOpenApi({
      name: `auth.${name}`,
      url: `${this.options.baseUrl}${buildUrl(url, data)}`,
      data,
      options,
      defaultOptions
    })
    return result
  }

  async code2Session (code) {
    const url = '/sns/jscode2session'
    const result = await this._requestWxOpenapi({
      name: 'code2Session',
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

  async getOauthAccessToken (code) {
    const url = '/sns/oauth2/access_token'
    const result = await this._requestWxOpenapi({
      name: 'getOauthAccessToken',
      url,
      data: {
        grant_type: 'authorization_code',
        appid: this.options.appId,
        secret: this.options.secret,
        code
      }
    })
    if (result.expiresIn) {
      result.expired = Date.now() + result.expiresIn * 1000
      // delete result.expiresIn
    }
    return result
  }

  async getUserInfo ({
    accessToken,
    openid
  } = {}) {
    const url = '/sns/userinfo'
    const {
      nickname,
      headimgurl: avatar
    } = await this._requestWxOpenapi({
      name: 'getUserInfo',
      url,
      data: {
        accessToken,
        openid,
        appid: this.options.appId,
        secret: this.options.secret,
        scope: 'snsapi_userinfo'
      }
    })
    return {
      nickname,
      avatar
    }
  }

  async getPhoneNumber (accessToken, code) {
    const url = `/wxa/business/getuserphonenumber?access_token=${accessToken}`
    const { phoneInfo } = await this._requestWxOpenapi({
      name: 'getPhoneNumber',
      url,
      data: {
        code
      },
      options: {
        method: 'POST',
        dataAsQueryString: false,
        headers: {
          'content-type': 'application/json'
        }
      }
    })

    return {
      purePhoneNumber: phoneInfo.purePhoneNumber
    }
  }
}
