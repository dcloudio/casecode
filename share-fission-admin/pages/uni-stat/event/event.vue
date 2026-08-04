<template>
		<!-- 对应页面：事件分析  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<view class="uni-sub-title hide-on-phone">分析用户自定义事件
					<uni-link href="https://ask.dcloud.net.cn/article/36304" text="自定义事件说明>>"></uni-link>
				</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="concat(version, '---',uni_platform) as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" @change="changeVersion"/>
				</view>
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" mode="date" @change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.create_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.create_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="concat(channel_code, '---',channel_name) as value,  channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" @change="changeChannel"/>
			</view>
			<view class="uni-stat--x" style="display: flex;align-items: center;padding: 10px;">
				<text style="width: 80px;">事件ID</text>
				<view style="width: 300px;">
					<uni-easyinput v-model="formData.event_key" placeholder="事件ID" @change="changeFormData($event,'event_key')" @clear="changeFormData('','event_key')"></uni-easyinput>
				</view>
				<text style="width: 80px;margin-left: 10px;">设备标识</text>
				<view style="width: 300px;">
					<uni-easyinput v-model="formData.device_id" placeholder="设备标识" @change="changeFormData($event,'device_id')" @clear="changeFormData('','device_id')"></uni-easyinput>
				</view>
			</view>
			<view class="uni-stat--x p-m">
				<uni-table :loading="loading" border stripe :emptyText="errorMessage || $t('common.empty')">
					<uni-tr>
						<block v-for="(mapper, index) in fieldsMap" :key="index">
							<uni-th v-if="mapper.title" :key="index" align="center">
								{{mapper.title}}
							</uni-th>
						</block>
					</uni-tr>
					<uni-tr v-for="(item ,i) in tableData" :key="i">
						<uni-td align="center" v-for="(mapper, index) in fieldsMap" :key="index">
							{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
						</uni-td>
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
		parseDateTime,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import fieldsMap from './fieldsMap.js'
	export default {
		data() {
			return {
				fieldsMap,
				formData:{
					event_key: '',
					device_id: ''
				},
				query: {
					appid: '',
					platform_id: '',
					uni_platform: '',
					platform: '',
					channel_id: '',
					channel: '',
					version_id: '',
					version:'',
					create_time: [],
					event_key: '',
					device_id: ''
				},
				options: {
					pageSize: 20,
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
				},
				loading: false,
				currentDateTab: 1,
				tableData: [],
				panelData: [],
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
			changeFormData(val,key){
				this.query[key] = val;
			},
			useDatetimePicker() {
				this.currentDateTab = -1
			},
			changeAppid(id) {
				this.getChannelData(id, false)
			},
			changeTimeRange(id, index) {
				this.currentDateTab = index
				const start = getTimeOfSomeDayAgo(id),
					end = getTimeOfSomeDayAgo(0) - 1
				this.query.create_time = [start, end]
			},
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTableData()
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTableData()
			},

			getAllData(query) {
				this.getTableData(query)
			},
			changePlatform(id, index, name, item) {
				this.getChannelData(null, id)
				this.query.version_id = 0
				this.query.uni_platform = item.code
				this.query.platform = item.code
			},
			changeVersion(version){
				if (!version) version = "";
				let versionArr = version.split("---");
				this.query.version = version.split("---")[0];
				this.query.platform = version.split("---")[1];
			},
			changeChannel(channel){
				if (!channel) channel = "";
				let channelArr = channel.split("---");
				this.query.channel = channel.split("---")[0];
				//this.query.platform = channel.split("---")[1];
			},
			getTableData(query = stringifyQuery(this.query, null, ['uni_platform','platform_id','version_id', 'channel_id'])) {
				if (!this.query.appid){
					this.errorMessage = "请先选择应用";
					return;
				}
				this.errorMessage = "";
				const {
					pageCurrent
				} = this.options
				this.loading = true
				const db = uniCloud.database()

				let collectionList = [
					db.collection('uni-stat-event-logs').where(query).getTemp(),
					db.collection('uni-stat-app-platforms').getTemp()
				];
				db.collection(...collectionList)
					//.where(query)
					.orderBy('create_time', 'desc')
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
						this.tableData = []
						this.options.total = count
						for (const item of data) {
							item.create_time = parseDateTime(item.create_time, 'dateTime')
							item.platform = item.platform && item.platform[0].name
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

			getChannelData(appid, platform_id) {
				if (!this.query.appid){
					this.errorMessage = "请先选择应用";
					return;
				}
				this.errorMessage = "";
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
	.uni-stat-edit--x {
		display: flex;
		justify-content: space-between;
	}

	.uni-stat-edit--btn {
		cursor: pointer;
	}
</style>
