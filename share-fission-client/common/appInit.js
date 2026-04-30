import uniStarterConfig from '@/uni-starter.config.js';
//应用初始化页
// #ifdef APP
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version';

// #endif
const db = uniCloud.database()
export default async function() {
	const debug = uniStarterConfig.debug;

	// uniStarterConfig挂载到getApp().globalData.config
	setTimeout(() => {
		getApp({
			allowDefault: true
		}).globalData.config = uniStarterConfig;
	}, 1)


	// 初始化appVersion（仅app生效）
	initAppVersion();

	//clientDB的错误提示
	function onDBError({
		code, // 错误码详见https://uniapp.dcloud.net.cn/uniCloud/clientdb?id=returnvalue
		message
	}) {
		console.log('onDBError', {
			code,
			message
		});
		// 处理错误
		console.error(code, message);
	}
	// 绑定clientDB错误事件
	db.on('error', onDBError)


	//拦截云对象请求
	uniCloud.interceptObject({
		async invoke({
			objectName, // 云对象名称
			methodName, // 云对象的方法名称
			params // 参数列表
		}) {
			// console.log('interceptObject',{
			// 	objectName, // 云对象名称
			// 	methodName, // 云对象的方法名称
			// 	params // 参数列表
			// });
			if(objectName == "uni-id-co" && (methodName.includes('loginBy') ||  ['login','registerUser'].includes(methodName) )){
				console.log('执行登录相关云对象');
				params[0].inviteCode = uni.getStorageSync('sf-invitation-code')
				console.log('inviteCode', params[0].inviteCode);
				// console.log(params);
			}
			// console.log(params);
		},
		success(e) {
			console.log(e);
		},
		complete() {

		},
		fail(e){
			console.error(e);
			// if (debug) {
			// 	uni.showModal({
			// 		content: JSON.stringify(e),
			// 		showCancel: false
			// 	});
			// }else{
			// 	uni.showToast({
			// 		title: '系统错误请稍后再试',
			// 		icon:'error'
			// 	});
			// }
		}
	})


	// #ifdef APP
	// 监听并提示设备网络状态变化
	uni.onNetworkStatusChange(res => {
		console.log(res.isConnected);
		console.log(res.networkType);
		if (res.networkType != 'none') {
			uni.showToast({
				title: '当前网络类型：' + res.networkType,
				icon: 'none',
				duration: 3000
			})
		} else {
			uni.showToast({
				title: '网络类型：' + res.networkType,
				icon: 'none',
				duration: 3000
			})
		}
	});
	// #endif

}
/**
 * // 初始化appVersion
 */
function initAppVersion() {
	// #ifdef APP-PLUS
	let appid = plus.runtime.appid;
	plus.runtime.getProperty(appid, (wgtInfo) => {
		let appVersion = plus.runtime;
		let currentVersion = appVersion.versionCode > wgtInfo.versionCode ? appVersion : wgtInfo;
		getApp({
			allowDefault: true
		}).appVersion = {
			...currentVersion,
			appid,
			hasNew: false
		}
		// 检查更新小红点
		callCheckVersion().then(res => {
			// console.log('检查是否有可以更新的版本', res);
			if (res.result.code > 0) {
				// 有新版本
				getApp({
					allowDefault: true
				}).appVersion.hasNew = true;
				console.log(checkUpdate());
			}
		})
	});
	// 检查更新
	// #endif
}