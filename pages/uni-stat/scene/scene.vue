<template>
	<!-- 对应页面：场景值（小程序）  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="uni-sub-title hide-on-phone">
					小程序平台有效。用户打开小程序时的场景，如通过扫描二维码打开小程序，场景为二维码。注意：部分平台可能获取不到场景值，如支付宝小程序</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform-scene" :all="false" v-model="query.platform_id" @change="changePlatform" />
			</view>
			<view class="uni-stat--x" style="padding: 15px 0;">
				<uni-stat-panel :items="panelData" class="uni-stat-panel" />
				<uni-stat-tabs type="box" v-model="chartTab" :tabs="chartTabs" class="mb-l" @change="changeChartTab" />
				<view class="uni-charts-box" style="height: 400px;">
					<qiun-data-charts type="area" :chartData="chartData" echartsH5 echartsApp tooltipFormat="tooltipCustom" :errorMessage="errorMessage"/>
				</view>
			</view>

			<view class="uni-stat--x p-m">
				<uni-stat-table :data="tableData" :filedsMap="fieldsMap.slice(0, fieldsMap.length-1)"
					:loading="loading" />
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
		maxDeltaDay,
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
				fieldsMap,
				query: {
					dimension: "hour",
					appid: '',
					platform_id: '',
					uni_platform: '',
					version_id: '',
					start_time: [],
				},
				options: {
					pageSize: 20,
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
				},
				loading: false,
				currentDateTab: 1,
				tableData: [],
				panelData: fieldsMap.filter(f => f.hasOwnProperty('value')),
				chartData: {},
				chartTab: 'new_device_count',
				errorMessage: "",
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

			queryStr() {
				return stringifyQuery(this.query, true)
			},
			dimension() {
				if (maxDeltaDay(this.query.start_time, 1)) {
					return 'hour'
				} else {
					return 'day'
				}
			},
			versionQuery() {
				const {
					appid,
					uni_platform
				} = this.query
				const query = stringifyQuery({
					appid,
					uni_platform,
					// type: 'native_app'
				})
				return query
			}
		},
		created() {
			this.debounceGet = debounce(() => {
				this.getAllData(this.queryStr);
			}, 300);
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
			changePlatform(id, index, name, item) {
				this.query.version_id = 0
				this.query.uni_platform = item.code
			},
			changeTimeRange(id, index) {
				this.currentDateTab = index
				const start = getTimeOfSomeDayAgo(id),
					end = getTimeOfSomeDayAgo(0) - 1
				this.query.start_time = [start, end]
			},
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTabelData(this.queryStr)
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTabelData(this.queryStr)
			},

			changeChartTab(id, index, name) {
				this.getChartData(this.queryStr, id, name)
			},

			getAllData(query) {
				if (query.indexOf("appid") === -1) {
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				this.getPanelData(query)
				this.getChartData(query)
				this.getTabelData(query)
			},

			getChartData(query, field = this.chartTab) {
				// this.chartData = {}
				const {
					pageCurrent
				} = this.options
				query = JSON.parse(JSON.stringify(this.query))
				query.dimension = 'day'
				let querystr = stringifyQuery(query, false, ['uni_platform'])
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(querystr)
					.field(`${stringifyField(fieldsMap, field)},start_time,channel_id`)
					.groupBy('channel_id,start_time')
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
								name: '暂无数据',
								data: []
							}]
						}
						const xAxis = options.categories
						if (this.dimension === 'hour') {
							for (let i = 0; i < 24; ++i) {
								const hour = i < 10 ? '0' + i : i
								const x = `${hour}:00 ~ ${hour}:59`
								xAxis.push(x)
							}
						}
						// 将数据中渠道 id 去重
						const hasChannels = []
						data.forEach(item => {
							if (hasChannels.indexOf(item.channel_id) < 0) {
								hasChannels.push(item.channel_id)
							}
						})
						// 请求所有渠道数据，与 hasChannels 匹配得出 channel_name
						let allChannels = []
						this.getChannels().then(res => {
							allChannels = res.result.data
						}).finally(() => {
							hasChannels.forEach((channel, index) => {
								const c = allChannels.find(item => item._id === channel)
								const line = options.series[index] = {
									name: c && c.channel_name || '未知',
									data: []
								}
								if (this.dimension === 'hour') {
									for (let i = 0; i < 24; ++i) {
										line.data[i] = 0
									}
								}
								let mapper = fieldsMap.filter(f => f.field === field)
								mapper = JSON.parse(JSON.stringify(mapper))
								delete mapper[0].value
								mapper[0].formatter = ''
								for (const item of data) {
									// 将 item 根据 mapper 计算、格式化
									mapfields(mapper, item, item)
									let date = item.start_time
									const x = formatDate(date, this.dimension)
									let y = item[field]
									const dateIndex = xAxis.indexOf(x)
									if (channel === item.channel_id) {
										if (dateIndex < 0) {
											xAxis.push(x)
											line.data.push(y)
										} else {
											line.data[dateIndex] = y
										}
									}

								}
							})
							this.chartData = options
						})
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			getChannels() {
				const db = uniCloud.database()
				return db.collection('uni-stat-app-channels')
					.get()
			},

			getTabelData(query) {
				const {
					pageCurrent
				} = this.options
				this.loading = true
				let querystr = stringifyQuery(this.query, false, ['uni_platform'])
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(querystr)
					.field(`${stringifyField(fieldsMap)},appid, channel_id`)
					.groupBy('appid, channel_id')
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('new_device_count', 'desc')
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

						this.getChannels().then(res => {
							const channels = res.result.data
							for (const item of data) {
								channels.forEach(channel => {
									if (item.channel_id === channel._id) {
										item.channel_code = channel.channel_code
										item.channel_name = channel.channel_name
									}
								})
							}
						}).finally(() => {
							for (const item of data) {
								mapfields(fieldsMap, item, item)
							}
							this.tableData = []
							this.options.total = count
							this.tableData = data
						})

					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			getPanelData() {
				// let cloneQuery = JSON.parse(JSON.stringify(this.query))
				// cloneQuery.dimension = 'day'
				// let query = stringifyQuery(cloneQuery)
				let query = JSON.parse(JSON.stringify(this.query))
				query.dimension = 'day'
				let querystr = stringifyQuery(query, false, ['uni_platform'])
				const db = uniCloud.database()
				const subTable = db.collection('uni-stat-result')
					.where(querystr)
					.field(stringifyField(fieldsMap))
					.groupBy('appid')
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('start_time', 'desc')
					.get()
					.then(res => {
						const item = res.result.data[0]
						item && (item.total_devices = 0)
						getFieldTotal.call(this, query)
						this.panelData = []
						this.panelData = mapfields(fieldsMap, item)
					})
			},

			navTo(id) {
				const url = `/pages/uni-stat/overview/overview?id=${id}`
				uni.navigateTo({
					url
				})
			}
		}

	}
</script>

<style>
	.uni-stat-panel {
		box-shadow: unset;
		border-bottom: 1px solid #eee;
		padding: 0;
		margin: 0 15px;
	}
</style>
