'use strict';

exports.main = async (event, context) => {
  //event为客户端上传的参数
  console.log('event : ', event)

  const secretType = context.secretType
  // secretType 是客户端调用 uniCloud.callFunction 传递的参数 secretType

  if (secretType !== 'both') {
    throw new Error('secretType invalid') // 拒绝返回有效数据
  }

  //返回数据给客户端
  return event
};
