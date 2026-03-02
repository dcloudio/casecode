const presetCondition = {
  // 预设条件：全部
  all: {},
  // 预设条件：7天未登录用户
  '7-day-offline-users': () => ({
    last_login_date: {
      type: 'lt',
      value: Date.now() - (7 * 24 * 60 * 60 * 1000)
    }
  }),
  // 预设条件：15天未登录用户
  '15-day-offline-users': () => ({
    last_login_date: {
      type: 'lt',
      value: Date.now() - (15 * 24 * 60 * 60 * 1000)
    }
  }),
  // 预设条件：30天未登录用户
  '30-day-offline-users': () => ({
    last_login_date: {
      type: 'lt',
      value: Date.now() - (30 * 24 * 60 * 60 * 1000)
    }
  })
};

function conditionConvert(condition, command) {
  const newCondition = {};

  for (const key in condition) {
    const field = condition[key];

    switch (field.type) {
      case 'search':
        // 搜索条件
        newCondition[key] = new RegExp(field.value);
        break;
      case 'select':
        // 选择条件
        if (field.value.length) {
          newCondition[key] = command.or(
            field.value.map(value => command.eq(value))
          );
        }
        break;
      case 'range':
        // 范围条件
        if (field.value.length) {
          const [gt, lt] = field.value;
          newCondition[key] = command.and([
            command.gte(gt),
            command.lte(lt)
          ]);
        }
        break;
      case 'date':
        // 日期条件
        if (field.value.length) {
          const [startTimestamp, endTimestamp] = field.value;
          const startDate = new Date(startTimestamp);
          const endDate = new Date(endTimestamp);

          newCondition[key] = command.and([
            command.gte(startDate),
            command.lte(endDate)
          ]);
        }
        break;
      case 'timestamp':
        // 时间戳条件
        if (field.value.length) {
          const [startDate, endDate] = field.value;

          newCondition[key] = command.and([
            command.gte(startDate),
            command.lte(endDate)
          ]);
        }
        break;
      case 'lt':
        // 小于条件
        newCondition[key] = command.lt(field.value);
        break;
    }
  }

  return newCondition;
}

module.exports.presetCondition = presetCondition;
module.exports.conditionConvert = conditionConvert;
