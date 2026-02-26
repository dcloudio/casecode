const { ERROR } = require('./error')

function getHttpClientInfo () {
  const requestId = this.getUniCloudRequestId()
  const { clientIP, userAgent, source, secretType = 'none' } = this.getClientInfo()
  const { clientInfo = {} } = JSON.parse(this.getHttpInfo().body)

  return {
    ...clientInfo,
    clientIP,
    userAgent,
    source,
    secretType,
    requestId
  }
}

function getHttpUniIdToken () {
  const { uniIdToken = '' } = JSON.parse(this.getHttpInfo().body)

  return uniIdToken
}

function verifyHttpMethod () {
  const { headers, httpMethod } = this.getHttpInfo()

  if (!/^application\/json/.test(headers['content-type']) || httpMethod.toUpperCase() !== 'POST') {
    throw {
      errCode: ERROR.UNSUPPORTED_REQUEST,
      errMsg: 'unsupported request'
    }
  }
}

function universal () {
  if (this.getClientInfo().source === 'http') {
    verifyHttpMethod.call(this)
    this.getParams()[0] = JSON.parse(this.getHttpInfo().body).params
    this.getUniversalClientInfo = getHttpClientInfo.bind(this)
    this.getUniversalUniIdToken = getHttpUniIdToken.bind(this)
  } else {
    this.getUniversalClientInfo = this.getClientInfo
    this.getUniversalUniIdToken = this.getUniIdToken
  }
}

module.exports = universal
