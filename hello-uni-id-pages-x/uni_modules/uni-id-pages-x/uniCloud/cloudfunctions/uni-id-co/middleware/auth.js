module.exports = async function () {
  if (this.authInfo) { // 多次执行auth时如果第一次成功后续不再执行
    return
  }
  const token = this.getUniversalUniIdToken()
  const payload = await this.uniIdCommon.checkToken(token)
  if (payload.errCode) {
    throw payload
  }
  this.authInfo = payload
  if (payload.token) {
    this.response.newToken = {
      token: payload.token,
      tokenExpired: payload.tokenExpired
    }
  }
}
