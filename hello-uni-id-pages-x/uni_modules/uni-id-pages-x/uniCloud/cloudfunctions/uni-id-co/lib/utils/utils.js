let redisEnable = null
function getRedisEnable() {
  // 未用到的时候不调用redis接口，节省一些连接数
  if (redisEnable !== null) {
    return redisEnable
  }
  try {
    uniCloud.redis()
    redisEnable = true
  } catch (error) {
    redisEnable = false
  }
  return redisEnable
}

module.exports = {
  getRedisEnable
}