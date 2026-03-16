module.exports = {
	trigger: {
		// 监听 - 删除前
		beforeDelete: async function(obj = {}) {
			let {
				collection,
				operation,
				where,
				field
			} = obj;
			// 删除表记录前先删除云存储内的文件
			const db = uniCloud.database();
			const _ = db.command;
			let getRes = await db.collection("uni-stat-error-source-map").where(where).limit(1000).get();
			let list = getRes.data;
			if (list && list.length > 0) {
				let fileList = list.map((item, index) => {
					return item.file_id;
				});
				try {
					let deleteFileRes = await uniCloud.deleteFile({
						fileList
					});
					// console.log('deleteFileRes: ', deleteFileRes)
				} catch (err) {}
			}
		}
	}
}
