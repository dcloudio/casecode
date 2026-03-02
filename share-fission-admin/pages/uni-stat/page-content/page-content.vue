<template>
	<!-- 对应页面： 内容统计 -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">

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
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
			</view>
			<uni-stat-panel :items="panelData" />
			<view class="uni-stat--x p-m">
				<view class="uni-stat-right-btn">
					<button type="primary" size="mini" @click="pageTo('/pages/uni-stat/page-rule/page-rule')">页面规则</button>
				</view>
				<uni-table :loading="loading" border stripe :emptyText="errorMessage || $t('common.empty')">
					<uni-tr>
						<block v-for="(mapper, index) in fieldsMap" :key="index">
							<uni-th v-if="mapper.title" :key="index" align="center">
								<!-- #ifdef MP -->
								{{mapper.title}}
								<!-- #endif -->
								<!-- #ifndef MP -->
								<uni-tooltip>
									{{mapper.title}}
									<uni-icons v-if="index === 0 && mapper.tooltip" type="help" color="#666" />
									<template v-if="index === 0 && mapper.tooltip" v-slot:content>
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
							<uni-td v-if="index === 1" :key="mapper.field" class="uni-stat-edit--x">
								{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								<uni-icons type="compose" color="#2979ff" size="25" class="uni-stat-edit--btn"
									@click="inputDialogToggle(item.page_link, item.page_title)" />
							</uni-td>
							<uni-td v-else :key="mapper.field" :align="index === 0 ? 'left' : 'center'">
								{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
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
		getTimeOfSomeDayAgo,
		division,
		format,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import fieldsMap from './fieldsMap.js'
	export default {
		data() {
			return {
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
				tableData: [],
				panelData: fieldsMap.filter(f => f.hasOwnProperty('value')),
				queryId: '',
				updateValue: '',
				channelData: [],
				errorMessage: ''
			}
		},
		computed: {
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
			this.debounceGet = debounce(() => this.getAllData())
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
			pageTo(url){
				uni.redirectTo({
					url
				})
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
				const start = getTimeOfSomeDayAgo(id),
					end = getTimeOfSomeDayAgo(0) - 1
				this.query.start_time = [start, end]
			},
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTableData(this.query)
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTableData()
			},

			getAllData() {
				this.getPanelData()
				this.getTableData()
			},

			getTableData(query) {
				if (!this.query.appid){
					this.errorMessage = "请先选择应用";
					return;
				}
				this.errorMessage = "";
				query = stringifyQuery(this.query, null, ['uni_platform'])
				const {
					pageCurrent
				} = this.options
				this.loading = true
				const db = uniCloud.database()
				const filterAppid = stringifyQuery({
					appid: this.query.appid
				})
				const mainTableTemp = db.collection('uni-stat-page-details')
					.where(filterAppid)
					.getTemp()
				const subTableTemp = db.collection('uni-stat-page-detail-result')
					.where(query)
					.getTemp()

				db.collection(subTableTemp, mainTableTemp)
					.field(
						`${stringifyField(fieldsMap)}, stat_date, page_detail_id`
					)
					.groupBy("page_detail_id")
					.groupField(stringifyGroupField(fieldsMap))
					.orderBy('visit_times desc')
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
						this.options.total = count
						this.tableData = []
						for (const item of data) {
							const lines = item.page_detail_id
							if (Array.isArray(lines)) {
								delete(item.page_detail_id)
								const line = lines[0]
								if (line && Object.keys(line).length) {
									for (const key in line) {
										if (key !== '_id') {
											item[key] = line[key]
										}
									}

								}
							}
							mapfields(fieldsMap, item, item)
							this.tableData.push(item)
						}
					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			getPanelData(query = stringifyQuery(this.query, null, ['uni_platform'])) {
				let myFieldsMap = JSON.parse(JSON.stringify(fieldsMap));
				// 去除myFieldsMap中的visit_devices字段
				myFieldsMap = myFieldsMap.filter(item => item.field !== 'visit_devices');
				const db = uniCloud.database()
				const subTable = db.collection('uni-stat-page-detail-result')
					.where(query)
					.field(stringifyField(myFieldsMap))
					.groupBy('appid')
					.groupField(stringifyGroupField(myFieldsMap))
					.orderBy('start_time desc')
					.get()
					.then(res => {
						const items = res.result.data[0]
						this.panelData = []
						this.panelData = mapfields(myFieldsMap, items)
					})
			},

			inputDialogToggle(url, title) {
				this.queryId = url
				this.updateValue = title
				this.$refs.inputDialog.open()
			},
			// 修改页面名称
			editName(value="") {
				// 使用 clientDB 提交数据
				const db = uniCloud.database()
				uni.showLoading({
					title: '请求中...'
				})
				db.collection('uni-stat-page-details')
					.where({
						page_link: this.queryId
					})
					.update({
						page_title: value.trim()
					})
					.then((res) => {
						if (res.result.updated) {
							uni.showToast({
								title: '修改成功'
							})
							this.getTableData()
						} else {
							uni.showToast({
								title: '修改失败',
								icon: "none"
							})
						}
					}).catch((err) => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					}).finally(() => {
						uni.hideLoading()
					})
			},
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
					.orderBy('platform_id asc')
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
		},

	}
</script>

<style>
	.uni-stat-edit--x {
		display: flex;
		justify-content: space-between;
	}

	.uni-stat-edit--btn {
		cursor: pointer;
	}

	.uni-stat-right-btn{
		text-align: right;margin-bottom: 10px;
	}
</style>
