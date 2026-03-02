<template>
	<!-- 对应页面：渠道（app）  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="uni-sub-title hide-on-phone">
					<uni-link href="https://ask.dcloud.net.cn/article/35974"
						text="支持Android App多渠道统计。设置App渠道包的方法，请参考 https://ask.dcloud.net.cn/article/35974。"></uni-link>
				</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :storage="false" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform-channel" :all="false" v-model="query.platform_id" @change="changePlatform" />
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x" style="padding: 15px 0;">
				<uni-stat-panel :items="panelData" class="uni-stat-panel" />
				<uni-stat-tabs type="box" v-model="chartTab" :tabs="chartTabs" class="mb-l" @change="changeChartTab" />
				<view class="uni-charts-box">
					<qiun-data-charts type="area" :chartData="chartData" echartsH5 echartsApp
						tooltipFormat="tooltipCustom" :errorMessage="errorMessage"/>
				</view>
			</view>

			<view class="uni-stat--x p-m">
				<view class="mb-m">
					<uni-link color="" href="https://ask.dcloud.net.cn/article/35974" text="如何自定义渠道包?"></uni-link>
				</view>
				<uni-table :loading="loading" border stripe :emptyText="errorMessage || $t('common.empty')">
					<uni-tr>
						<block v-for="(mapper, index) in fieldsMap.slice(0, fieldsMap.length-1)" :key="index">
							<uni-th v-if="mapper.title" :key="index" align="center">
								{{mapper.title}}
							</uni-th>
						</block>
					</uni-tr>
					<uni-tr v-for="(item ,i) in tableData" :key="i">
						<block v-for="(mapper, index) in fieldsMap.slice(0, fieldsMap.length-1)" :key="index">
							<uni-td v-if="mapper.title && index === 1" :key="mapper.field" class="uni-stat-edit--x">
								{{item[mapper.field] ? item[mapper.field] : '-'}}
								<uni-icons type="compose" color="#2979ff" size="25" class="uni-stat-edit--btn"
									@click="inputDialogToggle(item.channel_code, item.channel_name)" />
							</uni-td>
							<uni-td v-else="mapper.title" :key="mapper.field" align="center">
								{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
							</uni-td>
						</block>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon show-page-size :page-size="paginationOptions.pageSize"
						:current="paginationOptions.pageCurrent" :total="paginationOptions.total"
						@change="changePageCurrent" @pageSizeChange="changePageSize" />
				</view>
			</view>
		</view>
		<uni-popup ref="inputDialog" type="dialog" :maskClick="true">
			<uni-popup-dialog ref="inputClose" mode="input" title="请编辑名称" v-model="updateValue" placeholder="请输入内容"
				@confirm="editName"></uni-popup-dialog>
		</uni-popup>

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
				// 字段映射表
				fieldsMap,
				// 查询参数
				query: {
					// 统计范围 day:按天统计，hour:按小时统计
					dimension: "day",
					// 应用id
					appid: '',
					// 平台
					uni_platform: 'android',
					// 平台id
					platform_id: '',
					// 版本号
					version_id: '',
					// 开始时间
					start_time: [],
				},
				// 分页数据
				paginationOptions: {
					pageSize: 20,
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
				},
				// 加载状态
				loading: false,
				// 日期选择索引
				currentDateTab: 1,
				days: 0,
				// 表格数据
				tableData: [],
				panelData: fieldsMap.filter(f => f.hasOwnProperty('value')),
				chartData: {},
				chartTab: 'new_device_count',
				queryId: '',
				updateValue: '',
				errorMessage: ""
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
					type: 'native_app'
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
					this.paginationOptions.pageCurrent = 1 // 重置分页
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
				this.paginationOptions.pageCurrent = e.current
				this.getTableData()
			},

			changePageSize(pageSize) {
				this.paginationOptions.pageSize = pageSize
				this.paginationOptions.pageCurrent = 1 // 重置分页
				this.getTableData()
			},

			changeChartTab(id, index, name) {
				this.getChartData(id, name)
			},

			getAllData(query) {
				if (!this.query.appid){
					this.errorMessage = "请先选择应用";
					return;
				}
				this.errorMessage = "";
				this.getPanelData();
				this.getChartData();
				this.getTableData();
			},

			getChartData(field = this.chartTab) {
				// this.chartData = {}
				let querystr = stringifyQuery(this.query, false, ['uni_platform'])
				const {
					pageCurrent
				} = this.paginationOptions
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(querystr)
					.field(`${stringifyField(fieldsMap, field)}, start_time, channel_id`)
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
								// TODO 需要做个排序，暂时排序还是有问题的
								// allChannels = allChannels.sort((a,b)=>{ return a.channel_code.localeCompare(b.channel_code)})
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

							options.series = options.series.sort((a, b) => {
								return a.name.localeCompare(b.name)
							})
							this.chartData = options
						})
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {})
			},

			getChannels() {
				const db = uniCloud.database()
				return db.collection('uni-stat-app-channels').where(stringifyQuery({
					appid: this.query.appid,
					platform_id: this.query.platform_id
				})).get()
			},

			getTableData() {
				const query = stringifyQuery(this.query, false, ['uni_platform'])
				const {
					pageCurrent
				} = this.paginationOptions
				this.loading = true
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(query)
					.field(`${stringifyField(fieldsMap)},appid, channel_id`)
					.groupBy('appid, channel_id')
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('new_device_count', 'desc')
					.skip((pageCurrent - 1) * this.paginationOptions.pageSize)
					.limit(this.paginationOptions.pageSize)
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
								mapfields(fieldsMap, item, item, 'total_')
							}
							this.tableData = []
							this.paginationOptions.total = count
							this.tableData = data
							this.loading = false
						})

					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
						this.loading = false
					})
			},

			createStr(maps, fn, prefix = 'total_') {
				const strArr = []
				maps.forEach(mapper => {
					if (field.hasOwnProperty('value')) {
						const fieldName = mapper.field
						strArr.push(`${fn}(${fieldName}) as ${prefix + fieldName}`)
					}
				})
				return strArr.join()
			},

			getPanelData() {
				let query = JSON.parse(JSON.stringify(this.query))
				query.dimension = 'day'
				// let query = stringifyQuery(cloneQuery)
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

			inputDialogToggle(queryId, updateValue) {
				this.queryId = queryId
				this.updateValue = updateValue
				this.$refs.inputDialog.open()
			},

			editName(value) {
				// 使用 clientDB 提交数据
				const db = uniCloud.database()
				db.collection('uni-stat-app-channels')
					.where({
						channel_code: this.queryId
					})
					.update({
						channel_name: value
					})
					.then((res) => {
						uni.showToast({
							title: '修改成功'
						})
						this.getTableData()
					}).catch((err) => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					}).finally(() => {
						uni.hideLoading()
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

	.uni-stat-edit--x {
		display: flex;
		justify-content: space-between;
	}

	.uni-stat-edit--btn {
		cursor: pointer;
	}
</style>
