'use strict';
exports.main = async (event, context) => {
	/**
	 * 根据搜索记录,设定时间间隔来归纳出热搜数据并存储在热搜表中
	 */
	const SEARCHHOT = 'opendb-search-hot'; // 热搜数据库名称
	const SEARCHLOG = 'opendb-search-log'; // 搜索记录数据库名称
	const SEARCHLOG_timeZone = 604800000; // 归纳搜索记录时间间隔，毫秒数，默认为最近7天
	const SEARCHHOT_size = 10; //	热搜条数

	const DB = uniCloud.database();
	const DBCmd = DB.command;
	const $ = DB.command.aggregate;
	const SEARCHHOT_db = DB.collection(SEARCHHOT);
	const SEARCHLOG_db = DB.collection(SEARCHLOG);
	const timeEnd = Date.now() - SEARCHLOG_timeZone;

	let {
		data: searchHotData
	} = await SEARCHLOG_db
		.aggregate()
		.match({
			create_date: DBCmd.gt(timeEnd)
		})
		.group({
			_id: {
				'content': '$content',
			},
			count: $.sum(1)
		})
		.replaceRoot({
			newRoot: $.mergeObjects(['$_id', '$$ROOT'])
		})
		.project({
			_id: false
		})
		.sort({
			count: -1
		})
		.end();

	let now = Date.now();
	searchHotData.map(item => {
		item.create_date = now;
		return item;
	}).slice(0, SEARCHHOT_size);
	// searchHotData = searchHotData.sort((a, b) => b.count - a.count).slice(0, SEARCHHOT_size);
	return searchHotData.length ? await SEARCHHOT_db.add(searchHotData) : ''
};
