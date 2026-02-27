import parser from './parser.js'
import {
  getSafeProxy,
  ErrorWithCode
} from './utils'
const authCallBacks = {}
const dbCallBacks = {}

class Stage {
  constructor (content, prevStage, actionName) {
    this.content = content
    this.prevStage = prevStage
    this.actionName = actionName
  }

  toJSON () {
    let tempStage = this
    const stages = [tempStage.content]
    while (tempStage.prevStage) {
      tempStage = tempStage.prevStage
      stages.push(tempStage.content)
    }
    return {
      $db: stages.reverse().map((item) => {
        return {
          $method: item.$method,
          $param: item.$param
        }
      })
    }
  }

  get useAggregate () {
    let tempStage = this
    let useAggregate = false
    while (tempStage.prevStage) {
      tempStage = tempStage.prevStage
      const methodName = tempStage.content.$method
      if (methodName === 'aggregate' || methodName === 'pipeline') {
        useAggregate = true
        break
      }
    }
    return useAggregate
  }

  // 聚合count特殊处理
  get count () {
    if (!this.useAggregate) {
      return function () {
        return this._send('count', Array.from(arguments))
      }
    }
    const that = this
    return function () {
      return getDbIns({
        $method: 'count',
        $param: parser(Array.from(arguments))
      }, that, that.actionName)
    }
  }

  get () {
    return this._send('get', Array.from(arguments))
  }

  add () {
    return this._send('add', Array.from(arguments))
  }

  remove () {
    return this._send('remove', Array.from(arguments))
  }

  update () {
    return this._send('update', Array.from(arguments))
  }

  end () {
    return this._send('end', Array.from(arguments))
  }

  set () {
    throw new Error('客户端禁止使用set方法')
  }

  _send (method, param) {
    const command = this.toJSON()
    command.$db.push({
      $method: method,
      $param: param
    })
    return uniCloud.callFunction({
      name: 'uni-clientDB',
      data: {
        action: this.actionName,
        command
      }
    }).then(res => {
      const {
        code,
        message,
        token,
        tokenExpired
      } = res.result
      if (code) {
        return Promise.reject(new ErrorWithCode(message, code))
      }
      // 保持旧版兼容authCallBacks
      if (token && tokenExpired && authCallBacks.refreshToken) {
        authCallBacks.refreshToken.forEach(func => {
          func({
            token,
            tokenExpired
          })
        })
      }
      // 新版支持dbCallBacks
      if (token && tokenExpired && dbCallBacks.refreshToken) {
        dbCallBacks.refreshToken.forEach(func => {
          func({
            token,
            tokenExpired
          })
        })
      }
      return Promise.resolve(res)
    }).catch(err => {
      const error = new ErrorWithCode(err.message, err.code || 'SYSTEM_ERROR')
      if (dbCallBacks.error) {
        dbCallBacks.error.forEach(func => {
          func(error)
        })
      }
      if (/fc_function_not_found|FUNCTION_NOT_FOUND/g.test(err.message)) {
        console.warn('clientDB未初始化，请在web控制台保存一次schema以开启clientDB')
      }
      return Promise.reject(err)
    })
  }
}

const propList = ['db.Geo', 'db.command', 'command.aggregate']

function isProp (prev, key) {
  return propList.indexOf(`${prev}.${key}`) > -1
}

function getDbIns (content, prevStage, actionName) {
  const stage = new Stage(content, prevStage, actionName)
  return getSafeProxy(stage, {
    get (stage, key) {
      let prevMethod = 'db'
      if (stage && stage.content) {
        prevMethod = stage.content.$method
      }
      if (isProp(prevMethod, key)) {
        return getDbIns({
          $method: key
        }, stage, actionName)
      }
      return function () {
        return getDbIns({
          $method: key,
          $param: parser(Array.from(arguments))
        }, stage, actionName)
      }
    }
  })
}

function getDbClass ({
  path,
  method
}) {
  return class {
    constructor () {
      this.param = Array.from(arguments)
    }

    toJSON () {
      return {
        $newDb: [
          ...path.map(prop => { return { $method: prop } }),
          {
            $method: method,
            $param: this.param
          }]
      }
    }
  }
}

const db = {
  auth: {
    on: (event, func) => {
      authCallBacks[event] = authCallBacks[event] || []
      if (authCallBacks[event].indexOf(func) > -1) {
        return
      }
      authCallBacks[event].push(func)
    },
    off: (event, func) => {
      authCallBacks[event] = authCallBacks[event] || []
      const index = authCallBacks[event].indexOf(func)
      if (index === -1) {
        return
      }
      authCallBacks[event].splice(index, 1)
    }
  },
  on: (event, func) => {
    dbCallBacks[event] = dbCallBacks[event] || []
    if (dbCallBacks[event].indexOf(func) > -1) {
      return
    }
    dbCallBacks[event].push(func)
  },
  off: (event, func) => {
    dbCallBacks[event] = dbCallBacks[event] || []
    const index = dbCallBacks[event].indexOf(func)
    if (index === -1) {
      return
    }
    dbCallBacks[event].splice(index, 1)
  },
  env: getSafeProxy({}, {
    get (env, prop) {
      return {
        $env: prop
      }
    }
  }),
  action (actionName) {
    return getSafeProxy({}, {
      get (db, key) {
        if (isProp('db', key)) {
          return getDbIns({
            $method: key
          }, null, actionName)
        }
        return function () {
          return getDbIns({
            $method: key,
            $param: parser(Array.from(arguments))
          }, null, actionName)
        }
      }
    })
  },
  Geo: getSafeProxy({}, {
    get (Geo, key) {
      return getDbClass({
        path: ['Geo'],
        method: key
      })
    }
  }),
  get serverDate () {
    return getDbClass({
      path: [],
      method: 'serverDate'
    })
  },
  get RegExp () {
    return getDbClass({
      path: [],
      method: 'RegExp'
    })
  }
}

const database = getSafeProxy(db, {
  get (db, key) {
    if (isProp('db', key)) {
      return getDbIns({
        $method: key
      })
    }
    return function () {
      return getDbIns({
        $method: key,
        $param: parser(Array.from(arguments))
      })
    }
  }
})

export default database
