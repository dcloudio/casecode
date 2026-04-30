<template>
	<!-- 对应页面：设备统计-平台对比  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group hide-on-phone">
				<view class="uni-sub-title">多个指标在不同平台数据的占比，可以直观看出各个平台引流的效果</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex mb-m" style="padding: 0px 15px;">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
				<view class="flex" style="flex: 1;">
					<view class="ml-m label-text hide-on-phone">日期选择:</view>
					<uni-datetime-picker type="date" v-model="query.start_time" returnType="timestamp"
						:clearIcon="false" class="uni-stat-datetime-picker"
						:class="{'uni-stat__actived': !!query.start_time}" />
				</view>
			</view>
			<view class="dispaly-grid">
				<view v-for="(item,index) in chartsData" :key="index" class="uni-stat--x uni-charts-box1 charts-box">
					<view class="label-text" style="padding: 5px 0 20px 0;">{{chartsData[index].title}}</view>
					<view style="flex:1;">
						<qiun-data-charts type="column" :eopts="eopts" :chartData="chartsData[index]"  echartsH5 echartsApp tooltipFormat="platformTooltipCustom" :errorMessage="errorMessage"/>
					</view>
				</view>
			</view>

		</view>

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	import {
		mapfields,
		stringifyQuery,
		getTimeOfSomeDayAgo,
		division,
		format,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	export default {
		data() {
			return {
				eopts:{
					// color: ["#91CB74","#1890FF","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
					grid:{
						left: 100,
						right: 100,
						bottom:50
					},
					xAxis:{
						boundaryGap: true,
						axisTick:{
							alignWithLabel:true,
							interval:0
						},
						axisLabel :{
							interval:0,
							 rotate:-30,
							 align:'left'
						}

					},
					extra: {
						column: {
							type:'group',
							width: 120,
						}
					}
				},
				query: {
					dimension: "day",
					appid: '',
					version_id: '',
					start_time: getTimeOfSomeDayAgo(0),
				},
				platforms: [],
				dayChartsData: [],
				monChartsData: [],
				errorMessage: "",
			}
		},
		created() {
			this.debounceGet = debounce(() => {
				this.getAllData(this.query);
			}, 300);
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.debounceGet()
				}
			}
		},
		computed: {
			chartsData() {
				return [...this.dayChartsData, ...this.monChartsData]
			},
			versionQuery() {
				const {
					appid
				} = this.query
				const query = stringifyQuery({
					appid
				})
				return query
			}
		},
		methods: {
			getAllData(query) {
				if (!query.appid) {
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				this.getChartData(query)
				this.getRangeCountData(query, 'month')
			},
			// 获取天的数据
			getChartData(query, type = 'day') {
				query = JSON.parse(JSON.stringify(query))
				const today = getTimeOfSomeDayAgo(0)
				if (query.start_time >= today) {
					const now = new Date().getTime()
					query.start_time = [today, now]
					query = stringifyQuery(query, true)
				} else {
					query = stringifyQuery(query)
				}
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(query)
					.field(
						`active_device_count,new_device_count,total_devices,platform_id`
					)
					.groupBy(`platform_id`)
					.groupField(
						`sum(active_device_count) as ${type}_active_device_count, sum(new_device_count) as ${type}_new_device_count, max(total_devices) as ${type}_total_devices`
					)
					.get()
					.then(res => {
						const data = res.result.data
						this.initChartOption(data, 'dayChartsData')
					})
			},

			// 获取月的数据
			getRangeCountData(query, type) {
				query = stringifyQuery(query)
				const db = uniCloud.database()
				const sub = db.collection('uni-stat-result')
					.where(query)
					.field(
						`active_device_count, new_device_count, platform_id, ${type}(add(new Date(0),start_time), "Asia/Shanghai") as ${type},year(add(new Date(0),start_time), "Asia/Shanghai") as year`
					)
					.groupBy(`year, ${type ? type + ',' : ''}platform_id`)
					.groupField(
						`sum(active_device_count) as ${type}_active_device_count, sum(new_device_count) as ${type}_new_device_count`
					)
					.orderBy(`year asc, ${type} asc`)
					.get()
					.then(res => {
						const data = res.result.data
						this.initChartOption(data, 'monChartsData', 'month')
					})

			},

			initChartOption(data, goal, type = 'day') {
				const db = uniCloud.database()
				db.collection('uni-stat-app-platforms').get().then(res => {
					const options = [{
						field: `${type}_new_device_count`,
						title: `${type === 'day' ? '日' : '月'}新增设备对比`,
						series: [{
							data: []
						}]
					}, {
						field: `${type}_active_device_count`,
						title: `${type === 'day' ? '日' : '月'}活跃设备对比`,
						series: [{
							data: []
						}]
					}]

					if (type === 'day') {
						options.unshift({
							type:"",
							field: `day_total_devices`,
							title: `总设备数对比`,
							series: [{
								data: [],
							}]
						})
					}

					this[goal] = options
					const platformsData = res.result.data
					const platforms = {}
					let categories = []
					platformsData.forEach(p => {
						platforms[p._id] = p.name
						categories.push(p.name)
					})

					for (const chart of this[goal]) {
						let pie = chart.series[0].data
						chart.categories = categories
						const p = JSON.parse(JSON.stringify(platforms))
						let total = 0
						let tableList = []
						for (const item of data) {
							for (const key in item) {
								if (chart.field === key) {
									const id = item.platform_id
									const slice = {
										name: p[id],
										value: item[key],
									}
									total += item[key]
									tableList.push(slice)
									delete p[id]
								}
							}
						}
						for (const key in p) {
							const slice = {
								name: p[key],
								value: 0
							}
							tableList.push(slice)
						}
						// 计算总数
						tableList.map(item=>{
							item.total = total
							return item
						})

						categories.forEach(v=>{
							const item  = tableList.find(i=>i.name === v)
							chart.series[0].data.push(item)
						})
					}
				})
			}

		}

	}
</script>

<style lang="scss">
	.uni-charts-box1 {
		padding: 10px;
		height: 420px;
	}

	.charts-box {
		display: flex;
		flex-direction: column;
	}
</style>
