const db = uniCloud.database();
const testCollection = db.collection('unicloud-test')
module.exports = {
	async add({product, create_time }) {
		let res = await testCollection.add({product, create_time })
		return res
	},
	async remove() {
		let docList = await testCollection.limit(1).get()
		if (!docList.data || docList.data.length === 0) {
			return {
				status: -1,
				msg: '集合unicloud-test内没有数据'
			}
		}
		let res = await testCollection.doc(docList.data[0]._id).remove()
		if (res.deleted === 1) {
			return {
				status: 0,
				msg: '成功删除unicloud-test内第一条数据'
			}
		} else {
			return {
				status: -2,
				msg: '删除数据失败'
			}
		}
	},
	async update({product,create_time}) {
		const docList = await testCollection.limit(1).get();
		if (!docList.data || docList.data.length === 0) {
			return {
				status: -1,
				msg: '集合unicloud-test内没有数据'
			}
		}
		const res = await testCollection.doc(docList.data[0]._id).update({product,create_time});
		if (res.updated === 1) {
			let result = Object.assign({}, {
				_id: docList.data[0]._id
			}, {product,create_time})
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
	},
	async get() {
		let res = await testCollection.limit(10).get()
		return res
	},
	async useCommon() {
		const {
			secret,
			getVersion
		} = require('hello-common')
		let version = getVersion()
		console.log("secret: " + secret);
		console.log("version: " + version);
		return {
			secret,
			version
		}
	}
}