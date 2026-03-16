const {
  UniCloudError
} = require('../../../common/error')
const {
  camel2snakeJson, snake2camelJson
} = require('../../../common/utils')

function generateApiResult (apiName, data) {
  if (data.errcode) {
    throw new UniCloudError({
      code: data.errcode || -2,
      message: data.errmsg || `${apiName} fail`
    })
  } else {
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

// 微信openapi接口接收蛇形（snake case）参数返回蛇形参数，这里进行转化，如果是formdata里面的参数需要在对应api实现时就转为蛇形
async function callWxOpenApi ({
  name,
  url,
  data,
  options,
  defaultOptions
}) {
  let result = {}
  // 获取二维码的接口wxacode.get和wxacode.getUnlimited不可以传入access_token（可能有其他接口也不可以），否则会返回data format error
  const dataCopy = camel2snakeJson(Object.assign({}, data))
  if (dataCopy && dataCopy.access_token) {
    delete dataCopy.access_token
  }
  try {
    options = Object.assign({}, defaultOptions, options, { data: dataCopy })
    result = await uniCloud.httpclient.request(url, options)
  } catch (e) {
    return nomalizeError(name, e)
  }

  // 有几个接口成功返回buffer失败返回json，对这些接口统一成返回buffer，然后分别解析
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

function buildUrl (url, data) {
  let query = ''
  if (data && data.accessToken) {
    const divider = url.indexOf('?') > -1 ? '&' : '?'
    query = `${divider}access_token=${data.accessToken}`
  }
  return `${url}${query}`
}

module.exports = {
  callWxOpenApi,
  buildUrl
}
