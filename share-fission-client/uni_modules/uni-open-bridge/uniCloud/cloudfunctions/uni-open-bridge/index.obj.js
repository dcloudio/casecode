'use strict';

const {
  PlatformType
} = require('./consts.js')

const runTask = require('./index.task.js')
const weixinCommand = require('./index.mp-weixin.js')

async function executeCommand() {
  const methodName = this.getMethodName()
  const parameters = JSON.parse(this.getHttpInfo().body)

  if (parameters.platform === PlatformType.MP_WEIXIN) {
    return await weixinCommand.execute(methodName, parameters)
  }

  throw new Error('Invalid Platform')
}

module.exports = {
  async _timing() {
    console.log('triggered by timing')
    await runTask()
  },
  async _before() {
    const clientInfo = this.getClientInfo()
    if (!weixinCommand.checkIP(clientInfo.clientIP)) {
      throw new Error("Invalid IP:" + clientInfo.clientIP)
    }
  },
  // async runTask() {
  //   await runTask()
  // },
  async getAccessToken() {
    return await executeCommand.call(this)
  },
  async setAccessToken() {
    return await executeCommand.call(this)
  },
  async removeAccessToken() {
    return await executeCommand.call(this)
  },
  async getUserKey() {
    return await executeCommand.call(this)
  },
  async setUserKey() {
    return await executeCommand.call(this)
  },
  async removeUserKey() {
    return await executeCommand.call(this)
  },
  async getTicket() {
    return await executeCommand.call(this)
  },
  async setTicket() {
    return await executeCommand.call(this)
  },
  async removeTicket() {
    return await executeCommand.call(this)
  }
}
