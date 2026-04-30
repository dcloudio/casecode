<template>
	<view class="uni-stat--x p-m">
		<view class="uni-stat-card-header">趋势图</view>
		<!-- 时间纬度 -->
		<view class="flex">
			<uni-stat-tabs type="box" :current="dateTabs.index" :tabs="dateTabs.list" @change="dateTabsChange" />
			<uni-datetime-picker type="datetimerange" v-model="dateTabs.time" :end="Date.now()" return-type="timestamp" :clear-icon="false" class="uni-stat-datetime-picker" @change="datePickerChange" />
		</view>
		<uni-stat-tabs type="box" :current="statTabs.index" :tabs="statTabs.list" @change="statTabsChange" />
		<view class="uni-charts-box">
			<qiun-data-charts type="area" :chartData="chartData" :opts="opts" :errorMessage="errorMessage"/>
		</view>
	</view>
</template>

<script>
	import {
		formatterData, // 格式化字段数据
		fillTrendChartData,
		stringifyQuery, // 对象转JQL查询字符串
		parseDateTime, // 格式化时间
		debounce, // 防抖函数
		stringifyField,
		stringifyGroupField,
		getTimeOfSomeDayAgo,
	} from '@/js_sdk/uni-stat/util.js'
	import timeUtil from "@/js_sdk/uni-stat/timeUtil.js"
	import {
		fieldsGroupMap,
	} from '../fieldsMap.js'
	let statTabsList = [];
	fieldsGroupMap.forEach(item => {
		const _id = item.group
		const name = item.title
		if (_id && name) {
			statTabsList.push({
				_id,
				name,
				list: item.list
			})
		}
	});

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
				chartData: {},
				errorMessage: "",
				opts: {
					color: ["#1890FF","#91CB74","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
					padding: [15,15,0,15],
					legend: {},
					enableScroll: true,
					dataLabel: false, // 是否显示数据标签
					xAxis: {
						disableGrid: true,
						itemCount: 24,
						fontSize:12,
						boundaryGap:"center", // center justify
					},
					yAxis: {
						gridType: "dash",
						dashLength: 2,
						data:[
							{
								tofix:2
							}
						]
					},
					extra: {
						area: {
							type: "straight",
							opacity: 0.2,
							addLine: true,
							width: 2,
							gradient: false,
						},
					},
					legend:{
						position:"bottom"
					}
				},
				// 时间选项
				dateTabs: {
					time: [],
					timeStr:"",
					index: 2, // 默认最近7天
					list: [
						{ _id: 1, name: '昨天', dimension:"hour" },
						{ _id: 0, name: '今天', dimension:"hour"  },
						{ _id: 7, name: '最近七天', dimension:"day"  },
						{ _id: 30, name: '最近30天', dimension:"day"  },
						{ _id: 90, name: '最近90天', dimension:"day"  },
						{ _id: 372, name: '月纬度', dimension:"month"  },
						{ _id: 1116, name: '季纬度', dimension:"quarter"  },
						{ _id: 4392, name: '年纬度', dimension:"year"  },
					]
				},
				statTabs:{
					index: 0,
					list: statTabsList
				},
				queryMode: 0
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
			getCloudData(obj={}) {
				let query = this.query;
				if (!query.appid){
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				let insideQuery = this.getWhere();
				let where = {
					...query,
					...insideQuery
				};
				let fieldsMap = this.statTabs.list[this.statTabs.index].list;
				where = stringifyQuery(where, true, ['uni_platform']);
				//console.log('trendChart-where: ', where);
				const db = uniCloud.database();
				db.collection(this.tableName)
					.where(where)
					.field(`${stringifyField(fieldsMap)}, start_time`)
					.groupBy(`start_time`)
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('start_time', 'asc')
					.limit(100)
					.get({
						getCount: true
					})
					.then(res => {
						let {
							count,
							data
						} = res.result;
						data = fillTrendChartData(data, insideQuery, fieldsMap); // 补全数据
						// 数据格式化
						data = formatterData({
							fieldsMap,
							data,
							formatter: false
						});
						//console.log('trendChartData: ', data)
						this.setChartData(data, fieldsMap, insideQuery);
					}).catch((err) => {
						console.error(err);
					}).finally(() => {})
			},
			// 设置图表数据
			setChartData(data, fieldsMap, insideQuery){
				let chartData = {
					categories: [],
					series: []
				};
				fieldsMap.map((item, index) => {
					if (item.trendChart) {
						chartData.series.push({
							name: item.title,
							data:[]
						});
					}
				});
				for (const item of data) {
					const x = this.formatDate(item.start_time, insideQuery.dimension);
					chartData.categories.push(x);
					fieldsMap.map((item2, index) => {
						if (item2.trendChart) {
							let y = Number(item[item2.field]);
							chartData.series[index].data.push(y);
						}
					});
				}
				this.chartData = chartData;
			},
			formatDate(date, type){
				let d = new Date(date);
				let year = d.getFullYear();
				let month = d.getMonth() + 1;
				let day = d.getDate();
				let hour = d.getHours();
				let quarter = Math.floor((d.getMonth() + 3) / 3); //季度
				if (month < 10) month = "0"+ month;
				if (day < 10) day = "0"+ day;
				if (type === 'hour') {
					return `${hour}时`;
				} else if (type === 'month') {
					return `${year}-${month}`;
				} else if (type === 'quarter') {
					return `${year}/Q${quarter}`;
				} else if (type === 'year') {
					return `${year}`;
				} else {
					return parseDateTime(d);
				}
			},
			// 监听 - 日期选择更改
			datePickerChange(time) {
				this.dateTabs.time = time;
				//this.dateTabs.index = null;
				this.queryMode = 1;
				this.getCloudData();
			},
			// 监听 - 日期选择更改
			dateTabsChange(id, index) {
				this.dateTabs.index = index;
				this.queryMode = 0;
				this.getCloudData();
			},
			// 监听 - 统计字段纬度更改
			statTabsChange(id, index, name) {
				this.statTabs.index = index;
				this.getCloudData({
					field: id,
					name
				});
			},
			// 获取查询条件
			getWhere() {
				const day = 24 * 60 * 60 * 1000;
				let start_time = [];
				let item = this.dateTabs.list[this.dateTabs.index] || {};
				if (typeof item._id === "number" && this.queryMode === 0) {
					let start =  getTimeOfSomeDayAgo(item._id);
					let end = timeUtil.getOffsetStartAndEnd("day", 0).endTime; // end默认=今天的截止时间
					if (item._id == 1) {
						// 如果是查昨天,则特殊处理下,end=昨天的截止时间
						end = timeUtil.getOffsetStartAndEnd("day", 0, start).endTime;
					}
					start_time = [start, end];
				} else if (this.dateTabs.time){
					start_time = this.dateTabs.time; // 当前选择的时间
				}
				let dimension = item.dimension || "day"; // 获取时间纬度
				this.dateTabs.timeStr = `${timeUtil.timeFormat(start_time[0])} ~ ${timeUtil.timeFormat(start_time[1])}`;
				this.dateTabs.time = start_time;
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
.justify-center{
	justify-content: center;
}
</style>
