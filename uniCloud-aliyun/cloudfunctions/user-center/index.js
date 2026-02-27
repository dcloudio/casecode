'use strict';

const uniID = require('uni-id')
exports.main = async (event) => {
	/* 如果你通过云函数Url访问
	 * 使用GET时参数位于event.queryStringParameters
	 * 使用POST时参数位于event.body
	 * 请自行处理上述场景
	 */
	let params = event.params || {}
	let payload = {}
	let noCheckAction = ['register', 'checkToken', 'encryptPwd', 'login', 'loginByWeixin', 'sendSmsCode',
		'setVerifyCode', 'loginBySms', 'loginByEmail', 'code2SessionWeixin', 'code2SessionAlipay'
	]
	if (noCheckAction.indexOf(event.action) === -1) {
		if (!event.uniIdToken) {
			return {
				code: 403,
				msg: '缺少token'
			}
		}
		payload = await uniID.checkToken(event.uniIdToken)
		if (payload.code && payload.code > 0) {
			return payload
		}
		params.uid = payload.uid
	}
	let res = {}

	switch (event.action) {
		case 'register':
			res = await uniID.register(params);
			break;
		case 'login':
			res = await uniID.login({
				...params,
				// 不指定queryField的情况下只会查询username
				queryField: ['username', 'email', 'mobile']
			});
			break;
		case 'logout':
			res = await uniID.logout(event.uniIdToken);
			break;
		case 'updatePwd':
			res = await uniID.updatePwd(params);
			break;
		case 'setAvatar':
			res = await uniID.setAvatar(params);
			break;
		case 'bindMobile':
			res = await uniID.bindMobile(params);
			break;
		case 'unbindMobile':
			res = await uniID.unbindMobile(params);
			break;
		case 'bindEmail':
			res = await uniID.bindEmail(params);
			break;
		case 'unbindEmail':
			res = await uniID.unbindEmail(params);
			break;
		case 'code2SessionWeixin':
			res = await uniID.code2SessionWeixin(params);
			break;
		case 'loginByWeixin':
			res = await uniID.loginByWeixin(params);
			break;
		case 'bindWeixin':
			res = await uniID.bindWeixin(params);
			break;
		case 'unbindWeixin':
			res = await uniID.unbindWeixin(params.uid);
			break;
		case 'code2SessionAlipay':
			res = await uniID.code2SessionAlipay(params);
			break;
		case 'loginByAlipay':
			res = await uniID.loginByAlipay(params);
			break;
		case 'bindAlipay':
			res = await uniID.bindAlipay(params);
			break;
		case 'unbindAlipay':
			res = await uniID.unbindAlipay(params.uid);
			break;
		case 'checkToken':
			// 注意1.1.0版本会返回userInfo（res.userInfo），如果没有必要请不要返回全部信息给客户端
			res = await uniID.checkToken(event.uniIdToken)
			break;
		case 'resetPwd':
			res = await uniID.resetPwd({
				uid: params.uid,
				password: '123456'
			});
			break;
		case 'encryptPwd':
			const password = await uniID.encryptPwd('123456');
			res = {
				code: 0,
				msg: '密码加密完成',
				password
			}
			break;
		case 'sendSmsCode':
			res = await uniID.sendSmsCode(params);
			break;
		case 'setVerifyCode':
			res = await uniID.setVerifyCode(params);
			break;
		case 'loginBySms':
			res = await uniID.loginBySms(params);
			break;
		case 'loginByEmail':
			res = await uniID.loginByEmail(params);
			break;
		case 'updateUser':
			res = await uniID.updateUser(params);
			break;
		case 'setUserInviteCode':
			res = await uniID.setUserInviteCode(params);
			break;
		case 'acceptInvite':
			res = await uniID.acceptInvite(params);
			break;
		case 'addRole':
			res = await uniID.addRole(params);
			break;
		case 'getRoleList':
			res = await uniID.getRoleList(params);
			break;
		case 'addPermission':
			res = await uniID.addPermission(params);
			break;
		case 'getPermissionList':
			res = await uniID.getPermissionList(params);
			break;
		case 'getRoleByUid':
			res = await uniID.getRoleByUid(params);
			break;
		case 'bindRole':
			res = await uniID.bindRole(params);
			break;
		case 'bindPermission':
			res = await uniID.bindPermission(params);
			break;
		default:
			res = {
				code: 403,
				msg: '非法访问'
			}
			break;
	}

	//返回数据给客户端
	return res
};
