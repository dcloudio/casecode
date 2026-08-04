<template>
	<!-- 对应页面：设备统计-趋势分析  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="uni-sub-title hide-on-phone">各指标趋势分析</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" @change="changeAppid" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time" returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker" :class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}" @change="useDatetimePicker" />
				<uni-stat-tabs label="维度选择" type="box" :current="currentDimensionTab" :tabs="dimensionTabs"  @change="changeDimensionTab" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
			</view>
			<uni-stat-panel :items="panelData" />

			<view class="uni-stat--x p-m">
				<view class="label-text mb-l">
					趋势图
				</view>
				<uni-stat-tabs type="box" v-model="chartTab" :tabs="chartTabs" class="mb-l" @change="changeChartTab" />
				<view class="uni-charts-box">
					<qiun-data-charts type="area" :chartData="chartData" echartsH5 echartsApp :errorMessage="errorMessage" :eopts="setOptions"/>
				</view>
			</view>

			<view class="uni-stat--x p-m">
				<uni-stat-table :data="tableData" :filedsMap="fieldsMap" :loading="loading" />
				<view class="uni-pagination-box">
					<uni-pagination show-icon show-page-size :page-size="options.pageSize"
						:current="options.pageCurrent" :total="options.total" @change="changePageCurrent"
						@pageSizeChange="changePageSize" />
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
		stringifyField,
		stringifyGroupField,
		getTimeOfSomeDayAgo,
		division,
		format,
		formatDate,
		getFieldTotal,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import fieldsMap from './fieldsMap.js'
	export default {
		data() {
			return {
				tableName: 'uni-stat-result',
				fieldsMap,
				query: {
					dimension: "day",
					appid: '',
					platform_id: '',
					uni_platform: '',
					version_id: '',
					channel_id: '',
					start_time: [],
				},
				options: {
					pageSize: 20,
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
				},
				loading: false,
				currentDateTab: 1,
				currentDimensionTab: 1,
				tableData: [],
				panelData: fieldsMap.filter(f => f.hasOwnProperty('value')),
				chartData: {},
				chartTab: 'new_user_count',
				channelData: [],
				tabIndex: 0,
				errorMessage: "",
				setOptions: {
					xAxis: {
						boundaryGap: false,
						axisTick: {
							show: false
						},
						axisLine: {
							lineStyle: {
								color: '#999'
							}
						}
					},
					tooltip: {
						trigger: 'axis',
						axisPointer: {
							type: 'cross'
						},
					},
					grid: {
						left: 40,
						right: 50,
						bottom: 50,
						top: 60,
						containLabel: true,
						show: false
					}
				}
			}
		},
		computed: {
			chartTabs() {
				const tabs = []
				fieldsMap.forEach(item => {
					const {
						field: _id,
						title: name
					} = item
					const isTab = item.hasOwnProperty('value')
					if (_id && name && isTab) {
						tabs.push({
							_id,
							name
						})
					}
				})
				return tabs
			},
			dimensionTabs() {
				const tabs = [{
					_id: 'hour',
					name: '按时'
				}, {
					_id: 'day',
					name: '按日'
				}, {
					_id: 'week',
					name: '按周'
				}, {
					_id: 'month',
					name: '按月'
				}];
				if (!this.getDays()) {
					this.query.dimension = 'hour'
					tabs.forEach((tab, index) => {
						if (tab._id === 'hour') {
							tab.disabled = false
						} else {
							tab.disabled = true
						}
					})
					this.currentDimensionTab = 0
				} else {
					//this.query.dimension = 'day'
					tabs.forEach((tab, index) => {
						if (tab._id === 'hour') {
							tab.disabled = false
						} else {
							tab.disabled = false
						}
					})
					//this.currentDimensionTab = 1
				}
				return tabs
			},
			channelQuery() {
				const platform_id = this.query.platform_id
				return stringifyQuery({
					platform_id
				})
			},
			versionQuery() {
				const {
					appid,
					uni_platform
				} = this.query
				const query = stringifyQuery({
					appid,
					uni_platform,
				})
				return query
			}
		},
		created() {
			this.debounceGet = debounce(() => {
				this.getAllData(this.query);
			}, 300);
			this.getChannelData()
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.debounceGet()
				}
			}
		},
		methods: {
			getDays() {
				if (!this.query.start_time.length) return true
				const day = 24 * 60 * 60 * 1000
				const [start, end] = this.query.start_time
				const lessTwoDay = end - start >= day
				return lessTwoDay
			},
			useDatetimePicker() {
				this.currentDateTab = -1
			},
			changeAppid(id) {
				this.getChannelData(id, false)
			},
			changePlatform(id, index, name, item) {
				this.getChannelData(null, id)
				this.query.version_id = 0
				this.query.uni_platform = item.code
			},
			changeTimeRange(id, index) {
				this.currentDateTab = index
				const day = 24 * 60 * 60 * 1000
				let start, end
				start = getTimeOfSomeDayAgo(id)
				if (!id) {
					end = getTimeOfSomeDayAgo(0) + day - 1
				} else {
					end = getTimeOfSomeDayAgo(0) - 1
				}
				this.query.start_time = [start, end]
			},
			changeDimensionTab(dimension, index){
				this.currentDimensionTab = index;
				this.query.dimension = dimension;
			},
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTabelData(this.query)
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTabelData(this.query)
			},

			changeChartTab(id, index, name) {
				this.tabIndex = index
				this.getChartData(this.query, id, name)
			},

			getAllData(query) {
				if (!query.appid) {
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				this.getPanelData()
				this.getChartData(query)
				this.getTabelData(query)
			},

			getChartData(query, field = this.chartTabs[this.tabIndex]._id, name = this.chartTabs[this.tabIndex].name) {
				// this.chartData = {}
				query = stringifyQuery(query, true, ['uni_platform'])
				const dimension = this.query.dimension
				//console.log('query: ', query, this.query.dimension)
				const db = uniCloud.database()
				db.collection(this.tableName)
					.where(query)
					.field(`${stringifyField(fieldsMap, field)}, start_time`)
					.groupBy('start_time')
					.groupField(stringifyGroupField(fieldsMap, field))
					.orderBy('start_time', 'asc')
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						const options = {
							categories: [],
							series: [{
								name,
								data: []
							}]
						}
						let mapper = fieldsMap.filter(f => f.field === field)
						mapper = JSON.parse(JSON.stringify(mapper))
						delete mapper[0].value
						mapper[0].formatter = ''
						for (const item of data) {
							mapfields(mapper, item, item)
							const x = formatDate(item.start_time, dimension)
							let y = item[field]
							options.series[0].data.push(y)
							options.categories.push(x)
						}
						this.chartData = options
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			getTabelData(query) {
				const {
					pageCurrent
				} = this.options
				query = stringifyQuery(query, true, ['uni_platform'])
				console.log('query: ', query)
				this.options.pageCurrent = 1 // 重置分页
				this.loading = true
				const db = uniCloud.database()
				db.collection(this.tableName)
					.where(query)
					.field(stringifyField(fieldsMap))
					.groupBy('start_time')
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('start_time', 'desc')
					.skip((pageCurrent - 1) * this.options.pageSize)
					.limit(this.options.pageSize)
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						for (const item of data) {
							let date = item.start_time
							if (date) {
								const dimension = this.query.dimension
								item.start_time = formatDate(date, dimension)
							}
							mapfields(fieldsMap, item, item)
						}
						this.tableData = []
						this.options.total = count
						this.tableData = data
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			getPanelData() {
				let cloneQuery = JSON.parse(JSON.stringify(this.query))
				//cloneQuery.dimension = 'day'
				let query = stringifyQuery(cloneQuery, false, ['uni_platform'])
				const db = uniCloud.database()
				const subTable = db.collection(this.tableName)
					.where(query)
					.field(`${stringifyField(fieldsMap)},stat_date`)
					.groupBy('appid')
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('stat_date', 'desc')
					.get()
					.then(res => {
						const item = res.result.data[0]
						item && (item.total_devices = 0)
						getFieldTotal.call(this, cloneQuery)
						this.panelData = []
						this.panelData = mapfields(fieldsMap, item)
					})
			},

			navTo(id) {
				const url = `/pages/uni-stat/overview/overview?id=${id}`
				uni.navigateTo({
					url
				})
			},

			//获取渠道信息
			getChannelData(appid, platform_id) {
				this.query.channel_id = ''
				const db = uniCloud.database()
				const condition = {}
				//对应应用
				appid = appid ? appid : this.query.appid
				if (appid) {
					condition.appid = appid
				}
				//对应平台
				platform_id = platform_id ? platform_id : this.query.platform_id
				if (platform_id) {
					condition.platform_id = platform_id
				}

				let platformTemp = db.collection('uni-stat-app-platforms')
					.field('_id, name')
					.getTemp()

				let channelTemp = db.collection('uni-stat-app-channels')
					.where(condition)
					.field('_id, channel_name, create_time, platform_id')
					.getTemp()

				db.collection(channelTemp, platformTemp)
					.orderBy('platform_id', 'asc')
					.get()
					.then(res => {
						let data = res.result.data
						let channels = []
						if (data.length > 0) {
							let channelName
							for (let i in data) {
								channelName = data[i].channel_name ? data[i].channel_name : '默认'
								if (data[i].platform_id.length > 0) {
									channelName = data[i].platform_id[0].name + '-' + channelName
								}
								channels.push({
									value: data[i]._id,
									text: channelName
								})
							}
						}
						this.channelData = channels
					})
					.catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {})

			}
		}

	}
</script>

<style>

</style>
