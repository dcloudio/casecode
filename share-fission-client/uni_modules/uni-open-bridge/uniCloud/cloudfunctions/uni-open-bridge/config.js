'use strict';

const {
  PlatformType
} = require('./consts.js')

const configCenter = require('uni-config-center')

const OauthConfig = {
  'mp-weixin': ['oauth', 'weixin'],
  'h5-weixin': ['oauth', 'weixin']
}

class TaskConfig {

  constructor(options) {
    this._dcloudAppid = options.dcloudAppid
    this._appid = options.appid
    this._secret = options.secret
    this._platform = options.platform
    this._tasks = options.tasks
    this._timeout = 1000 * 10
  }

  get dcloudAppid() {
    return this._dcloudAppid
  }

  get appid() {
    return this._appid
  }

  get secret() {
    return this._secret
  }

  get platform() {
    return this._platform
  }

  get tasks() {
    return this._tasks
  }
}

class ConfigBase {

  constructor() {
    const uniIdConfig = configCenter({
      pluginId: 'uni-id'
    })
    const openBridgeConfig = configCenter({
      pluginId: 'uni-open-bridge'
    })

    this._uniId = uniIdConfig.config()
    this._openBridge = openBridgeConfig.config()

    this._ready = true
  }

  getAppConfig(appid) {
    if (Array.isArray(this._uniId)) {
      return this._uniId.find((item) => {
        return (item.dcloudAppid === appid)
      })
    }

    if (this._uniId.dcloudAppid === appid) {
      return this._uniId
    }

    return null
  }

  inWhitelist(ip) {
    return (this.ipWhitelist.indexOf(ip) > -1)
  }

  get openBridge() {
    return this._openBridge
  }

  get ipWhitelist() {
    return this._openBridge.ipWhitelist
  }

  get ready() {
    return this._ready
  }
}

class OpenBridgeConfig extends ConfigBase {

  constructor() {
    super()

    this._tasks = []

    this.resolve()
  }

  get tasks() {
    return this._tasks
  }

  resolve() {
    this._tasks.length = 0

    const appids = Object.keys(this.openBridge.schedule)

    for (let i = 0; i < appids.length; i++) {
      const appid = appids[i]
      let appConfig = this.getAppConfig(appid)

      if (appConfig != null) {
        const schedule = this.openBridge.schedule[appid]
        if (schedule) {
          this.resolveSchedule(appid, appConfig, schedule)
        }
      }
    }
  }

  resolveSchedule(dcloudAppid, appConfig, schedule) {
    if (schedule.enable !== true) {
      return
    }

    const schedulePlatforms = Object.keys(schedule)

    for (let i = 0; i < schedulePlatforms.length; i++) {
      const platformName = schedulePlatforms[i]
      const scheduleTask = schedule[platformName]

      if (!scheduleTask.enable) {
        continue
      }

      if (!this.isSupport(platformName)) {
        continue
      }

      const oauthConfig = this.getOauthConfig(appConfig, platformName)
      if (!oauthConfig) {
        continue
      }

      this._tasks.push({
        platform: platformName,
        tasks: scheduleTask.tasks,
        dcloudAppid: dcloudAppid,
        appid: oauthConfig.appid,
        secret: oauthConfig.secret
      })
    }
  }

  isSupport(platformName) {
    return (OpenBridgeConfig.Support_Platforms.indexOf(platformName) >= 0)
  }

  getOauthConfig(appConfig, platformName) {
    const platformConfig = appConfig[platformName]
    if (!platformConfig) {
      return null
    }

    let tree = OauthConfig[platformName]
    let node = platformConfig
    for (let i = 0; i < tree.length; i++) {
      let nodeName = tree[i]
      if (node[nodeName]) {
        node = node[nodeName]
      } else {
        node = null
        break
      }
    }

    if (node && node.appid && node.appsecret) {
      return {
        appid: node.appid,
        secret: node.appsecret
      }
    }

    return null
  }
}

OpenBridgeConfig.Support_Platforms = ['mp-weixin', 'h5-weixin']


module.exports = {
  OpenBridgeConfig
};
