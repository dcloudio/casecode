<template>
	<view class="uni-stat--x p-m" >
		<view class="uni-stat-card-header">概况</view>
		<uni-table :loading="loading" border stripe emptyText="暂无更多数据" style="min-height: 100px;">
			<!-- 表头行 -->
			<uni-tr>
				<uni-th align="center" class="th"></uni-th>
				<uni-th align="center" class="th">今日</uni-th>
				<uni-th align="center" class="th">昨日</uni-th>
				<uni-th align="center" class="th">前日</uni-th>
				<uni-th align="center" class="th">本周</uni-th>
				<uni-th align="center" class="th">本月</uni-th>
				<uni-th align="center" class="th">本季度</uni-th>
				<uni-th align="center" class="th">本年度</uni-th>
				<uni-th align="center" class="th">累计</uni-th>
			</uni-tr>
			<!-- 表格数据行 -->
			<uni-tr v-for="(item,index) in fieldsMap" :key="index">
				<uni-td align="center" class="td">
					<uni-tooltip>
						<view class="uni-stat--sum-item-title">
							{{ item.title }}
							<uni-icons class="ml-s" type="help" color="#666" />
						</view>
						<template v-slot:content v-if="item.tooltip">
							<view class="uni-stat-tooltip-s">
								{{ item.tooltip }}
							</view>
						</template>
					</uni-tooltip>
				</uni-td>
				<uni-td align="center" class="td">{{ panelData.today[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.yesterday[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.beforeyesterday[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.week[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.month[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.quarter[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.year[item.field] }}</uni-td>
				<uni-td align="center" class="td">{{ panelData.total[item.field] }}</uni-td>
			</uni-tr>
		</uni-table>
	</view>

</template>

<script>
	import {
		formatterData,
		stringifyQuery,
		stringifyField,
		stringifyGroupField,
		getTimeOfSomeDayAgo,
		formatDate,
		parseDateTime,
		debounce,
	} from '@/js_sdk/uni-stat/util.js'
	import timeUtil from "@/js_sdk/uni-stat/timeUtil.js"
	import {
		statPanelTodayFieldsMap,
	} from '../fieldsMap.js'
	let fieldsMap = statPanelTodayFieldsMap;

	export default {
		props: {
			query: {
				type: [Object],
				default: function(){
					return {}
				}
			},
		},
		data() {
			return {
				tableName: 'uni-stat-pay-result',
				fieldsMap,
				panelData: {
					today:{pay_total_amount:"-",pay_order_count:"-"},
					yesterday:{pay_total_amount:"-",pay_order_count:"-"},
					beforeyesterday:{pay_total_amount:"-",pay_order_count:"-"},
					week:{pay_total_amount:"-",pay_order_count:"-"},
					month:{pay_total_amount:"-",pay_order_count:"-"},
					quarter:{pay_total_amount:"-",pay_order_count:"-"},
					year:{pay_total_amount:"-",pay_order_count:"-"},
					total:{pay_total_amount:"-",pay_order_count:"-"},
				},
				loading:false,
			}
		},
		created() {
			this.getCloudDataDebounce = debounce(() => {
				this.getCloudData();
			}, 300);
			this.getCloudDataDebounce();
		},
		methods: {
			// 获取云端数据
			getCloudData() {
				let query = this.query;
				if (!query.appid) return;
				this.loading = true;
				query = stringifyQuery(query, true, ['uni_platform']);
				let where = this.getWhere(query);
				if (query) {
					where = `${query} && (${where})`;
				}
				//console.log('where: ', where)
				const db = uniCloud.database();
				db.collection(this.tableName)
					.where(where)
					.field(`${stringifyField(fieldsMap)}, dimension, stat_date.date_str as stat_time, start_time`)
					.groupBy(`stat_time, dimension`)
					.groupField(stringifyGroupField(fieldsMap)+",last(start_time) as start_time")
					//.field(`pay_total_amount,pay_order_count, dimension, start_time`)
					.get()
					.then(res => {
						let data = res.result.data;
						data.map((item, index) => {
							if (!item.actual_total_amount) item.actual_total_amount = item.pay_total_amount - item.refund_total_amount;
						});
						// 数据格式化
						data = formatterData({
							fieldsMap,
							data
						});
						this.loading = false;
						//console.log('data: ', data)
						Object.assign(this.panelData, this.setPanelData(data));
						//console.log('this.panelData: ', this.panelData)
					});
				// 再单独获取下总金额
				let totalWhere = `${query} && dimension == "year"`;
				//console.log('totalWhere: ', totalWhere)
				db.collection(this.tableName)
					.where(totalWhere)
					.field(`${stringifyField(fieldsMap)}, dimension`)
					.groupBy(`dimension`)
					.groupField(stringifyGroupField(fieldsMap))
					.get()
					.then(res => {
						let data = res.result.data;
						data.map((item, index) => {
							item.actual_total_amount = item.pay_total_amount - item.refund_total_amount;
						});
						// 数据格式化
						data = formatterData({
							fieldsMap,
							data
						});
						Object.assign(this.panelData, {
							total: data[0] || { pay_total_amount:0, pay_order_count:0, create_total_amount:0, refund_total_amount:0, actual_total_amount:0 }
						});
					})
			},
			// 获取查询条件
			getWhere(query){
				let where;
				// 昨日的条件 or 今日的条件 or 本周的条件 or 本月的条件 or 本季度的条件 or 本年度的条件
				let nowTime = Date.now();

				let today = timeUtil.getOffsetStartAndEnd("day",0,nowTime);

				let yesterday = timeUtil.getOffsetStartAndEnd("day",-1,nowTime);

				let beforeyesterday = timeUtil.getOffsetStartAndEnd("day",-2,nowTime);

				let week = timeUtil.getOffsetStartAndEnd("week",0,nowTime);

				let month = timeUtil.getOffsetStartAndEnd("month",0,nowTime);

				let quarter = timeUtil.getOffsetStartAndEnd("quarter",0,nowTime);

				let year = timeUtil.getOffsetStartAndEnd("year",0,nowTime);

				where = `(dimension=="day" && start_time==${today.startTime} && end_time==${today.endTime}) || (dimension=="day" && start_time==${yesterday.startTime} && end_time==${yesterday.endTime}) || (dimension=="day" && start_time==${beforeyesterday.startTime} && end_time==${beforeyesterday.endTime}) || (dimension=="week" && start_time==${week.startTime} && end_time==${week.endTime}) || (dimension=="month" && start_time==${month.startTime} && end_time==${month.endTime}) || (dimension=="quarter" && start_time==${quarter.startTime} && end_time==${quarter.endTime}) || (dimension=="year" && start_time==${year.startTime} && end_time==${year.endTime})`;
				return where;
			},
			// 设置面板数据
			setPanelData(data){
				let nowTime = Date.now();
				let todayData = timeUtil.getOffsetStartAndEnd("day", 0,nowTime);
				let yesterdayData = timeUtil.getOffsetStartAndEnd("day",-1,nowTime);
				let beforeyesterdayData = timeUtil.getOffsetStartAndEnd("day",-2,nowTime);
				let today = data.find((item) => {
					return item.dimension === 'day' && item.start_time === todayData.startTime;
				});
				let yesterday = data.find((item) => {
					return item.dimension === 'day' && item.start_time === yesterdayData.startTime;
				});
				let beforeyesterday = data.find((item) => {
					return item.dimension === 'day' && item.start_time === beforeyesterdayData.startTime;
				});
				let week = data.find((item) => {
					return item.dimension === 'week';
				});
				let month = data.find((item) => {
					return item.dimension === 'month';
				});
				let quarter = data.find((item) => {
					return item.dimension === 'quarter';
				});
				let year = data.find((item) => {
					return item.dimension === 'year';
				});
				let defaultData = { pay_total_amount:0, pay_order_count:0, create_total_amount:0, refund_total_amount:0, actual_total_amount:0 };
				return {
					today: today || defaultData,
					yesterday: yesterday || defaultData,
					beforeyesterday: beforeyesterday || defaultData,
					week: week || defaultData,
					month: month || defaultData,
					quarter: quarter || defaultData,
					year: year || defaultData,
				};
			}
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.getCloudDataDebounce()
				}
			}
		},
	}
</script>

<style lang="scss" scoped>
.uni-stat-tooltip-s {
	width: 400px;
	white-space: normal;
}

.uni-stat--sum {
	&-x {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		border-radius: 4px;
		padding: 15px;
		box-shadow: -1px -1px 5px 0 rgba(0, 0, 0, 0.1);
	}

	&-item {
		white-space: nowrap;
		text-align: center;
		margin: 10px 18px;

		&-width {
			width: 100px
		}
	}

	&-item-title {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 17px;
		font-size: 12px;
		color: #666;
	}

	&-item-value {
		font-size: 24px;
		line-height: 48px;
		font-weight: 700;
		color: #333;
	}

	&-item-contrast {
		font-size: 14px;
		color: #666;
	}
}

/* #ifndef APP-NVUE */
@media screen and (max-width: 500px) {
	.uni-stat--sum-x {
		padding: 15px 0;
		align-items: center;
		justify-content: center;
		flex-wrap: unset;
		overflow-x: auto !important;
	}

	::-webkit-scrollbar {
		display: none;
	}
}

/* #endif */

.uni-stat--sum-flex{
	flex:1;
	display: flex;
	justify-content: flex-start;
	flex-wrap: wrap;
	border-radius: 4px;
	padding: 15px;
	.uni-stat--sum-item{
		min-width: 300rpx;
		max-width: 500rpx;
		flex:1;
	}
}
.uni-stat-card-header {
	justify-content: space-between;
	color: #555;
	font-size: 14px;
	font-weight: 600;
	padding: 10px 0;
	margin-bottom: 15px;
}
.td.main{
	color:#e43d33;
}
</style>
