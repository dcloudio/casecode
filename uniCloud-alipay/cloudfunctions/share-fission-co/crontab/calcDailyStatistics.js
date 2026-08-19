'use strict';
const libs = require('../libs'); // 工具类
const { Tables } = require('../constants'); // 表名常量

const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

// 集合引用
const adWatchLogsCollection = db.collection(Tables.adWatchLogs);
const scoresCollection = db.collection(Tables.scores);
const usersCollection = db.collection(Tables.users);
const loginLogsCollection = db.collection(Tables.loginLogs);
const fundPoolCollection = db.collection(Tables.fundPool);
const dailyStatisticsCollection = db.collection(Tables.dailyStatistics);

const oneDayTime = 1000 * 3600 * 24; // 一天的时间戳

/**
 * 每日统计定时任务
 * 建议每天凌晨 00:30 执行，统计前一天的数据
 */
module.exports = async (event, context) => {
  const nowTime = Date.now(); // 当前时间戳
  const yesterday = nowTime - oneDayTime; // 昨天的时间戳
  const statement_date = libs.common.timeFormat(yesterday, "yyyy-MM-dd"); // 统计日期，格式为yyyy-MM-dd

  console.log('统计日期: ', statement_date);

  try {
    // 1. 检查是否已经生成过当天的记录
    const existRecord = await dailyStatisticsCollection.where({
      statement_date: statement_date
    }).get();

    if (existRecord.data && existRecord.data.length > 0) {
      console.log(`${statement_date} 的记录已存在，跳过生成`);
      return {
        errCode: 0,
        errMsg: '记录已存在'
      };
    }

    // 2. 确定统计日期范围（昨天 00:00:00 - 23:59:59）
    // 计算昨天0点到23:59:59的时间范围
    const yesterdayStart = new Date(`${statement_date}T00:00:00+08:00`).getTime();
    const yesterdayEnd = yesterdayStart + oneDayTime - 1;

    console.log('时间范围:', {
      start: libs.common.timeFormat(yesterdayStart, "yyyy-MM-dd HH:mm:ss"),
      end: libs.common.timeFormat(yesterdayEnd, "yyyy-MM-dd HH:mm:ss")
    });

    // 3. 并行查询各项统计数据

    // 3.1 广告统计 (从 sf-ad-watch-logs 聚合)
    const adStatsAggregate = await adWatchLogsCollection.aggregate()
      .match({
        watch_time: _.gte(yesterdayStart).and(_.lte(yesterdayEnd))
      })
      .group({
        _id: null,
        ad_revenue: $.sum('$revenue'), // 总收益
        views_count: $.sum(1), // 总观看次数
        user_ids: $.addToSet('$user_id') // 收集去重用户ID
      })
      .end();

    let ad_revenue = 0;
    let views_count = 0;
    let viewers_count = 0;

    if (adStatsAggregate.data && adStatsAggregate.data.length > 0) {
      const stats = adStatsAggregate.data[0];
      ad_revenue = stats.ad_revenue || 0;
      views_count = stats.views_count || 0;
      viewers_count = (stats.user_ids || []).length;
    }

    // 3.2 积分统计
    // 积分新增
    const scoreAddedResult = await scoresCollection
      .where({
        create_date: _.gte(yesterdayStart).and(_.lte(yesterdayEnd)),
        type: 1
      })
      .field({ score: true })
      .get();
    const score_added = scoreAddedResult.data.reduce((sum, item) => sum + Math.abs(item.score), 0);

    // 积分消耗（仅统计兑换商品）
    const scoreConsumedResult = await scoresCollection
      .where({
        create_date: _.gte(yesterdayStart).and(_.lte(yesterdayEnd)),
        type: 2,
        source: 'exchange'
      })
      .field({ score: true })
      .get();
    const score_consumed = scoreConsumedResult.data.reduce((sum, item) => sum + Math.abs(item.score), 0);

    // 积分提现
    const scoreWithdrawnResult = await scoresCollection
      .where({
        create_date: _.gte(yesterdayStart).and(_.lte(yesterdayEnd)),
        type: 2,
        source: 'withdraw'
      })
      .field({ score: true })
      .get();
    const score_withdrawn = scoreWithdrawnResult.data.reduce((sum, item) => sum + Math.abs(item.score), 0);

    // 3.3 用户统计
    // 新增用户
    const newUsersResult = await usersCollection
      .where({
        register_date: _.gte(yesterdayStart).and(_.lte(yesterdayEnd))
      })
      .count();
    const new_users = newUsersResult.total;

    // 活跃用户
    // 需要去重，使用 aggregate group by user_id
    const activeUsersAggregate = await loginLogsCollection.aggregate()
      .match({
        create_date: _.gte(yesterdayStart).and(_.lte(yesterdayEnd)),
        type: 'login'
      })
      .group({
        _id: '$user_id'
      })
      .count('total')
      .end();

    const active_users = activeUsersAggregate.data.length > 0 ? activeUsersAggregate.data[0].total : 0;

    // 3.4 资金池快照
    const fundPoolResult = await fundPoolCollection.doc('main').get();
    const fundPool = fundPoolResult.data[0] || { total_cash: 0, total_score: 0, exchange_rate: 0.01 };

    // 4. 写入统计表
    const statsData = {
      statement_date,
      ad_revenue: libs.common.toDecimal(ad_revenue, 2),
      viewers_count,
      views_count,
      score_added,
      score_consumed,
      score_withdrawn,
      new_users,
      active_users,
      total_cash: fundPool.total_cash,
      total_score: fundPool.total_score,
      exchange_rate: fundPool.exchange_rate,
      is_settled: false,
      remark: `${statement_date} 每日统计`,
      create_time: nowTime,
      update_time: nowTime
    };

    console.log('统计结果:', statsData);

    // 自动生成 _id，使用 add 而不是 set(docId)
    await dailyStatisticsCollection.add(statsData);


    return {
      errCode: 0,
      errMsg: 'daily statistics calculated successfully',
      data: statsData
    };


  } catch (e) {
    console.error('统计失败:', e);
    return {
      errCode: 500,
      errMsg: e.message
    };
  }
};
