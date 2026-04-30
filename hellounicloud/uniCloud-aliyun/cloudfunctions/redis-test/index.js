// 简单的使用示例
'use strict';
const redis = uniCloud.redis()
exports.main = async (event, context) => {
	const {
		action,
		data
	} = event
	const {
		key, value
	} = data
	let res;
	switch (action) {
		case 'set':
			res = redis.set(key, value)
			break;
		case 'get':
			res = redis.get(key)
			break;
		case 'mget':
			let keys = data.keys.split(',')
			res = redis.mget(...keys)
			break;
		case 'mset':
			let msetData = data.msetData.split(',')
			res = redis.mset(...msetData)
			break;
		case 'lpush':
			res = redis.lpush(key, value)
			break;
		case 'lindex':
			res = redis.lindex(key, data.index)
			break;
		case 'lrange':
			res = redis.lindex(key, ...data.indexs)
			break;
		case 'llen':
			res = redis.llen(key)
			break;
		case 'del':
			res = redis.del(key)
			break;
		default:
			return 'error action in no'
			break;
	}
	return res
};
