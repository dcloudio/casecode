const querystring = require('querystring')
const {callHuaweiOpenApi} = require('../normalize')

const API_ENDPOINT = 'https://oauth-login.cloud.huawei.com'
const ACCOUNT_API_ENDPOINT = 'https://account.cloud.huawei.com'
const OAUTH_API_ENDPOINT = 'https://oauth-api.cloud.huawei.com'

class HuaweiAccount {
  constructor(options) {
    this.options = options
  }

  async _request({url, data, method = "GET", headers = {}, name = ""}) {
    const options = Object.assign({}, {
      dataType: 'json',
      timeout: 300000
    }, {
      method,
      headers
    })

    return callHuaweiOpenApi({
      name,
      url,
      data,
      options
    })
  }

  async getUserAccessToken(code) {
    return this._request(
      {
        name: "getUserAccessToken",
        url: `${API_ENDPOINT}/oauth2/v3/token`,
        data: {
          grantType: "authorization_code",
          clientId: this.options.clientId,
          clientSecret: this.options.clientSecret,
          code
        },
        method: "POST"
      }
    )
  }

  async getAccessTokenInfo(accessToken) {
    return this._request({
      url: `${OAUTH_API_ENDPOINT}/rest.php?nsp_fmt=JSON&nsp_svc=huawei.oauth2.user.getTokenInfo`,
      data: {
        accessToken,
        openId: "OPENID"
      },
      method: "POST"
    })
  }

  async getUserInfo (accessToken) {
    return this._request({
      url: `${ACCOUNT_API_ENDPOINT}/rest.php?nsp_svc=GOpen.User.getInfo`,
      data: {
        accessToken,
        getNickName: "1"
      },
      method: "POST"
    })
  }
}

module.exports = HuaweiAccount
