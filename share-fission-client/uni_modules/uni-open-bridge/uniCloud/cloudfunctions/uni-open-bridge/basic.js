'use strict';

class Command {

  constructor() {
    this._registered = {}
  }

  async execute(name, args) {
    if (this._registered[name]) {
      return await this._registered[name].execute(args)
    }
  }

  canExecute(name, args) {
    if (this._registered[name] && this._registered[name].canExecute) {
      this._registered[name].canExecute(args)
    }
    return false
  }

  register(name, execute, canExecute) {
    this._registered[name] = {
      execute,
      canExecute
    }
  }
}

class Task {

  constructor(id) {
    this._id = id || this._newTaskId()

    this._state = Task.TASK_STATE.WAITING
  }

  async run() {}

  async cancel() {}

  async taskAction() {}

  _newTaskId() {
    let guid = ''
    const format = 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'
    for (let i = 0; i < format.length; i++) {
      if (format[i] === 'x') {
        guid += (Math.random() * 16 | 0).toString(16)
      } else {
        guid += format[i]
      }
    }
    return guid.toUpperCase()
  }

  get id() {
    return this._id
  }
  set id(value) {
    this._id = value
  }

  get state() {
    return this._state
  }
  set state(value) {
    this._state = value
  }
}

Task.TASK_STATE = {
  WAITING: "WAITING",
  RESOLVING: "RESOLVING",
  RESOLVED: "RESOLVED",
  EXECUTING: "EXECUTING",
  ERROR: "ERROR",
  COMPLETED: "COMPLETED",
  CANCELLING: "CANCELLING",
  CANCELLED: "CANCELLED"
}

class TaskManager {

  constructor() {
    this._tasks = []
  }

  get tasks() {
    return this._tasks
  }

  clear() {
    this._tasks.length = 0
  }

  getTask(id) {
    return this._tasks.find((item) => {
      return (item.id == id)
    })
  }

  addTask(task) {
    this._tasks.push(task)
  }

  deleteTask(id) {
    const index = this.findIndex(id)
    if (index < 0) {
      return
    }

    this._tasks[index].cancel()

    if (index > -1) {
      this._tasks.splice(index, 1)
    }
  }

  findIndex(id) {
    return this._tasks.findIndex((item) => {
      return (item.id == id)
    })
  }
}

module.exports = {
  Command,
  Task,
  TaskManager
};
