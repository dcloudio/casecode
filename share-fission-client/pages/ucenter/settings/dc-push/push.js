/**
 * 判断Push是否开启
 */
function isTurnedOnPush(){
	var isOn = undefined;
	try{
		if('iOS' == plus.os.name){
			var types = 0;
			var app = plus.ios.invoke('UIApplication', 'sharedApplication');
			var settings = plus.ios.invoke(app, 'currentUserNotificationSettings');
			if(settings){
				types = settings.plusGetAttribute('types');
				plus.ios.deleteObject(settings);
			}else{
				types = plus.ios.invoke(app, 'enabledRemoteNotificationTypes');
			}
			plus.ios.deleteObject(app);
			isOn = (0!=types);
		}else{
			var main = plus.android.runtimeMainActivity();
			var manager = plus.android.invoke('com.igexin.sdk.PushManager', 'getInstance');
			isOn = plus.android.invoke(manager, 'isPushTurnedOn', main);
		}
	}catch(e){
		console.error('exception in isTurnedOnPush@dc-push!!');
	}
	return isOn;
}

/**
 * 打开Push
 * Android平台 - 打开个推（UniPush）的推送通道
 * iOS平台 - 如果开启通知功能，则打开应用的设置页面引导用户开启通知
 */
function turnOnPush(){
	try{
		if('iOS' == plus.os.name){
			// 如果设置中没有开启通知，则打开应用的设置界面
			if(!isTurnedOnPush()){
				settingInIos();
			}
		}else{
			var main = plus.android.runtimeMainActivity();
			var manager = plus.android.invoke('com.igexin.sdk.PushManager', 'getInstance');
			plus.android.invoke(manager, 'turnOnPush', main);
		}
	}catch(e){
		console.error('exception in turnOnPush@dc-push!!');
	}
}

/**
 * 关闭Push
 * Android平台 - 关闭个推（UniPush）的推送通道
 * iOS平台 - 不做任何操作
 */
function trunOffPush(){
	try{
		if('iOS' == plus.os.name){
			// 这里不做任何操作（不引导用户关闭应用的推送能力），应该通知业务服务器不向此用户下发推送消息
		}else{
			var main = plus.android.runtimeMainActivity();
			var manager = plus.android.invoke('com.igexin.sdk.PushManager', 'getInstance');
			plus.android.invoke(manager, 'turnOffPush', main);
		}
	}catch(e){
		console.error('exception in trunOffPush@dc-push!!');
	}
}

/**
 * iOS平台打开应用设置界面
 */
function settingInIos(){
	try{
	if('iOS' == plus.os.name){
		var app = plus.ios.invoke('UIApplication', 'sharedApplication');
		var setting = plus.ios.invoke('NSURL', 'URLWithString:', 'app-settings:');
		plus.ios.invoke(app, 'openURL:', setting);
		plus.ios.deleteObject(setting);
		plus.ios.deleteObject(app);
	}
	}catch(e){
		console.error('exception in settingInIos@dc-push!!');
	}
}
/**
 * android打开应用设置页面
 */
function settingInAndroid(){
	if (uni.getSystemInfoSync().platform == "android") {
		var main = plus.android.runtimeMainActivity();
		var Intent = plus.android.importClass('android.content.Intent');  
		var Settings = plus.android.importClass('android.provider.Settings');  
		var intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
		// 安卓跳转设置页面详细查看(https://ask.dcloud.net.cn/question/14732)
		main.startActivity(intent);
	}
}
/**
 * 打开应用设置界面
 */
function setting(){
	if (uni.getSystemInfoSync().platform == "ios") {
		settingInIos();
	}
	if (uni.getSystemInfoSync().platform == "android") {
		settingInAndroid();
	}
}

export default {
	isOn: isTurnedOnPush,
	iosSetting: settingInIos,
	on: turnOnPush,
	off: trunOffPush,
	setting:setting
}
