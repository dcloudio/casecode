const calcDailyStatistics = require('./calcDailyStatistics');

const serverCrontabs = {
  calcDailyStatistics
}

module.exports = async function runCrontab(event = {}) {
  console.log('event: ', event);
  for (name in serverCrontabs) {
    console.log('triggerName: ', name);
    await serverCrontabs[name].bind(this)({});
  }
}
