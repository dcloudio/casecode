<template>
	<!-- 对应页面：设备统计-留存  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="uni-sub-title hide-on-phone">设备留存趋势分析</view>
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
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" :yesterday="false" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
			</view>
			<view class="uni-stat--x mb-m" style="padding-top: 0;">
				<view class="mb-m line-bottom">
					<uni-stat-tabs type="boldLine" :tabs="fields" v-model="field" tooltip
						style="line-height: 40px; margin-bottom: -17px;" />
				</view>
				<uni-stat-tabs type="box" :tabs="keys" v-model="key" class="mb-l" />
				<view class="p-m">
					<view class="uni-charts-box">
						<qiun-data-charts type="area" :chartData="chartData" echartsH5 echartsApp
							tooltipFormat="tooltipCustom" :errorMessage="errorMessage"/>
					</view>
				</view>
			</view>
			<view class="uni-stat--x p-m">
				<view class="uni-tips mb-s flex">
					<uni-icons type="info"></uni-icons>
					表格中显示为空，表示留存为 0 或无数据
				</view>
				<uni-table :loading="loading" stripe :emptyText="errorMessage || $t('common.empty')">
					<uni-tr style="background-color: #eee;">
						<block v-for="(mapper, index) in fieldsMap" :key="index">
							<uni-th v-if="mapper.title" :key="index" align="center">{{mapper.title}}</uni-th>
						</block>
					</uni-tr>
					<uni-tr v-for="(item ,i) in tableData" :key="i">
						<block v-for="(mapper, index) in fieldsMap" :key="index">
							<uni-td v-if="mapper.title" :key="index" align="center"
								:class="/[d|w|m]_\d/.test(mapper.field)&&[item[mapper.field] ? 'uni-stat-table-bg' : '']">
								{{item[mapper.field] ? item[mapper.field] : ''}}
							</uni-td>
						</block>
					</uni-tr>
				</uni-table>
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
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import fieldsFactory from './fieldsMap.js'
	export default {
		data() {
			return {
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
				tableData: [],
				chartData: {},
				field: 'new_device',
				fields: [{
					_id: 'new_device',
					name: '新增留存',
					tooltip: '指定时间新增（即首次访问应用）用户，在之后的第N天，再次访问应用的用户数占比'
				}, {
					_id: 'active_device',
					name: '活跃留存',
					tooltip: '指定时间活跃（即访问应用）用户，在之后的第N天，再次访问应用的用户数占比'
				}],
				key: 1,
				channelData: [],
				errorMessage: "",
			}
		},
		computed: {
			fieldsMap() {
				const title = this.field === 'active_device' ? '活跃用户' : '新增用户'
				const maps = [{
					title,
					field: `${this.field}_count`,
					stat: 0
				}]
				return fieldsFactory(maps)
			},
			fieldName() {
				let name = ''
				this.fields.forEach(item => {
					if (item._id === this.field) {
						name = item.name
					}
				})
				return name
			},
			keyName() {
				return this.keys.forEach(item => {
					if (item._id === this.key) {
						return item.name
					}
				})
			},
			keys() {
				const values = [1, 2, 3, 4, 5, 6, 7, 14, 30]
				return values.map(val => {
					return {
						_id: val,
						name: `${val}天后`
					}
				})
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
					this.options.pageCurrent = 1 // 重置分页
					this.debounceGet()
				}
			},
			key() {
				this.debounceGet()
			},
			field() {
				this.debounceGet()
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
				const start = getTimeOfSomeDayAgo(id),
					end = getTimeOfSomeDayAgo(0) - 1
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

			// 此处 util 中的 stringifyField 不满足需求，特殊处理 stringifyField
			stringifyField(mapping, goal, prop) {
				if (goal) {
					mapping = mapping.filter(f => f.field === goal)
				}
				if (prop) {
					mapping = mapping.filter(f => f.field && f.hasOwnProperty(prop))
				}
				const fields = mapping.map(f => {
					if (f.stat === -1) {
						return f.field
					} else if (f.stat === 0) {
						return `${f.field} as ${ 'temp_' + f.field}`
					} else {
						return `retention.${this.field}.${f.field}.device_count as ${ 'temp_' + f.field}`
					}
				}).join()
				return fields
			},

			// 此处 util 中的 groupField 不满足需求，特殊处理 groupField
			createStr(type = "device_count", vals, fields, tail) {
				const value = vals || [1, 2, 3, 4, 5, 6, 7, 14, 30]
				const p = 'd'
				const f = this.fields.map(item => item._id)
				fields = fields || f
				const strArr = value.map(item => {
					return fields.map(field => {
						return `retention.${field}.${p + '_' + item}.${type} as ${p + '_' + item}`
					})
				})
				if (tail) {
					strArr.push(tail)
				}
				const str = strArr.join()
				return str
			},

			getAllData(query) {
				if (!this.query.appid){
					this.errorMessage = "请先选择应用";
					return;
				}
				this.errorMessage = "";
				this.getChartData(query, this.key, this.keyName)
				this.getTabelData(query)
			},

			getChartData(query, key = this.key, name = '访问人数') {
				// this.chartData = {}
				const {
					pageCurrent
				} = this.options
				query = stringifyQuery(query, null, ['uni_platform'])
				const groupField = this.createStr("device_count", [key], [this.field])
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(query)
					.field(`${this.stringifyField(this.fieldsMap, `d_${key}`)}, start_time`)
					.groupBy('start_time')
					.groupField(stringifyGroupField(this.fieldsMap, `d_${key}`))
					.orderBy('start_time', 'asc')
					.get({
						getCount: true
					})
					.then(res => {
						let {
							count,
							data
						} = res.result
						const options = {
							categories: [],
							series: [{
								name: `${key}天后${this.fieldName}`,
								data: []
							}]
						}
						for (const item of data) {
							const x = formatDate(item.start_time, 'day')
							const y = item[`d_${key}`]
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
				query = stringifyQuery(query, null, ['uni_platform'])
				const tail = this.field + "_count"
				const groupField = this.createStr('user_rate', '', [this.field], tail)
				this.loading = true
				const db = uniCloud.database()
				db.collection('uni-stat-result')
					.where(query)
					.field(this.stringifyField(this.fieldsMap))
					.groupBy('start_time')
					.groupField(stringifyGroupField(this.fieldsMap))
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
							mapfields(this.fieldsMap, item, item)
						}
						this.options.total = count
						this.tableData = []
						this.tableData = data
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
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

<style lang="scss">
	.flex {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	.label-text {
		font-size: 14px;
		color: #666;
		margin: auto 0;
		margin-right: 5px;
	}

	.line-bottom {
		border-bottom: 2px solid #eee;
	}

	.uni-stat-table-bg {
		background-color: #4e82d9;
		color: #fff;
	}
</style>
