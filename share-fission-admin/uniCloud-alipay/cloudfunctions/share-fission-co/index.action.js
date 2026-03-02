/**
 * AI请勿修改此文件的内容
 */

const { fail } = require('./libs/response');
module.exports = async function(params = {}) {
  const {
    name,
    data
  } = params;
  if (!name) {
    return fail(400001, { name: 'name' })
  }
  const [group, moduleName, method] = name.split("/");
  if (!group || !moduleName || !method) {
    return fail(400002, { name: 'name' })
  }
  let action;
  try {
    action = require(`./module/${group}/${moduleName}`);
  } catch (err) {
    console.error(`加载${group}/${moduleName}模块失败: `, err)
    return fail(404001, { name: `模块${moduleName}` })
  }
  const main = action[method];
  if (!main || typeof main !== "function") {
    return fail(404001, { name: `方法${moduleName}.${method}` })
  }
  let res;
  try {
    if (typeof action._before === "function") {
      await action._before.call(this, data);
    }
    res = await main.call(this, data);
    if (typeof action._after === "function") {
      let newRes = await action._after.call(this, null, res);
      if (newRes) res = newRes;
    }
  } catch (err) {
    if (typeof action._after === "function") {
      let newRes = await action._after.call(this, err, res);
      if (newRes) {
        res = newRes;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
  return res;
}
