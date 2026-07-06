export function initTestInterceptor(originalTestInterceptor) { // initTest为约定名称，init + capitalize(要拦截的方法名)
  return (str) => {
    return '#' + originalTestInterceptor('_' + str)
  }
}