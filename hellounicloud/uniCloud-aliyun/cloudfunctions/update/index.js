'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
	const collection = db.collection('unicloud-test')
	const docList = await collection.limit(1).get();
	if (!docList.data || docList.data.length === 0) {
		return {
			status: -1,
			msg: '集合unicloud-test内没有数据'
		}
	}
	const res = await collection.doc(docList.data[0]._id).update(event);
	if (res.updated === 1) {
		let result = Object.assign({}, {
			_id: docList.data[0]._id
		}, event)
		return {
			status: 0,
			msg: `集合第一条数据由${JSON.stringify(docList.data[0])}修改为${JSON.stringify(result)}`
		}
	} else {
		return {
			status: -1,
			msg: `集合unicloud-test内没有数据`
		}
	}
};
