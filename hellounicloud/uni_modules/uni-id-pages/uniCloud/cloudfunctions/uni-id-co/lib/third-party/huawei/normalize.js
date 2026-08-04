const {
  UniCloudError
} = require('../../../common/error')
const {
  camel2snakeJson,
  snake2camelJson
} = require('../../../common/utils')

function generateApiResult (apiName, data) {
  if (data.error) {
    throw new UniCloudError({
      code: -2,
      message: data.error || data.error_description || `${apiName} fail`
    })
  } else {
    delete data.error
    delete data.error_description
    delete data.sub_error
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

async function callHuaweiOpenApi ({
  name,
  url,
  data,
  options,
}) {
  options = Object.assign({}, options, { data: camel2snakeJson(Object.assign({}, data)) })
  let result
  try {
    result = await uniCloud.httpclient.request(url, options)
  } catch (e) {
    return nomalizeError(name, e)
  }

  const respData = result.data

  if (result.status !== 200) {
    return nomalizeError(name, new UniCloudError({
      code: respData.error,
      message: respData.error_description || 'Request failed'
    }))
  }

  return snake2camelJson(
    generateApiResult(
      name,
      respData || {
        errCode: -2,
        errMsg: 'Request failed'
      }
    )
  )
}

module.exports = {
  callHuaweiOpenApi
}
