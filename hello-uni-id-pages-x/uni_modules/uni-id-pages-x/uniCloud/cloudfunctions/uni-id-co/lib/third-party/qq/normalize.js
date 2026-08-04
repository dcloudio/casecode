const {
  UniCloudError
} = require('../../../common/error')
const {
  camel2snakeJson,
  snake2camelJson
} = require('../../../common/utils')

function generateApiResult (apiName, data) {
  if (data.ret || data.error) {
    // 这三种都是qq的错误码规范
    const code = data.ret || data.error || data.errcode || -2
    const message = data.msg || data.error_description || data.errmsg || `${apiName} fail`
    throw new UniCloudError({
      code,
      message
    })
  } else {
    delete data.ret
    delete data.msg
    delete data.error
    delete data.error_description
    delete data.errcode
    delete data.errmsg
    return {
      ...data,
      errMsg: `${apiName} ok`,
      errCode: 0
    }
  }
}

function nomalizeError (apiName, error) {
  throw new UniCloudError({
    code: error.code || -2,
    message: error.message || `${apiName} fail`
  })
}

async function callQQOpenApi ({
  name,
  url,
  data,
  options,
  defaultOptions
}) {
  options = Object.assign({}, defaultOptions, options, { data: camel2snakeJson(Object.assign({}, data)) })
  let result
  try {
    result = await uniCloud.httpclient.request(url, options)
  } catch (e) {
    return nomalizeError(name, e)
  }
  let resData = result.data
  const contentType = result.headers['content-type']
  if (
    Buffer.isBuffer(resData) &&
    (contentType.indexOf('text/plain') === 0 ||
      contentType.indexOf('application/json') === 0)
  ) {
    try {
      resData = JSON.parse(resData.toString())
    } catch (e) {
      resData = resData.toString()
    }
  } else if (Buffer.isBuffer(resData)) {
    resData = {
      buffer: resData,
      contentType
    }
  }
  return snake2camelJson(
    generateApiResult(
      name,
      resData || {
        errCode: -2,
        errMsg: 'Request failed'
      }
    )
  )
}

module.exports = {
  callQQOpenApi
}
