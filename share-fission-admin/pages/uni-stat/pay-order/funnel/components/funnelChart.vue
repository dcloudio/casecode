<template>
	<view class="uni-stat--x p-m">
		<view class="uni-stat-card-header">漏斗分析</view>
		<!-- 时间纬度 -->
		<view class="flex">
			<uni-stat-tabs type="box" :current="dateTabs.index" :tabs="dateTabs.list" @change="dateTabsChange" />
			<uni-datetime-picker type="date" v-model="dateTabs.time" :end="Date.now()" return-type="timestamp" :clear-icon="false" class="uni-stat-datetime-picker" @change="datePickerChange" />
			<view class="uni-stat--tips" v-if="dateTabs.timeStr">当前时间范围：{{ dateTabs.timeStr }}</view>
		</view>
		<!-- 漏斗 -->
		<view class="uni-charts-box" v-if="!notData">
			<qiun-data-charts type="funnel" :chartData="chartData" :opts="opts" :errorMessage="errorMessage" />
		</view>
		<view class="uni-charts-box flex center" v-else>
			<view >暂无数据</view>
		</view>
	</view>
</template>

<script>
	import {
		mapfields,
		stringifyQuery,
		stringifyField,
		stringifyGroupField,
		getTimeOfSomeDayAgo,
		division,
		format,
		formatDate,
		parseDateTime,
		getFieldTotal,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import timeUtil from "@/js_sdk/uni-stat/timeUtil.js"
	import {
		fieldsMap,
	} from '../fieldsMap.js'
	export default {
		props: {
			// 组件外部查询条件，一般包含 appid version_id platform_id
			query: {
				type: [Object],
				default: function() {
					return {}
				}
			}
		},
		data() {
			return {
				tableName: 'uni-stat-pay-result',
				fieldsMap,
				chartData: {},
				errorMessage:"",
				notData: false,
				opts: {
					color: ["#1890FF", "#91CB74", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4", "#ea7ccc"],
					padding: [15, 15, 0, 15],
					extra: {
						funnel: {
							activeOpacity: 0.3,
							activeWidth: 10,
							border: true,
							borderWidth: 2,
							borderColor: "#FFFFFF",
							fillOpacity: 1,
							labelAlign: "right",
							linearType: "custom",
							minSize: 20
						}
					}
				},
				// 时间选项
				dateTabs: {
					time: Date.now(),
					timeStr:"",
					index: 0,
					list: [
						{ _id: "day", name: '日维度' },
						{ _id: "week", name: '周维度' },
						{ _id: "month", name: '月维度' }
					]
				}
			}
		},
		created() {
			this.getCloudDataDebounce = debounce(() => {
				this.getCloudData();
			}, 400);
			this.getCloudDataDebounce();
		},
		methods: {
			calcPercentage(v1, v2) {
				return v2 > 0 ? parseFloat((v1 / v2 * 100).toFixed(2)) : 0;
			},
			// 获取云端数据
			getCloudData() {
				let query = this.query;
				if (!query.appid){
					this.errorMessage = "请先选择应用";
					return;
				}
				this.errorMessage = "";
				let insideQuery = this.getWhere();
				let where = {
					...query,
					...insideQuery
				};
				const day = 24 * 60 * 60 * 1000;
				let start_time;
				where = stringifyQuery(where, false, ['uni_platform']);
				//console.log('where: ', where);
				const db = uniCloud.database();
				const subTable = db.collection(this.tableName)
					.where(where)
					.field(`${stringifyField(fieldsMap)}, dimension, stat_date.date_str as stat_time, start_time`)
					.groupBy(`null`)
					.groupField(stringifyGroupField(fieldsMap))
					.get()
					.then(res => {
						let data = res.result.data;
						if (!data.length) {
							this.errorMessage = "暂无数据";
							return;
						}
						this.errorMessage = "";
						//console.log('data: ', data);
						data.map((item) => {
							for (let key in item) {
								if (key.indexOf("_amount") > 1) {
									item[key] = Number((item[key] / 100).toFixed(2));
								}
							}
						});
						let {
							activity_device_count = 0,
							activity_user_count = 0,
							pay_user_count = 0,
						} = data[0] || {};
						this.notData = !activity_device_count && !activity_user_count && !pay_user_count ? true : false;
						let chartData = {
							series: [{
								data: [
									{
										"name": "活跃设备数量",
										"value": activity_device_count,
										"centerText": `${activity_device_count}`,										"labelText": `活跃设备数`
									},
									{
										"name": "活跃用户数量",
										"value": activity_user_count,
										"centerText": `${activity_user_count}`,
										"labelText": `活跃用户数（用户转化率：${this.calcPercentage(activity_user_count,activity_device_count)}%）`
									},
									{
										"name": "支付用户数量",
										"value": pay_user_count,
										"centerText": `${pay_user_count}`,
										"labelText": `支付用户数（支付转化率：${this.calcPercentage(pay_user_count,activity_user_count)}%）`,
									},
								],
							}]
						};
						this.chartData = chartData;
					})
			},
			// 监听 - 日期标签更改
			dateTabsChange(id, index) {
				this.dateTabs.index = index;
				this.getCloudData();
			},
			// 监听 - 日期选择更改
			datePickerChange(time) {
				this.dateTabs.time = time;
				this.getCloudData();
			},
			// 获取查询条件
			getWhere() {
				let time = this.dateTabs.time; // 当前选择的时间
				let dimension = this.dateTabs.list[this.dateTabs.index]._id || "day"; // 获取时间纬度
				let start_time = [];
				if (dimension === "day") {
					let { startTime, endTime } = timeUtil.getOffsetStartAndEnd("day", 0, time);
					start_time = [startTime, endTime];
				} else if (dimension === "week") {
					let { startTime, endTime } = timeUtil.getOffsetStartAndEnd("week",0, time);
					start_time = [startTime, endTime];
				} else if (dimension === "month") {
					let { startTime, endTime } = timeUtil.getOffsetStartAndEnd("month", 0, time);
					start_time = [startTime, endTime];
				}
				this.dateTabs.timeStr = `${timeUtil.timeFormat(start_time[0])} ~ ${timeUtil.timeFormat(start_time[1])}`;
				return {
					dimension, // 时间纬度
					start_time, // 时间范围
				}
			}
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.getCloudDataDebounce();
				}
			}
		},
		computed: {

		}
	}
</script>

<style lang="scss" scoped>
.flex.center{
	justify-content: center;
	align-items: center;
	color: #666;
}
</style>
