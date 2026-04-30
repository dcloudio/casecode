'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
const uniADConfig = require('uni-config-center')({
	pluginId: 'uni-ad'
}).config()
let ip = null
const afterCheckAd = async (data) => {
	console.log('afterCheckAd data:', data);
	let { user_id, extra } = data;
	//写自己的业务逻辑
	const actions = {
		watchAdForAnswer: async () => {
			console.log('有用户看广告了，用户id：', user_id);
			// 如果用户 id 为空，则返回
			if (!user_id) {
				console.log('用户id为空，用户id：', user_id);
				return {
					"isValid": false
				}
			}
			// 1. 读系统配置表
			const systemConfig = await db.collection('sf-system-config').doc('main').get();
			/* {
				_id: 'main',
				update_time: 1769779485345,
				ad_score_base: 30,
				ad_score_rate: 1000,
				ad_daily_limit: 10,
				ad_score_l1_rate: 0.25,
				ad_score_l2_rate: 0.25,
				ad_score_self_rate: 0.5,
				withdrawal_fee_rate: 0.2,
				withdrawal_min_score: 1000,
				minimum_exchange_ratio: 0.05
			} */
			const {
				// 今日广告观看次数限制
				ad_daily_limit,
				// 看一次广告多少积分
				ad_score_base,
			} = systemConfig.data[0];
			console.log('系统配置表：', systemConfig.data);

			console.log('今日广告观看次数限制：', ad_daily_limit);
			console.log('看一次广告多少积分：', ad_score_base);
			console.log('用户id：', user_id);

			// watch_time 是看广告的时间戳，今日的要用区间查询
			const todayStart = new Date().setHours(0, 0, 0, 0);
			const todayEnd = new Date().setHours(23, 59, 59, 999);

			// 今日广告观看次数
			const ad_daily_count_red = await db.collection('sf-ad-watch-logs').where({
				user_id,
				watch_time: dbCmd.gte(todayStart).and(dbCmd.lte(todayEnd)),
			}).count();
      		const ad_daily_count = ad_daily_count_red.total;
			console.log('今日广告观看次数：', ad_daily_count);

			if (ad_daily_count >= ad_daily_limit) {
				console.log('今日广告观看次数已超过限制，用户id：', user_id);
				return {
					"isValid": false
				}
			}
			// 2. 添加广告记录 sf-ad-watch-logs
			await db.collection('sf-ad-watch-logs').add({
				user_id,
				watch_time: Date.now(),
				score: ad_score_base,
				is_realtime: false,
			})
			// 3. 调用通知服务，通知用户获得奖励
			const sfCo = uniCloud.importObject('share-fission-co');
			const sfCoRes = await sfCo.action({
				name: 'notify/ad/main',
				data: {
					user_id,
					score: ad_score_base,
					source: 'rewarded-video-ad',
					comment: '看广告获得答案'
				}
			})
			console.log('通知服务返回结果：', sfCoRes);
			return {
				"isValid": true
			}
		}
	}

	try {
		// 解决内部测试广告位 extra 嵌套出现的情况
		if (typeof extra === 'string' && extra.includes('{"extra":')) {
			extra = JSON.parse(extra).extra;
		}
		// 嵌套时 .extra 仍是 JSON 字符串，需再解析一次
		if (typeof extra === 'string') {
			extra = JSON.parse(extra);
		}
		console.error('处理过特殊情况的extra==========>', extra);
	} catch (e) {
		console.error('处理过特殊情况的extra e==========>', e);
	}

	await actions[extra?.action]?.(data);
	return {
		"isValid": true //如果不返回，广点通会2次调用本云函数
	}
}

const crypto = require('crypto');
exports.main = async (event, context) => {
	ip = context.CLIENTIP;
	//event为客户端上传的参数
	console.log('event : ', event);
	const {
		path,
		queryStringParameters
	} = event;
	const data = {
		adpid: event.adpid,
		platform: event.platform,
		provider: event.provider,
		trans_id: event.trans_id,
		sign: event.sign,
		user_id: event.user_id,
		extra: event.extra,
	}
	// 先检查之前是否已经处理过。原始操作 sf-rewarded-video-ad-notify-log 表
	const logRes = await db.collection('sf-rewarded-video-ad-notify-log').doc(event.trans_id).set({
		create_time: Date.now()
	})
	// 返回结果 updated = 0  代表 add，代表是首次请求
	if (logRes.updated > 0) {
		console.log('已经处理过了，不再处理，trans_id：', event.trans_id);
		return {
			"isValid": true
		}
	}


	// 注意::必须验签请求来源
	const trans_id = event.trans_id;
	//去uni-config-center通过adpid获取secret
	const secret = uniADConfig[event.adpid]
	const sign2 = crypto.createHash('sha256').update(`${secret}:${trans_id}`).digest('hex');
	if (event.sign !== sign2) {
		console.log('验签失败');
		return null;
	}
	//自己的逻辑
	try {
		return await afterCheckAd(data)
	} catch (e) {
		console.error(e)
		return {
			"isValid": false
		}
	}
};
