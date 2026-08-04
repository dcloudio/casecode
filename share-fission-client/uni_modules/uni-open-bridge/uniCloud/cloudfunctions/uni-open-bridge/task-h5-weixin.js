'use strict';

const {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getTicket,
  setTicket,
  removeTicket
} = require('uni-open-bridge-common')

const {
  Task
} = require('./basic.js')

const {
  PlatformType
} = require('./consts.js')

class TaskAccessTokenH5 extends Task {

  constructor(config) {
    super()

    this._config = config || null
  }

  async run() {
    const key = {
      dcloudAppid: this._config.dcloudAppid,
      platform: PlatformType.H5_WEIXIN
    }

    const result = await getAccessToken(key)

    console.log("setAccessToken...", key, result)
  }
}

TaskAccessTokenH5.ID = 'TaskAccessTokenH5'

class TaskTicket extends Task {

  constructor(config) {
    super()

    this._config = config || null
  }

  async run() {
    const key = {
      dcloudAppid: this._config.dcloudAppid,
      platform: PlatformType.H5_WEIXIN
    }

    const result = await getTicket(key)

    console.log("setTicket...", key, result)
  }
}

TaskTicket.ID = 'TaskTicket'

module.exports = {
  TaskAccessTokenH5,
  TaskTicket
}
