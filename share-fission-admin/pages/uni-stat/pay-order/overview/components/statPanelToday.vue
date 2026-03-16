<template>
	<!-- 历史数据统计面板（最近7天，本月，本季度，本月，总和 -->
	<view class="uni-stat--x p-m">
		<view class="uni-stat-card-header">今日数据</view>
		<uni-table :loading="loading" border stripe emptyText="暂无更多数据" style="min-height: 100px;">
			<!-- 表头行 -->
			<uni-tr>
				<uni-th align="center" class="th"></uni-th>
				<uni-th align="center" class="th" v-for="(item,index) in panelData" :key="index">
					<uni-tooltip>
						<view class="uni-stat--sum-item-title">
							{{ item.title }}
							<uni-icons class="ml-s" type="help" color="#666" />
						</view>
						<template v-slot:content>
							<view class="uni-stat-tooltip-s">
								<view v-for="(item2,index2) in item.list" :key="index2">{{ item2.tooltip }}</view>
							</view>
						</template>
					</uni-tooltip>
				</uni-th>
			</uni-tr>
			<!-- 表格数据行 -->
			<uni-tr>
				<uni-td align="center" class="td">下单</uni-td>
				<uni-td align="center" class="td" v-for="(item, index) in panelData" :key="index">{{ item.list[0].value  }}</uni-td>
			</uni-tr>
			<uni-tr>
				<uni-td align="center" class="td">收款</uni-td>
				<uni-td align="center" class="td" v-for="(item, index) in panelData" :key="index">{{ item.list[1].value  }}</uni-td>
			</uni-tr>
			<uni-tr>
				<uni-td align="center" class="td">退款</uni-td>
				<uni-td align="center" class="td" v-for="(item, index) in panelData" :key="index">{{ item.list[2].value  }}</uni-td>
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
		fieldsMap,
		fieldsGroupMap,
	} from '../fieldsMap.js'

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
				panelData: fieldsGroupMap,
				loading: false
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
				const where = stringifyQuery({
					...query,
					start_time: [getTimeOfSomeDayAgo(0), Date.now()]
				}, true, ['uni_platform']);
				//console.log('where: ', where)
				const db = uniCloud.database();
				const subTable = db.collection(this.tableName)
					.where(where)
					.field(`${stringifyField(fieldsMap)}, dimension, stat_date.date_str as stat_time, start_time`)
					.groupBy(`stat_time, dimension`)
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('stat_time', 'desc')
					.get()
					.then(res => {
						let data = res.result.data;
						// 数据格式化
						data = formatterData({
							fieldsMap,
							data
						});
						//console.log('data: ', data)
						// 获取今日数据
						let today = data.find((item) => {
							return item.dimension === 'day' && item.stat_time === parseDateTime(getTimeOfSomeDayAgo(0), '');
						});
						if (!today) {
							today = data.find((item) => {
								return item.dimension === 'hour' && item.stat_time === parseDateTime(getTimeOfSomeDayAgo(0), '');
							}) || {};
						}
						this.loading = false;
						this.panelData = this.setPanelData(today);
					})
			},
			// 设置面板数据
			setPanelData(data){
				let panelData = this.panelData;
				panelData.map((item1, index1) => {
					item1.list.map((item2, index2) => {
						item2.value = data[item2.field] || 0;
					});
				});
				return panelData;
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
	width: 350px;
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
