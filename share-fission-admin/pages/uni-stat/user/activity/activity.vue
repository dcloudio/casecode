<template>
	<!-- 对应页面：注册用户统计-活跃度  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="uni-sub-title hide-on-phone">用户活跃度分析</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" @change="changeAppid" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" :yesterday="false"
					@change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
			</view>
			<view class="uni-stat--x p-m">
				<view class="label-text mb-l">
					趋势图
				</view>
				<uni-stat-tabs type="box" :tabs="chartTabs" class="mb-l" @change="changeChartTab" />
				<view class="uni-charts-box">
					<qiun-data-charts type="area" :chartData="chartData" echartsH5 echartsApp :errorMessage="errorMessage"/>
				</view>
			</view>
			<view class="uni-stat--x p-m">
				<uni-stat-table :data="tableData" :filedsMap="fieldsMap" :loading="loading" tooltip />
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
		maxDeltaDay,
		debounce,
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
				currentDateTab: 0,
				currentChartTab: 'day',
				tableData: [],
				chartData: {},
				defaultChart: {
					field: 'new_user_count',
					name: '新增用户'
				},
				channelData: [],
				errorMessage: "",
			}
		},
		computed: {
			chartTabs() {
				const tabs = [{
					_id: 'day',
					name: '日活'
				}, {
					_id: 'week',
					name: '周活'
				}, {
					_id: 'month',
					name: '月活'
				}]
				if (maxDeltaDay(this.query.start_time, 7)) {
					tabs.forEach((tab, index) => {
						if (tab._id === 'month') {
							tab.disabled = true
						} else {
							tab.disabled = false
						}
					})
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
					uni_platform
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
					this.options.pageCurrent = 1 // 重置分页
					this.debounceGet()
				}
			}
		},
		methods: {
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
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTabelData(this.query)
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTabelData(this.query)
			},

			changeChartTab(type, index, name) {
				this.currentChartTab = type
				this.getChartData(this.query, type, name)
			},

			getAllData(query) {
				if (!query.appid) {
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				this.getChartData(query, this.currentChartTab)
				this.getTabelData(query)
			},

			getChartData(query, type, name = '日活', field = 'active_user_count') {
				// this.chartData = {}
				const options = {
					categories: [],
					series: [{
						name,
						data: []
					}]
				}
				query = stringifyQuery(query, null, ['uni_platform'])
				const db = uniCloud.database()
				if (type === 'day') {
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
							this.chartData = []
							for (const item of data) {
								const x = formatDate(item.start_time, 'day')
								const y = item[field]
								options.series[0].data.push(y)
								options.categories.push(x)
							}
							this.chartData = options
						}).catch((err) => {
							console.error(err)
						})
				} else {
					// 获取周活、月活
					this.getRangeCountData(query, type).then(res => {
						const oldType = type
						if (type === 'week') type = 'isoWeek'
						const {
							count,
							data
						} = res.result
						this.chartData = []
						const wunWeekTime = 7 * 24 * 60 * 60 * 1000
						for (const item of data) {
							const date = +new Date(item.year, 0) + (Number(item[type]) * wunWeekTime - 1)
							const x = formatDate(date, oldType)
							const y = item[type + '_' + field]
							if (y) {
								options.series[0].data.push(y)
								options.categories.push(x)
							}
						}
						this.chartData = options
					})
				}
			},

			getTabelData(query, field = 'active_user_count') {
				const {
					pageCurrent
				} = this.options
				query = stringifyQuery(query, null, ['uni_platform'])
				this.loading = true
				const db = uniCloud.database()
				db.collection(this.tableName)
					.where(query)
					.field(`${stringifyField(fieldsMap, field)}, start_time`)
					.groupBy('start_time')
					.groupField(stringifyGroupField(fieldsMap, field))
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
						let daysData = data,
							daysCount = count,
							weeks = [],
							months = []

						this.getRangeCountData(query, 'week').then(res => {
							const {
								count,
								data
							} = res.result
							weeks = data

							this.getRangeCountData(query, 'month').then(res => {
								const {
									count,
									data
								} = res.result
								months = data

								const allData = this.mapWithWeekAndMonth(daysData, weeks, months)

								for (const item of allData) {
									mapfields(fieldsMap, item, item)
								}
								this.tableData = []
								this.options.total = daysCount
								this.tableData = allData
							}).finally(() => {
								this.loading = false
							})
						})


					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					})
			},

			getRangeCountData(query, type, field = 'active_user_count') {
				if (type === 'week') type = 'isoWeek'
				const {
					pageCurrent
				} = this.options
				const db = uniCloud.database()
				return db.collection(this.tableName)
					.where(query)
					.field(
						`${field}, start_time, ${type}(add(new Date(0),start_time), "Asia/Shanghai") as ${type},year(add(new Date(0),start_time), "Asia/Shanghai") as year`
					)
					.groupBy(`year, ${type}`)
					.groupField(`sum(${field}) as ${type}_${field}`)
					.orderBy(`year asc, ${type} asc`)
					.get({
						getCount: true
					})
			},

			// 周、月范围的处理
			mapWithWeekAndMonth(data, weeks, months, field = 'active_user_count') {
				for (const item of data) {
					const date = new Date(item.start_time)
					const year = date.getUTCFullYear()
					const month = date.getMonth() + 1
					const week = this.getWeekNumber(date)
					for (const w of weeks) {
						if (w.isoWeek === week && w.year === year) {
							item[`isoWeek_${field}`] = w[`week_${field}`]
						}
					}
					for (const m of months) {
						if (m.month === month && m.year === year) {
							item[`month_${field}`] = m[`month_${field}`]
						}
					}
				}

				return data
			},

			//日期所在的周（一年中的第几周）
			getWeekNumber(d) {
				// Copy date so don't modify original
				d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
				// Set to nearest Thursday: current date + 4 - current day number
				// Make Sunday's day number 7
				d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
				// Get first day of year
				let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
				// Calculate full weeks to nearest Thursday
				return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
