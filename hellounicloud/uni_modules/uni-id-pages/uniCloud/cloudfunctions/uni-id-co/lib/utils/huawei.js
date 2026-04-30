function getHuaweiPlatform () {
  const platform = this.clientPlatform
  switch (platform) {
    case 'app':
    case 'app-harmony':
      return 'app-harmony'
    case 'mp-harmony':
      return 'mp-harmony'
    default:
      throw new Error('Unsupported weixin platform')
  }
}

module.exports = {
  getHuaweiPlatform
}
