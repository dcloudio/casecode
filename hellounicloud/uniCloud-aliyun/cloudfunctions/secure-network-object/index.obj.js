// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
module.exports = {
  _before: function() { // 通用预处理器
    const methodName = this.getMethodName()
    const clientInfo = this.getClientInfo()
    const secretType = clientInfo.secretType
    // methodName 是客户端调用的方法名
    // secretType 是客户端调用 uniCloud.importObject 传递的参数 secretMethods

    console.log(secretType);

    if (secretType !== 'both' ) {
      throw new Error('secretType invalid') // 拒绝返回有效数据
    }
  },

  /**
   * method1方法描述
   * @param {string} param1 参数1描述
   * @returns {object} 返回值描述
   */
  get(param1) {
    // 参数校验，如无参数则不需要
    if (!param1) {
      return {
        errCode: 'PARAM_IS_NULL',
        errMsg: '参数不能为空'
      }
    }
    // 业务逻辑

    // 返回结果
    return {
      param1 //请根据实际需要返回值
    }
  }
}
