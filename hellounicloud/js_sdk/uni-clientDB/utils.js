export const SYMBOL_CLIENT_DB_INTERNAL = Symbol('CLIENT_DB_INTERNAL')

export function getType (val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase()
}

// handler内先只实现get
export function getSafeProxy (target, handler) {
  target.then = 'DoNotReturnProxyWithAFunctionNamedThen'
  target._internalType = SYMBOL_CLIENT_DB_INTERNAL
  return new Proxy(target, {
    get (obj, key, rec) {
      if (hasOwn(obj, key) || obj[key] || typeof key !== 'string') {
        return obj[key]
      }
      return handler.get(obj, key, rec)
    }
  })
}

export function hasOwn (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export class ErrorWithCode extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
  }
}
