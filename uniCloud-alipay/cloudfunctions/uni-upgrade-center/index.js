'use strict';
const uniID = require('uni-id-common')
const success = { success: true }
const fail = { success: false }
const checkVersion = require('./checkVersion')

async function checkPermission(uniIDIns, uniIdToken, permission) {
	const checkTokenRes = await uniIDIns.checkToken(uniIdToken)
	if (checkTokenRes.errCode === 0) {
		if (checkTokenRes.permission.indexOf(permission) > -1 || checkTokenRes.role.indexOf('admin') > -1) {
			return true
		} else {
			return Object.assign({ errMsg: '权限不足' }, fail)
		}
	} else {
		return Object.assign({}, checkTokenRes, { errMsg: checkTokenRes.message }, fail)
	}
}

exports.main = async (event, context) => {
	//event为客户端上传的参数

	const db = uniCloud.database()
	const appListDBName = 'opendb-app-list'
	const appVersionDBName = 'opendb-app-versions'
	const uniIDIns = uniID.createInstance({ context: context })
	let res = {};

	if (event.headers) {
		try {
			if (event.httpMethod.toLocaleLowerCase() === 'get') {
				event = event.queryStringParameters;
			} else {
				event = JSON.parse(event.body);
			}
		} catch (e) {
			return {
				code: 500,
				msg: '请求错误'
			};
		}
	}

	let params = event.data || event.params;
	switch (event.action) {
		case 'checkVersion':
			res = await checkVersion(event, context)
			break;
		case 'deleteFile':
			let checkDeletePermission = await checkPermission(uniIDIns, event.uniIdToken, 'DELETE_OPENDB_APP_VERSIONS')
			if (checkDeletePermission === true) {
				res = await uniCloud.deleteFile({ fileList: params.fileList })
			} else {
				return checkDeletePermission
			}
			break;
		case 'setNewAppData':
			let checkUpdatePermission = await checkPermission(uniIDIns, event.uniIdToken, 'UPDATE_OPENDB_APP_LIST')
			if (checkUpdatePermission === true) {
				params.value.create_date = Date.now()
				res = await db.collection(appListDBName).doc(params.id).set(params.value)
			} else {
				return checkUpdatePermission
			}
			break;
		case 'getAppInfo':
			let dbAppList
			try {
				dbAppList = db.collection(appListDBName)
			} catch (e) {}

			if (!dbAppList) return fail;

			const dbAppListRecord = await dbAppList.where({
				appid: params.appid
			}).get()

			if (dbAppListRecord && dbAppListRecord.data.length)
				return Object.assign({}, success, dbAppListRecord.data[0])

			//返回数据给客户端
			return fail
			break;
		case 'getAppVersionInfo':
			let dbVersionList
			try {
				dbVersionList = db.collection(appVersionDBName)
			} catch (e) {}

			if (!dbVersionList) return fail;

			const dbVersionListrecord = await dbVersionList.where({
					appid: params.appid,
					platform: params.platform,
					type: "native_app",
					stable_publish: true
				})
				.orderBy('create_date', 'desc')
				.get();

			if (dbVersionListrecord && dbVersionListrecord.data && dbVersionListrecord.data.length > 0)
				return Object.assign({}, dbVersionListrecord.data[0], success)

			return fail
			break;
	}

	//返回数据给客户端
	return res
};
