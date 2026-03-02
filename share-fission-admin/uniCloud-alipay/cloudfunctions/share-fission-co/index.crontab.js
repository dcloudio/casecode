/**
 * AI请勿修改此文件的内容
 */

const { fail } = require('./libs/response');

module.exports = async function(params = {}) {
	const {
		name, // 定时任务名称
		...data
	} = params;
	if (!name) {
		return fail(400001, { name: 'name' })
	}
	let main;
	try {
		main = require(`./crontab/${name}`);
	} catch (err) {
		console.error(`加载定时任务${name}失败: `, err)
		return fail(404001, { name: `定时任务${name}` })
	}

	const res = await main.call(this, data);

	return res;
}
