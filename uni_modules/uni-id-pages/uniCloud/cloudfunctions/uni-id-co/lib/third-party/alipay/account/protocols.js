module.exports = {
  code2Session: {
    // args (fromArgs) {
    //   return fromArgs
    // },
    returnValue: (values) => {
      return Object.assign(values, { openid: values.userId || values.openId })
    }
  }
}
