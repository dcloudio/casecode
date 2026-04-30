exports.chunk = function (arr, num) {
  const list = []
  let current = []

  for (const item of arr) {
    current.push(item);
    if (current.length === num) {
      list.push(current)
      current = []
    }
  }

  if (current.length) list.push(current)

  return list
}

exports.checkIsStaticTemplate = function (data = []) {
  let isStatic = data.length <= 0

  for (const template of data) {
    if (template.type === 'static') {
      isStatic = true
      break
    }
  }

  return isStatic
}

exports.parserDynamicField = function (templateData) {
  return templateData.reduce((res, template) => {
    if (/\{.*?\}/.test(template.value)) {
      const [collection, field] = template.value.replace(/\{|\}/g, '').split('.')
      if (!res[collection]) {
        res[collection] = []
      }
      res[collection].push(field)
    }
    return res
  }, {})
}