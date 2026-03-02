<template>
	<!-- 对应页面：设备统计-概况  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" :today="true" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time" returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker" :class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}" @change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform" />
				<uni-data-select v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
			</view>
			<uni-stat-panel :items="panelData" :contrast="true" />
			<view class="uni-stat--x p-m">
				<view class="uni-stat-card-header">
					趋势图
				</view>
				<uni-stat-tabs type="box" v-model="chartTab" :tabs="chartTabs" class="mb-l" @change="changeChartTab" />
				<view class="uni-charts-box">
					<qiun-data-charts type="area" :chartData="chartData" :eopts="eopts" echartsH5 echartsApp tooltipFormat="tooltipCustom" :errorMessage="errorMessage"/>
				</view>
			</view>

			<view class="dispaly-grid">
				<view class="uni-stat--x p-m">
					<view class="uni-stat-card-header">
						<view>受访页 TOP10</view>
						<view class="uni-stat-card-header-link" @click="navTo('/pages/uni-stat/page-res/page-res')">查看更多
						</view>
					</view>
					<uni-table :loading="loading" border stripe emptyText="暂无数据">
						<uni-tr>
							<block v-for="(mapper, index) in resFieldsMap" :key="index">
								<uni-th v-if="mapper.title" :key="index" align="center">
									<!-- #ifdef MP -->
									{{mapper.title}}
									<!-- #endif -->
									<!-- #ifndef MP -->
									<uni-tooltip>
										{{mapper.title}}
										<uni-icons v-if=" mapper.tooltip" type="help" color="#666" />
										<template v-if="mapper.tooltip" v-slot:content>
											<view class="uni-stat-tooltip-s">
												{{mapper.tooltip}}
											</view>
										</template>
									</uni-tooltip>
									<!-- #endif -->
								</uni-th>
							</block>
						</uni-tr>
						<uni-tr v-for="(item ,i) in resTableData" :key="i">
							<block v-for="(mapper, index) in resFieldsMap" :key='index'>
								<uni-td v-if="mapper.title" :key="index" :align="index === 0 ? 'left' : 'center'">
									{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								</uni-td>
							</block>
						</uni-tr>
					</uni-table>
				</view>
				<view class="uni-stat--x uni-stat-card p-m">
					<view class="uni-stat-card-header">
						<view>入口页 TOP10</view>
						<view class="uni-stat-card-header-link" @click="navTo('/pages/uni-stat/page-ent/page-ent')">查看更多
						</view>
					</view>
					<uni-table :loading="loading" border stripe emptyText="暂无数据">
						<uni-tr>
							<block v-for="(mapper, index) in entFieldsMap" :key="index">
								<uni-th v-if="mapper.title" :key="index" align="center">
									<!-- #ifdef MP -->
									{{mapper.title}}
									<!-- #endif -->
									<!-- #ifndef MP -->
									<uni-tooltip>
										{{mapper.title}}
										<uni-icons v-if=" mapper.tooltip" type="help" color="#666" />
										<template v-if="mapper.tooltip" v-slot:content>
											<view class="uni-stat-tooltip-s">
												{{mapper.tooltip}}
											</view>
										</template>
									</uni-tooltip>
									<!-- #endif -->
								</uni-th>
							</block>
						</uni-tr>
						<uni-tr v-for="(item ,i) in entTableData" :key="i">
							<block v-for="(mapper, index) in entFieldsMap" :key="index">
								<uni-td v-if="mapper.title" :key="index" :align="index === 0 ? 'left' : 'center'">
									{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								</uni-td>
							</block>
						</uni-tr>
					</uni-table>
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
		parseDateTime,
		getFieldTotal,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import {
		fieldsMap,
		resFieldsMap,
		entFieldsMap
	} from './fieldsMap.js'
	const panelOption = fieldsMap.filter(f => f.hasOwnProperty('value'))
	export default {
		data() {
			return {
				tableName: 'uni-stat-result',
				fieldsMap,
				resFieldsMap,
				entFieldsMap,
				query: {
					dimension: 'hour',
					appid: '',
					version_id: '',
					platform_id: '',
					uni_platform:'',
					start_time: [],
					channel_id: ''
				},
				options: {
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
					pageSizeIndex: 0, // 与 pageSizeRange 一起计算得出 pageSize
					pageSizeRange: [10, 20, 50, 100],
				},
				errorMessage: "",
				loading: false,
				currentDateTab: 2,
				chartTab: 'new_user_count',
				tableData: [],
				resTableData: [],
				entTableData: [],
				panelData: panelOption,
				chartData: {},
				eopts: {
					seriesTemplate: [{
						itemStyle: {
							borderWidth: 2,
							borderColor: '#1890FF',
							color: '#1890FF'
						},
						areaStyle: {
							color: {
								colorStops: [{
									offset: 0,
									color: '#1890FF', // 0% 处的颜色
								}, {
									offset: 1,
									color: '#FFFFFF' // 100% 处的颜色
								}]
							}
						}
					}, {
						// smooth: false,
						lineStyle: {
							color: '#ea7ccc',
							width: 2,
							type: 'dashed'
						},
						itemStyle: {
							borderWidth: 1,
							borderColor: '#ea7ccc',
							color: '#ea7ccc'
						},
						areaStyle: null
					}]
				},
				tabIndex: 0,
				tabName: '新增设备',
			}
		},
		onLoad(option) {
			const {
				appid
			} = option
			if (appid) {
				this.query.appid = appid
			}
		},
		computed: {
			pageSize() {
				const {
					pageSizeRange,
					pageSizeIndex
				} = this.options
				return pageSizeRange[pageSizeIndex]
			},
			chartTabs() {
				const tabs = []
				fieldsMap.forEach(item => {
					const _id = item.field
					const name = item.title
					if (_id && name) {
						tabs.push({
							_id,
							name
						})
					}
				})
				return tabs
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
			},
			channelQuery() {
				const {
					appid,
					platform_id,
				} = this.query
				const query = stringifyQuery({
					appid,
					platform_id
				})
				return query
			},
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
					this.options.pageCurrent = 1 // 重置分页
					this.debounceGet()
				}
			}
		},
		methods: {
			useDatetimePicker() {
				this.currentDateTab = null
			},
			changePlatform(id, index, name, item) {
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
				this.getChartData(this.query)
			},

			changePageSize(e) {
				const {
					value
				} = e.detail
				this.options.pageCurrent = 1 // 重置分页
				this.options.pageSizeIndex = value
				this.getChartData(this.query)
			},

			changeChartTab(id, index, name) {
				this.tabIndex = index
				this.tabName = name
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
				this.getPageData(query, 'res')
				this.getPageData(query, 'ent')
			},

			getDays() {
				if (!this.query.start_time.length) return true
				const day = 24 * 60 * 60 * 1000
				const [start, end] = this.query.start_time
				const lessTwoDay = end - start >= day
				return lessTwoDay
			},

			getPanelData() {
				const {
					appid,
					platform_id,
					version_id,
					channel_id
				} = this.query
				let query = stringifyQuery({
					appid,
					platform_id,
					version_id,
					channel_id,
					start_time: [getTimeOfSomeDayAgo(1), new Date().getTime()]
				})
				const db = uniCloud.database()
				const subTable = db.collection(this.tableName)
					.where(query)
					.field(
						`${stringifyField(fieldsMap)},dimension,stat_date`
					)
					.groupBy(`stat_date, dimension`)
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('stat_date', 'desc')
					.get()
					.then(res => {
						const data = res.result.data
						const today = data.find(item => item.stat_date === parseDateTime(getTimeOfSomeDayAgo(0), '',
							'')) || {}
						today.total_devices = 0
						const yesterday = data.find(item => item.dimension === 'day' && item.stat_date ===
							parseDateTime(getTimeOfSomeDayAgo(1), '', ''))
						this.panelData = []
						this.panelData = mapfields(fieldsMap, today)
						this.panelData.map(item => {
							mapfields(fieldsMap, yesterday, item, '', 'contrast')
						})
						getFieldTotal.call(this, query)
					})
			},

			getChartData(query, field = this.chartTabs[this.tabIndex]._id, name = this.chartTabs[this.tabIndex].name) {
				// this.chartData = {}
				const {
					pageCurrent
				} = this.options
				const days = this.currentDateTab
				const date = getTimeOfSomeDayAgo(days)
				const day = 24 * 60 * 60 * 1000
				let start_time
				// 范围小于一天的日期（今日、昨日）做增大一天处理，目的是对比当前日期和前一天（今日和昨日、昨日和上前日）
				if (!this.getDays()) {
					const start = date - day
					const end = date + day - 1
					query = JSON.parse(JSON.stringify(query))
					start_time = query.start_time = [start, end]
					// query.dimension = 'hour'
				}
				query = stringifyQuery(query, true, ['uni_platform'])
				const db = uniCloud.database()
				db.collection(this.tableName)
					.where(query)
					.field(`${stringifyField(fieldsMap, field)}, start_time`)
					.groupBy(`start_time`)
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
						if (!this.getDays()) {
							const [start, end] = start_time
							const line = options.series[1] = {
								name: formatDate(start),
								data: [],
							}
							const cont = options.series[0] = {
								name: formatDate(end),
								data: [],
							}
							for (let i = 0; i < 24; ++i) {
								const hour = i < 10 ? '0' + i : i
								const x = `${hour}:00 ~ ${hour}:59`
								options.categories.push(x)
								line.data[i] = 0
								cont.data[i] = 0
								data.forEach(item => {
									mapfields(mapper, item, item)
									let val = Number(item[field])
									const d = new Date(item.start_time)
									if (item.start_time < date) {
										if (d.getHours() === i) {
											line.data[i] = val
										}
									} else {
										if (d.getHours() === i) {
											cont.data[i] = val
										}
									}
								})
							}
						} else {
							for (const item of data) {
								mapfields(mapper, item, item)
								const x = formatDate(item.start_time, 'day')
								let y = Number(item[field])
								options.series[0].data.push(y)
								options.categories.push(x)
							}
						}
						this.chartData = options
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {})
			},

			getAppAccessTimes(query) {
				const db = uniCloud.database()
				return db.collection(this.tableName)
					.where(query)
					.groupBy('appid')
					.groupField(`sum(page_visit_count) as total_app_access`)
					.get()
			},

			getPageData(query, type) {
				query = JSON.parse(JSON.stringify(query))
				query.dimension = 'day'
				query = stringifyQuery(query,false,['uni_platform'])
				const {
					pageCurrent
				} = this.options
				const mapping = this[`${type}FieldsMap`]
				const field = mapping[1].field
				this.loading = true
				const db = uniCloud.database()
				const filterAppid = stringifyQuery({
					appid: this.query.appid
				})
				const mainTableTemp = db.collection('uni-stat-pages')
					.where(filterAppid)
					.field('_id, title, path')
					.getTemp()
				const subTableTemp = db.collection('uni-stat-page-result')
					.where(`${query} && ${field} > 0`)
					.getTemp()

				db.collection(subTableTemp, mainTableTemp)
					.field(
						`${stringifyField(mapping, field)}, stat_date, page_id`
					)
					.groupBy("page_id")
					.groupField(stringifyGroupField(mapping, field))
					.orderBy(field, 'desc')
					.limit(10)
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						let total_app_access
						this.getAppAccessTimes(query).then(res => {
							const data = res.result.data[0]
							total_app_access = data && data.total_app_access
						}).finally(() => {
							this[`${type}TableData`] = []
							for (const item of data) {
								item.total_app_access = total_app_access
								const lines = item.page_id
								if (Array.isArray(lines)) {
									delete(item.page_id)
									const line = lines[0]
									if (line && Object.keys(line).length) {
										for (const key in line) {
											if (key !== '_id') {
												item[key] = line[key]
											}
										}
									}
								}
								mapfields(mapping, item, item)
								this[`${type}TableData`].push(item)
							}
							this.loading = false
						})
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {})
			},

			navTo(url) {
				if (!url) return
				uni.navigateTo({
					url
				})
			}
		}

	}
</script>

<style>
	.uni-stat-card-header {
		display: flex;
		justify-content: space-between;
		color: #555;
		font-size: 14px;
		font-weight: 600;
		padding: 10px 0;
		margin-bottom: 15px;
	}

	.uni-stat-card-header-link {
		cursor: pointer;
	}

</style>
