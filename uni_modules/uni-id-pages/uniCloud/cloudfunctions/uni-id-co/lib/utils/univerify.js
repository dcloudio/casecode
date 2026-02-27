async function getPhoneNumber ({
  // eslint-disable-next-line camelcase
  access_token,
  openid
} = {}) {
  const requiredParams = []
  const univerifyConfig = (this.config.service && this.config.service.univerify) || {}
  for (let i = 0; i < requiredParams.length; i++) {
    const key = requiredParams[i]
    if (!univerifyConfig[key]) {
      throw new Error(`Missing config param: service.univerify.${key}`)
    }
  }
  return uniCloud.getPhoneNumber({
    provider: 'univerify',
    appid: this.getUniversalClientInfo().appId,
    apiKey: univerifyConfig.apiKey,
    apiSecret: univerifyConfig.apiSecret,
    // eslint-disable-next-line camelcase
    access_token,
    openid
  })
}

module.exports = {
  getPhoneNumber
}
