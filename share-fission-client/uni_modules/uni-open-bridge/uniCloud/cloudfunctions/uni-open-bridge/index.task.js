'use strict';

const {
  OpenBridgeConfig
} = require('./config.js')

const {
  TaskManager
} = require('./basic.js')

const {
  TaskAccessTokenMP
} = require('./task-mp-weixin.js')

const {
  TaskAccessTokenH5,
  TaskTicket
} = require('./task-h5-weixin.js')

const TaskMapping = {
  'mp-weixin': {
    'accessToken': TaskAccessTokenMP
  },
  'h5-weixin': {
    'accessToken': TaskAccessTokenH5,
    'ticket': TaskTicket
  }
}

class ScheduleManager extends TaskManager {

  constructor() {
    super()
  }

  async runAll() {
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i]

      try {
        await task.run()
      } catch (e) {
        console.log("task.run::", e)
      }
    }
  }

  newTask(T, config) {
    const newTask = new T(config)

    super.addTask(newTask)

    return newTask
  }
}

ScheduleManager.instance = function() {
  if (!ScheduleManager._instance) {
    ScheduleManager._instance = new ScheduleManager()
  }
  return ScheduleManager._instance
}

async function main() {
  const openBridgeConfig = new OpenBridgeConfig()

  ScheduleManager.instance().clear()

  for (let taskConfig of openBridgeConfig.tasks) {
    let {
      platform,
      tasks
    } = taskConfig

    for (let taskName of tasks) {
      const platformTask = TaskMapping[platform]
      if (platformTask) {
        ScheduleManager.instance().newTask(platformTask[taskName], taskConfig)
      }
    }
  }

  await ScheduleManager.instance().runAll()
}

module.exports = main;
