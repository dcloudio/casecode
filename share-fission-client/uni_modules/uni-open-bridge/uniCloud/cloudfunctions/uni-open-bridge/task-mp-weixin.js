'use strict';

const {
  getAccessToken,
  setAccessToken,
  removeAccessToken
} = require('uni-open-bridge-common')

const {
  Task
} = require('./basic.js')

const {
  PlatformType
} = require('./consts.js')

class TaskAccessTokenMP extends Task {

  constructor(config) {
    super()

    this._config = config || null
  }

  async run() {
    const key = {
      dcloudAppid: this._config.dcloudAppid,
      platform: PlatformType.MP_WEIXIN
    }

    const result = await getAccessToken(key)

    console.log("setAccessToken...", key, result)
  }
}

TaskAccessTokenMP.ID = 'TaskAccessTokenMP'

module.exports = {
  TaskAccessTokenMP
}
