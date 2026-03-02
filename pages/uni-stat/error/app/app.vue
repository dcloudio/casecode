<template>
	<!-- 对应页面： app崩溃 -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group hide-on-phone">
				<view class="uni-sub-title">开发者可以在这里快速查询原生应用最近出现的具体崩溃内容，了解崩溃概况信息，以便快速修复问题</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select ref="app-versions" collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
				<uni-stat-tabs label="平台选择" type="boldLine" :all="false" mode="platform-channel" v-model="query.platform_id" @change="changePlatform" />
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" :yesterday="false" mode="date" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x" style="padding: 15px 0;">
				<uni-stat-panel :items="panelData" class="uni-stat-panel" />
				<uni-stat-tabs type="box" v-model="chartTab" :tabs="chartTabs" class="mb-l" />
				<view class="uni-charts-box">
					<qiun-data-charts type="area" :chartData="chartData" :eopts="{notMerge:true}" echartsH5 echartsApp tooltipFormat="tooltipCustom" :errorMessage="errorMessage"/>
				</view>
			</view>

			<view class="uni-stat--x p-m">
				<view class="flex-between">
					<view class="uni-stat-card-header">信息列表</view>
					<view class="uni-group">
						<!-- #ifdef H5 -->
						<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
							:type="exportExcel.type" :name="exportExcel.filename">
							<button class="uni-button" type="primary" size="mini">导出 Excel</button>
						</download-excel>
						<!-- #endif -->
					</view>
				</view>

				<unicloud-db ref="udb" :collection="collectionList"
					field="appid,version,platform,channel,sdk_version,device_id,device_net,device_os,device_os_version,device_vendor,device_model,device_is_root,device_os_name,device_batt_level,device_batt_temp,device_memory_use_size,device_memory_total_size,device_disk_use_size,device_disk_total_size,device_abis,app_count,app_use_memory_size,app_webview_count,app_use_duration,app_run_fore,package_name,package_version,page_url,error_msg,create_time"
					:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
					:page-current="options.pageCurrent" loadtime="manual"
					v-slot:default="{data,pagination,loading,error,options}" :options="options" @load="onqueryload">
					<uni-table ref="table" :loading="loading" border stripe :emptyText="errorMessage || $t('common.empty')"
						style="overflow-y: scroll;">
						<uni-tr>
							<block v-for="(mapper, index) in fieldsMap" :key="index">
								<uni-th v-if="mapper.title" :key="index" align="center"
									:style="{'minWidth':`${mapper.title.length * 15 + 80}px`}">
									<!-- #ifdef MP -->
									{{mapper.title}}
									<!-- #endif -->
									<!-- #ifndef MP -->
									<uni-tooltip>
										{{mapper.title}}
										<uni-icons v-if="mapper.tooltip" type="help" color="#666" />
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
						<uni-tr v-for="(item ,i) in tableData" :key="i">
							<block v-for="(mapper, index) in fieldsMap" :key="index">
								<uni-td v-if="mapper.field === 'error_msg'" :key="mapper.field" align="left"
									style="min-width: 500px;">
									<!-- #ifdef MP -->
									{{item.error_msg ? item.error_msg.substring(0, 100) + '...' : '-'}}
									<!-- #endif -->
									<!-- #ifndef MP -->
									<uni-tooltip>
										{{item.error_msg ? item.error_msg.substring(0, 100) + '...' : ''}}
										<uni-icons v-if="item.error_msg" type="help" color="#666" />
										<template v-if="item.error_msg" v-slot:content>
											<view class="uni-stat-tooltip-l">
												{{item.error_msg}}
											</view>
										</template>
									</uni-tooltip>
									<!-- #endif -->
								</uni-td>
								<uni-td v-else-if="mapper.field === 'create_time'" :key="mapper.field" align="center">
									<uni-dateformat :threshold="[0, 0]" :date="item.create_time"></uni-dateformat>
								</uni-td>
								<uni-td v-else :key="mapper.field" align="center">
									{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								</uni-td>
							</block>
						</uni-tr>
					</uni-table>
					<view class="uni-pagination-box">
						<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
							:total="pagination.count" @change="onPageChanged" />
					</view>
				</unicloud-db>
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
		formatDate,
		parseDateTime,
		debounce,
		getAllDateCN
	} from '@/js_sdk/uni-stat/util.js'
	import {
		fieldsMap,
	} from './fieldsMap.js'

	const panelOption = [{
		title: '崩溃总数',
		field: 'count',
		value: 0,
		formatter: ',',
		tooltip: '指原生应用在某个时间段内出现崩溃的总数'
	}, {
		title: '崩溃率',
		field: 'count/app_launch_count',
		computed: 'count/app_launch_count',
		formatter: '%',
		value: 0,
		tooltip: '时间范围内的总崩溃数/原生应用启动次数，如果小于0.01%，默认显示为0'
	}]

	import {
		enumConverter,
		filterToWhere
	} from '@/js_sdk/validator/uni-stat-app-crash-logs.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'create_time desc' // 排序字段
	const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	const orderByMapping = {
		"ascending": "asc",
		"descending": "desc"
	}

	export default {
		data() {
			return {
				fieldsMap,
				//todo：要与schema 生成页面一起工作，stringifyQuery 需要与 schema 查询逻辑相容
				query: {
					type: "crash",
					dimension: "day",
					appid: "",
					platform_id: '',
					uni_platform: '',
					version_id: '',
					start_time: [],
				},
				loading: false,
				popupLoading: false,
				currentDateTab: 0,
				// currentChartTab: ,
				tableData: [],
				popupTableData: [],
				panelData: JSON.parse(JSON.stringify(panelOption)),
				chartData: {},
				chartTab: 'errorCount',
				chartTabs: [{
					_id: 'errorCount',
					name: '崩溃次数'
				}, {
					_id: 'errorRate',
					name: '崩溃率'
				}],

				collectionList: "uni-stat-app-crash-logs",
				schemaQuery: '',
				where: this.tableData,
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				options: {
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
					pageSizeIndex: 0, // 与 pageSizeRange 一起计算得出 pageSize
					pageSizeRange: [10, 20, 50, 100],
					pageSize,
					pageCurrent,
					filterData: {},
					...enumConverter
				},
				errorMessage: "",
				exportExcel: {
					"filename": "uni-stat-app-crash-logs.xls",
					"type": "xls",
					"fields": {
						"appid": "appid",
						"version": "version",
						"platform": "platform",
						"channel": "channel",
						"sdk_version": "sdk_version",
						"device_id": "device_id",
						"device_net": "device_net",
						"device_os": "device_os",
						"device_os_version": "device_os_version",
						"device_vendor": "device_vendor",
						"device_model": "device_model",
						"device_is_root": "device_is_root",
						"device_os_name": "device_os_name",
						"device_batt_level": "device_batt_level",
						"device_batt_temp": "device_batt_temp",
						"device_memory_use_size": "device_memory_use_size",
						"device_memory_total_size": "device_memory_total_size",
						"device_disk_use_size": "device_disk_use_size",
						"device_disk_total_size": "device_disk_total_size",
						"device_abis": "device_abis",
						"app_count": "app_count",
						"app_use_memory_size": "app_use_memory_size",
						"app_webview_count": "app_webview_count",
						"app_use_duration": "app_use_duration",
						"app_run_fore": "app_run_fore",
						"package_name": "package_name",
						"package_version": "package_version",
						"page_url": "page_url",
						"error_msg": "error_msg",
						"create_time": "create_time"
					}
				},
				exportExcelData: []
			}
		},
		computed: {
			queryStr() {
				return stringifyQuery(this.query)
			},
			tableQuery() {
				const {
					appid,
					platform_id,
					version_id,
					start_time
				} = this.query

				// 从本地存储中取到数据做过滤
				const platform = this.getPlatform(platform_id);
				const version = this.getVersion(version_id);

				const query = stringifyQuery({
					appid,
					create_time: start_time,
					platform: platform,
					version: version
				})
				//console.log('query: ', query)
				return query
			},
			versionQuery() {
				const {
					appid,
					uni_platform
				} = this.query
				const query = stringifyQuery({
					appid,
					uni_platform,
					type: 'native_app'
				})
				//console.log('query: ', query)
				return query
			}
		},
		created() {
			this.debounceGet = debounce(() => {
				this.getAllData(this.queryStr)
				this.where = this.tableQuery
				this.$nextTick(() => {
					this.$refs.udb && this.$refs.udb.loadData()
				}, 200)
			},300);
			this.debounceGet();
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.options.pageCurrent = 1 // 重置分页
					this.debounceGet()
				}
			},
			chartTab(val) {
				this.getChartData(this.queryStr)
			}
		},
		onLoad() {
			this._filter = {}
		},
		methods: {
			onqueryload(data) {
				this.exportExcelData = data
				this.tableData = data
			},
			getWhere() {
				const query = this.schemaQuery.trim()
				if (!query) {
					return ''
				}
				const queryRe = new RegExp(query, 'i')
				return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
			},
			loadData(clear = true) {
				this.$refs.udb.loadData({
					clear
				})
			},
			onPageChanged(e) {
				this.selectedIndexs.length = 0
				this.$refs.table.clearSelection()
				this.$refs.udb.loadData({
					current: e.current
				})
			},
			sortChange(e, name) {
				this.orderByFieldName = name;
				if (e.order) {
					this.orderby = name + ' ' + orderByMapping[e.order]
				} else {
					this.orderby = ''
				}
				this.$refs.table.clearSelection()
				this.$nextTick(() => {
					this.$refs.udb.loadData()
				})
			},
			filterChange(e, name) {
				this._filter[name] = {
					type: e.filterType,
					value: e.filter
				}
				let newWhere = filterToWhere(this._filter, db.command)
				if (Object.keys(newWhere).length) {
					this.where = newWhere
				} else {
					this.where = ''
					// this.where = this.tableQuery
				}
				this.$nextTick(() => {
					this.$refs.udb.loadData()
				})
			},
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

			getPlatform(platform_id){
				const statTabsData = uni.getStorageSync('uni-admin-statTabsData');
				const platforms = statTabsData["platform-channel"];
				const p = Array.isArray(platforms) && platforms.find(p => p._id === platform_id)
				return p && p.code || '';
			},
			getVersion(version_id){
				let versions = [];
				if (this.$refs["app-versions"] && typeof this.$refs["app-versions"].getLoadData === "function") {
					versions = this.$refs["app-versions"].getLoadData();
				}
				const v = Array.isArray(versions) && versions.find(v => v._id === version_id);
				return v && v.text || '';
			},

			getAllData(query) {
				if (query.indexOf("appid") === -1) {
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				this.getPanelData(query)
				this.getChartData(query)
			},

			getPanelData(query) {
				let querystr = stringifyQuery(this.query, false, ['uni_platform'])
				const db = uniCloud.database()
				db.collection('uni-stat-error-result')
					.where(querystr)
					.field('count as temp_count, app_launch_count as temp_app_launch_count, appid')
					.groupBy('appid')
					.groupField('sum(temp_count) as count, sum(temp_app_launch_count) as app_launch_count')
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						const item = res.result.data[0] || {count:0,app_launch_count:0}
						// this.panelData = []
						let queryTemp = Object.assign({}, this.query)
						delete queryTemp.type
						this.getTotalLaunch(stringifyQuery(queryTemp, false, ['uni_platform'])).then(res => {
							const total = res.result.data[0]
							if (item) {
								let launch_count = total && total.total_app_launch_count
								item.app_launch_count = launch_count
								this.panelData = mapfields(panelOption, item)
							}
						})
					})
			},
			getTotalLaunch(query) {
				const db = uniCloud.database()
				return db.collection('uni-stat-result')
					.where(query)
					.groupBy('appid')
					.groupField('sum(app_launch_count) as total_app_launch_count')
					.get()
			},
			getChartData(query, field = 'day_count') {
				let querystr = stringifyQuery(this.query, false, ['uni_platform'])
				this.chartData = {}
				const {
					pageCurrent
				} = this.options
				const db = uniCloud.database()
				const [start_time, end_tiem] = this.query.start_time
				// 时间补全
				const timeAll = getAllDateCN(new Date(start_time), new Date(end_tiem))

				db.collection('uni-stat-error-result')
					.where(querystr)
					.field('count as temp_count, app_launch_count as temp_app_launch_count, start_time')
					.groupBy('start_time')
					.groupField('sum(temp_count) as count, sum(temp_app_launch_count) as app_launch_count')
					.orderBy('start_time', 'asc')
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						let dataAll = []
						timeAll.forEach(v => {
							let item = data.find(item => item.start_time === v)
							if (item) {
								dataAll.push(item)
							} else {
								dataAll.push({
									app_launch_count: 0,
									count: 0,
									start_time: v
								})
							}
						})


						const options = {
							categories: [],
							series: [{
								name: '暂无数据',
								data: []
							}]
						}
						if (this.chartTab === 'errorCount') {
							const countLine = options.series[0] = {
								name: '崩溃次数',
								data: []
							}
							const xAxis = options.categories
							for (const item of dataAll) {
								let date = item.start_time
								const x = formatDate(date, 'day')
								const countY = item.count
								xAxis.push(x)
								countLine.data.push(countY)
							}
							this.chartData = options
						} else {
							const rateLine = options.series[0] = {
								name: '崩溃率(%)',
								data: [],
								lineStyle: {
									color: '#EE6666',
									width: 1,
								},
								itemStyle: {
									borderWidth: 1,
									borderColor: '#EE6666',
									color: '#EE6666'
								},
								areaStyle: {
									color: {
										colorStops: [{
											offset: 0,
											color: '#EE6666', // 0% 处的颜色
										}, {
											offset: 1,
											color: '#FFFFFF' // 100% 处的颜色
										}]
									}
								}
							}
							const xAxis = options.categories
							for (const item of dataAll) {
								const {
									count,
									app_launch_count
								} = item
								let date = item.start_time
								const x = formatDate(date, 'day')
								xAxis.push(x)
								let y = count / app_launch_count
								y = !y ? 0 : y.toFixed(2)
								rateLine.data.push(y)
							}
							this.chartData = options
						}
					}).finally(() => {})
			}
		}

	}
</script>

<style>
	.flex-between {
		margin-bottom: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.uni-stat-panel {
		box-shadow: unset;
		border-bottom: 1px solid #eee;
		padding: 0;
		margin: 0 15px;
	}

	.uni-stat-tooltip-s {
		width: 160px;
		white-space: normal;
	}
</style>
