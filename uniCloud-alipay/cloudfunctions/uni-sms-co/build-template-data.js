module.exports = (templateData, user) => {

  const data = {}

  for (const template of templateData) {

    // 检查模板是否包含动态值
    const isDynamic = /\{.*?\}/.test(template.value)

    // 仅支持uni-id-users
    if (isDynamic) {
      // 从模板中提取出集合和字段名
      const [collection, field] = template.value.replace(/\{|\}/g, '').split('.')
      // 如果是uni-id-users，提取相应字段的值
      // 否则使用模板值本身
      data[template.field] = collection === 'uni-id-users' ? user[field] || template.value: template.value
    } else {
      // 如果没有动态值，则使用模板值本身
      data[template.field] = template.value
    }
    // 下面是一些注释的代码
    // switch (template.type) {
    //   case 'static':
    //     // 对于静态值，直接使用模板值本身
    //     data[template.field] = template.value
    //   break
    //   case 'dynamic':
    //     // 对于动态值，使用用户对象中的相应字段
    //     data[template.field] = user[template.value] || ''
    //   break
    //   default:
    //     // 抛出不支持的模板类型错误
    //     throw new Error(`template type [${template.type}] not supported`)
    // }
  }

  return data
}
