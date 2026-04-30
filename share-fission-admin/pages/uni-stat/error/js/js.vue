<template>
	<!-- 对应页面： js报错 -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group hide-on-phone">
				<view class="uni-sub-title">开发者可以在这里快速查询应用最近出现的具体错误内容，了解错误概况信息，以便快速修复问题</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex p-1015">
				<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
				<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
			</view>
			<view class="uni-stat--x flex">
				<uni-stat-tabs label="日期选择" :current="currentDateTab" :yesterday="false" mode="date"
					@change="changeTimeRange" />
				<uni-datetime-picker type="datetimerange" :end="new Date().getTime()" v-model="query.start_time"
					returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
					:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
					@change="useDatetimePicker" />
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="changePlatform"/>
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
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
						<button v-if="sourceMapEnabled" class="uni-button" type="primary" size="mini"
							@click="openUploadPopup">上传
							sourceMap</button>
						<!-- #endif -->
					</view>
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
						<uni-th align="center" v-if="sourceMapEnabled">
							操作
						</uni-th>
					</uni-tr>
					<uni-tr v-for="(item ,i) in tableData" :key="i">
						<block v-for="(mapper, index) in fieldsMap" :key="index">
							<uni-td v-if="mapper.field === 'count'" :key="mapper.field" align="center">
								<text class="link-btn" @click="navTo('detail', item)">
									{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								</text>
							</uni-td>
							<uni-td v-else :key="mapper.field" align="center">
								{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
							</uni-td>
						</block>
						<uni-td v-if="sourceMapEnabled">
							<button size="mini" type="primary" style="white-space: nowrap;"
								@click="openErrPopup(item)">详 情</button>
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

		<uni-popup ref="errMsg" type="center" :animation="false" :maskClick="true" @change="errMsgPopupChange">
			<view class="modal black-theme">
				<view class="modal-header">
					错误详情
				</view>
				<scroll-view scroll-x="true" scroll-y="true">
					<view class="modal-content" style="padding: 20px 30px;">
						<view v-if="msgLoading" style="margin: 150px 0;text-align: center;font-size: 14px;">
							<uni-load-more class="mb-m" :showText="false" status="loading" />
							<view>正在解析，请稍等...</view>
						</view>
						<text>{{errMsg}}</text>
					</view>
				</scroll-view>
				<view class="dialog-close" @click="closeErrPopup">
					<view class="dialog-close-plus" data-id="close"></view>
					<view class="dialog-close-plus dialog-close-rotate" data-id="close"></view>
				</view>
			</view>
		</uni-popup>

		<!-- #ifdef H5 -->
		<uni-drawer class="sourcemap-drawser" ref="upload" mode="right" :mask-click="true" :width="340">
			<view class="modal" style="max-width: none; min-width: auto;padding: 0 10px;">
				<view class="modal-header">
					上传 sourceMap
				</view>
				<view class="modal-content" style="height: 300px;padding: 0;">
					<view style="margin-top: 10px;">
						<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" label="应用" v-model="uploadOptions.appid" />
					</view>
					<view style="margin-top: 10px;">
						<uni-data-select collection="uni-stat-app-platforms" field="code as value, name as text" orderby="text asc" label="平台" v-model="uploadOptions.uni_platform" />
					</view>
					<view style="margin-top: 10px;">
						<uni-data-select collection="opendb-app-versions" :where="uploadVersionQuery" field="version as value, version as text" orderby="text desc" label="版本" v-model="uploadOptions.version" />
					</view>
					<view class="flex m-m">
						<view class="label-text">选择文件:</view>
						<button class="uni-button ml-m" type="primary" @click="choosefile">选择文件并上传</button>
					</view>
					<view v-if="!vaildate" class="upload-msg-warning">
						{{uploadMsg}}
					</view>
				</view>
				<view class="dialog-close" @click="closeUploadPopup">
					<view class="dialog-close-plus" style="background-color: #333;" data-id="close"></view>
					<view class="dialog-close-plus dialog-close-rotate" style="background-color: #333;" data-id="close">
					</view>
				</view>
			</view>
			<view class="upload-task-header">
				<text>上传任务：{{uploadSuccessTasks.length}}/{{uploadFile.tempFileTasks.length}}</text>
			</view>
			<scroll-view v-if="uploadFile.tempFileTasks.length" style="height: calc(100vh - 362px);" scroll-y="true">
				<view v-if="uploadFile.tempFileTasks.length > uploadSuccessTasks.length">
					<view class="upload-task-header">
						<text>正在上传</text>
					</view>
					<uploadTask :uploadTasks="sortUploadFileTempFileTasks"></uploadTask>
				</view>
				<view v-if="uploadSuccessTasks.length">
					<view class="upload-task-header">
						<text style="color:#42b983;">上传成功</text>
					</view>
					<uploadTask :uploadTasks="uploadSuccessTasks" :showProgress="false"></uploadTask>
				</view>
			</scroll-view>
		</uni-drawer>
		<!-- #endif -->

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
		fileToUrl,
		debounce,
		getAllDateCN,
		createUniStatQuery
	} from '@/js_sdk/uni-stat/util.js'
	import {
		fieldsMap,
		popupFieldsMap
	} from './fieldsMap.js'
	import uploadTask from './uploadTask.vue'
	import {
		stacktracey,
		uniStracktraceyPreset
	} from '@dcloudio/uni-stacktracey';
	import adminConfig from '@/admin.config.js'

	const panelOption = [{
		title: '错误总数',
		value: 0,
		tooltip: '指应用在某个时间段内出现错误的总数'
	}, {
		title: '错误率',
		value: 0,
		tooltip: '时间范围内的总错误数/应用启动次数，如果小于0.01%，默认显示为0'
	}]

	const db = uniCloud.database(); // 初始化数据库实例
	const _ = db.command; // 定义数据库操作符

	const dbNameSourceMap = `uni-stat-error-source-map`; // sourceMap资源存放的表名
	const sourcemapPrefix = `__UNI__/uni-stat/sourcemap`;
	let sourcemapFileCache = {};

	export default {
		data() {
			return {
				uniStat: adminConfig.uniStat,
				fieldsMap,
				popupFieldsMap,
				query: {
					// type: "js",
					dimension: "day",
					appid: "",
					platform_id: '',
					uni_platform: '',
					version_id: '',
					start_time: []
				},
				uploadOptions: createUniStatQuery({
					appid: "",
					uni_platform: '',
				}),
				uploadMsg: '',
				options: {
					pageSize: 20,
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
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
					name: '错误次数'
				}, {
					_id: 'errorRate',
					name: '错误率'
				}],
				errMsg: '',
				msgLoading: false,
				uploadFile: {
					tempFileTasks: [],
					tempFiles: [],
					clear() {
						this.tempFileTasks.length = this.tempFiles.length = 0
					}
				},
				uploadSuccessTaskNames: [],
				errorItem: '',
				errorMessage: "",
			}
		},
		components: {
			uploadTask
		},
		computed: {
			queryStr() {
				return stringifyQuery(this.query)
			},
			versionQuery() {
				const {
					appid,
					uni_platform
				} = this.query
				const query = stringifyQuery(createUniStatQuery({
					appid,
					uni_platform
				}))
				return query
			},
			uploadVersionQuery() {
				const {
					appid,
					uni_platform
				} = this.uploadOptions
				const query = stringifyQuery(createUniStatQuery({
					appid,
					uni_platform
				}))
				return query
			},
			vaildate() {
				// 检验 this.uploadOptions 所有项都有值
				const allItemHasVaule = Object.keys(this.uploadOptions).every(k => this.uploadOptions[k])
				if (allItemHasVaule && this.uploadMsg) {
					this.uploadMsg = ''
				}
				return allItemHasVaule
			},
			uploadSuccessTasks() {
				return this.uploadFile.tempFileTasks.filter(task => task.state === 1)
			},
			sortUploadFileTempFileTasks() {
				return this.uploadFile.tempFileTasks.filter(task => task.state !== 1).sort((a, b) => a.state - b.state)
			},
			sourceMapEnabled() {
				//return !!this.uniStat.uploadSourceMapCloudSpaceId
				return true;
			},
			channelQuery() {
				const platform_id = this.query.platform_id
				return stringifyQuery({
					platform_id
				})
			},
		},
		created() {
			this.parsedErrors = {}

			if (this.sourceMapEnabled) {
				// sourceMap 功能需初始化上传的目标云空间
				if (this.uniStat.uploadSourceMapCloudSpaceId) {
					if (this.uniStat.uploadSourceMapCloudPlatform === "aliyun") {
						// 使用阿里云服务空间
						let endpoint = this.uniStat.uploadSourceMapCloudSpaceId.indexOf("mp-") === 0 ? 'https://api.next.bspapp.com':'https://api.bspapp.com';
						this.uploadSourcemapCloud = uniCloud.init({
							provider: 'aliyun',
							spaceId: this.uniStat.uploadSourceMapCloudSpaceId,
							clientSecret: this.uniStat.uploadSourceMapCloudClientSecret,
							endpoint
						})
					} else {
						// 使用腾讯云服务空间
						this.uploadSourcemapCloud = uniCloud.init({
							provider: 'tencent',
							spaceId: this.uniStat.uploadSourceMapCloudSpaceId
						})
					}
				} else {
					// 使用本项目绑定的服务空间
					this.uploadSourcemapCloud = uniCloud;
				}
			}

			this.getCloudDataDebounce = debounce(() => {
				this.getAllData(this.queryStr)
			}, 300);
			this.getCloudDataDebounce();
		},
		watch: {
			query: {
				deep: true,
				handler(val, old) {
					this.options.pageCurrent = 1 // 重置分页
					this.getCloudDataDebounce()
				}
			},
			chartTab(val) {
				this.getChartData(this.queryStr)
			}
		},
		methods: {
			useDatetimePicker(res) {
				this.currentDateTab = -1
			},
			changePlatform(id, index, name, item) {
				this.query.version_id = 0
				this.uploadOptions.uni_platform = item.code
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
				this.getTableData(this.queryStr)
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTableData(this.queryStr)
			},

			getAllData(query) {
				if (query.indexOf("appid") === -1) {
					this.errorMessage = "请先选择应用";
					return; // 如果appid为空，则不进行查询
				}
				this.errorMessage = "";
				this.getChartData(query);
				this.getTableData(query);
			},

			getChartData(query, field = 'day_count') {
				let querystr = stringifyQuery(this.query, false, ['uni_platform'])
				this.chartData = {}
				const {
					pageCurrent
				} = this.options
				const db = uniCloud.database()
				const [start_time, end_tiem] = this.query.start_time
				const timeAll = getAllDateCN(new Date(start_time), new Date(end_tiem))
				db.collection('uni-stat-error-result')
					.where(querystr)
					.groupBy('start_time')
					.groupField('sum(count) as total_day_count')
					.orderBy('start_time', 'desc')
					.get({
						getCount: true
					})
					.then(async res => {
						const count = res.result.count
						const resData = res.result.data
						let data = []


						timeAll.forEach(v => {
							let item = resData.find(item => item.start_time === v)
							if (item) {
								data.push(item)
							} else {
								data.push({
									start_time: v,
									total_day_count: 0
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
								name: '错误次数',
								data: []
							}
							const xAxis = options.categories
							for (const item of data) {
								let date = item.start_time
								const x = formatDate(date, 'day')
								const countY = item[`total_${field}`]
								xAxis.push(x)
								countLine.data.push(countY)
							}
							this.chartData = options
						} else {
							let dayAppLaunchs = await this.getDayLaunch(querystr)
							const rateLine = options.series[0] = {
								name: '错误率(%)',
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
							for (const item of data) {
								let date = item.start_time
								const x = formatDate(date, 'day')
								const countY = item[`total_${field}`]
								xAxis.push(x)
								if (dayAppLaunchs.length) {
									const day = dayAppLaunchs.find(day => day.start_time === item.start_time)
									const index = xAxis.indexOf(x)
									if (day) {
										let rateY = (countY * 100) / day.day_app_launch_count
										rateY = rateY.toFixed(2)
										rateLine.data[index] = rateY
									} else {
										rateLine.data[index] = 0
									}
								}
							}
							this.chartData = options
						}

					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {})
			},

			getTotalCount(query) {
				const db = uniCloud.database()
				return db.collection('uni-stat-error-result')
					.where(query)
					.groupBy('appid')
					.groupField('sum(count) as total_count')
					.get()
			},

			getTotalLaunch(query) {
				const db = uniCloud.database()
				return db.collection('uni-stat-result')
					.where(query)
					.groupBy('appid')
					.groupField('sum(app_launch_count) as total_app_launch_count')
					.get()
			},

			/**
			 * 从结果表里获取范围时间内的启动次数
			 * @param {Object} query
			 */
			async getDayLaunch(query) {
				const db = uniCloud.database()
				const res = await db.collection('uni-stat-result')
					.where(query)
					.groupBy('start_time')
					.groupField('sum(app_launch_count) as day_app_launch_count')
					.orderBy('start_time', 'asc')
					.get()
				return res.result.data || []
			},

			getTableData(query = stringifyQuery(this.query)) {

				let querystr = stringifyQuery(this.query, false, ['uni_platform'])
				const {
					pageCurrent
				} = this.options
				this.loading = true
				const db = uniCloud.database()
				const filterAppid = stringifyQuery(createUniStatQuery({
					appid: this.query.appid
				}))
				const mainTableTemp = db.collection('uni-stat-error-result').where(querystr).getTemp()
				const versions = db.collection('opendb-app-versions')
					.where(filterAppid)
					.getTemp()

				const platforms = db.collection('uni-stat-app-platforms')
					.getTemp()

				db.collection(mainTableTemp, versions, platforms)
					.orderBy('count', 'desc')
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
						const tempData = []
						this.panelData = JSON.parse(JSON.stringify(panelOption))
						for (const item of data) {
							item.last_time = parseDateTime(item.last_time, 'dateTime')
							item.msgTooltip = item.msg
							item.msg = !item.msg ? '' : item.msg.substring(0, 100) + '...'
							const v = item.version_id[0]
							const p = item.platform_id[0]
							item.version = v && v.version
							item.platform = p && p.name
							item.platform_code = p && p.code
							tempData.push(item)
						}
						this.getTotalCount(querystr).then(res => {
							const total = res.result.data[0]
							const total_count = total && total.total_count
							if (total_count) {
								tempData.forEach(item => item.total_count = Number(total_count))
								this.panelData[0].value = total_count
							}
							let launch_count = ''
							this.getTotalLaunch(querystr).then(res => {
								const total = res.result.data[0]
								launch_count = total && total.total_app_launch_count
								if (total_count && launch_count) {
									let errorRate = total_count / launch_count
									errorRate = (errorRate * 100).toFixed(2) + '%'
									this.panelData[1].value = errorRate
								}
							})

						}).finally(() => {
							this.tableData = []
							this.options.total = count
							tempData.forEach(item => mapfields(fieldsMap, item, item))
							this.tableData = tempData
						})

					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			navTo(url, item) {
				if (url.indexOf('http') > -1) {
					window.open(url)
				} else {
					if (item) {
						url = `${url}?error_hash=${item.hash}&create_time=${item.start_time}`
					}
					uni.navigateTo({
						url
					})
				}
			},

			closeErrPopup() {
				this.$refs.errMsg.close()
			},
			errMsgPopupChange(res) {
				if (res.show) {
					const err = this.errorItem.msgTooltip
					if (this.msgLoading) {
						this.closeErrPopup()
						return;
					}
					if (!err) {
						this.errMsg = '暂无错误数据'
					}
					this.errMsg = ''
					const oldMsg = this.parsedErrors[err]
					//  || oldMsg === err
					this.msgLoading = true
					this.parseError(this.errorItem)
					return
					if (!oldMsg) {
						this.msgLoading = true
						this.parseError(this.errorItem)
					} else {
						this.errMsg = oldMsg
					}
				} else {
					this.msgLoading = false
				}
			},
			async parseError(item) {
				let {
					msgTooltip: err,
					appid,
					platform_code,
					version
				} = item
				//console.log('item: ', item)
				let base = `/${appid}/${platform_code}/${version}/`
				let fileList;
				if (sourcemapFileCache[base] && sourcemapFileCache[base].length > 0) {
					fileList = sourcemapFileCache[base];
				} else {
					fileList = await this.getSourceMapFileList({
						base
					});
					if (fileList && fileList.length > 0) {
						sourcemapFileCache[base] = fileList;
					} else {
						console.error(`缺少${base}对应的sourceMap，请先上传sourceMap`)
					}
				}
				//console.log('fileList: ', fileList)

				try {
					err = JSON.parse(err)
				} catch (e) {}

				// console.log("originalErrMsg: ", err);

				const stacktraceyOptions = {
						base,
						uniPlatform: platform_code,
						splitThirdParty: true
					}
				if (['harmony', 'harmonyos'].indexOf(platform_code.toLocaleLowerCase()) === -1 && ['ios', 'android', 'app'].indexOf(platform_code)>-1) {
					stacktraceyOptions.lineOffset = -1
				}
				stacktracey(err, {
					preset: {
						...uniStracktraceyPreset(stacktraceyOptions),
						/**
						 *
						 * 微信特殊处理
						 * 微信解析步骤：
						 * 	1. //usr/app-service.js -> 'weixin/__APP__/app-service.map.map'
						 *  2. //usr/pages/API/app-service.js -> 'weixin/pages/API/app-service.map.map'
						 *  3. uni-list-item/uni-list-item.js -> ${base}/uni-list-item/uni-list-item.js.map
						 */
						parseSourceMapUrl(file, fileName, fileRelative){
							// 组合 sourceMapUrl
							if (fileRelative.indexOf('(') !== -1){
								let fileRelativeMatch = fileRelative.match(/\((.*)/);
								fileRelative = fileRelativeMatch && fileRelativeMatch[1];
							}
							if (!base || !fileRelative) return ''
							if (typeof sourceRoot !== "undefined") {
								return `${fileRelative.replace(sourceRoot, base + '/')}.map`
							}
							let baseAfter = ''
							if (platform_code.indexOf("mp-")>-1) {
								if (fileRelative.indexOf('app-service.js') !== -1) {
									baseAfter = (base.match(/\w$/) ? '/' : '') + '__WEIXIN__'
									if (fileRelative === fileName) {
										baseAfter += '/__APP__'
									}
									// fileRelative = fileRelative.replace('.js', '.map')
								}
							}
							if (baseAfter && !!fileRelative.match(/^\w/)) baseAfter += '/'
							let path = `${base}${baseAfter}${fileRelative}.map`;
							let cloud_path = `${sourcemapPrefix}${path}`;

							let cloud_path_web;
							if (platform_code === "web") {
								// 尝试去掉第一级的项目名（web端可能会设置h5基础运行路径）
								let fileRelativeWeb = fileRelative.substring(fileRelative.indexOf("/")+1);
								let pathWeb = `${base}${baseAfter}${fileRelativeWeb}.map`;
								cloud_path_web = `${sourcemapPrefix}${pathWeb}`;
							}

							let fileItem = fileList.find((item) => {
								return [cloud_path, cloud_path_web].indexOf(item.cloud_path) > -1;
							});
							//console.log('cloud_path: ', cloud_path, fileItem.url)
							return fileItem ? fileItem.url : cloud_path;
						}
					}
				}).then(res => {
					const {
						userError,
						thirdParty
					} = res
					const separate = userError.length && thirdParty.length ?
						`\n\n------------${platform_code.indexOf('mp-') !== -1 ? platform_code : 'uni-app'} runtime error------------\n\n` :
						''
					this.errMsg = `${userError}${separate}${thirdParty}`
					this.parsedErrors[err] = this.errMsg
				}).finally(() => {
					this.msgLoading = false
				});
			},
			openUploadPopup() {
				const {
					appid,
					uni_platform
				} = this.query

				this.uploadOptions = {
					appid,
					uni_platform
				}
				this.$refs.upload.open()
			},
			closeUploadPopup() {
				this.$refs.upload.close()
			},
			createUploadFileTask(prefix, fileDiskPath, filePath, onUploadProgress) {
				const cloudPath = prefix + fileDiskPath

				return this.uploadSourcemapCloud.uploadFile({
					filePath,
					cloudPath,
					onUploadProgress
				})
			},
			async choosefile() {
				if (!this.vaildate) {
					this.uploadMsg = '请先将应用、平台、版本填写完整'
					return
				}
				const {
					appid,
					uni_platform,
					version
				} = this.uploadOptions

				const base = `/${appid}/${uni_platform}/${version}/`;
				const prefix = `${sourcemapPrefix}${base}`


				// 原生 input 上传逻辑
				const inputEl = document.createElement('input')
				inputEl.type = 'file'
				inputEl.directory = true
				inputEl.webkitdirectory = true
				inputEl.click()
				inputEl.addEventListener('change', async () => {
					this.uploadFile.clear()

					const fileList = inputEl.files; /* now you can work with the file list */
					if (!fileList.length) return

					Array.prototype.forEach.call(fileList, (file) => {
						const path = fileToUrl(file)
						this.uploadFile.tempFileTasks.push({
							fileDiskPath: file.webkitRelativePath.split('/').slice(1).join('/'),
							path,
							size: `${(file.size / 1024).toFixed(2)}kb`,
							name: file.name,
							state: 0,
							progress: 0,
							file
						})
						Object.defineProperty(file, 'path', {
							get() {
								return path
							},
						})
						this.uploadFile.tempFiles.push(file)
					})
					// 因为上传有并发限制，故还是一个一个上传靠谱
					let dataArr = [];
					for (let i = 0; i < this.uploadFile.tempFileTasks.length; i++) {
						let cur = this.uploadFile.tempFileTasks[i];
						let res = await new Promise((resolve, reject) => {
							// 已上传的文件
							if (this.uploadSuccessTaskNames.indexOf(cur.name) !== -1) {
								cur.progress = 1
								setTimeout(() => {
									cur.state = 1
									resolve()
								}, 200)
							} else {
								this.createUploadFileTask(
									prefix,
									cur.fileDiskPath,
									cur.path,
									(OnUploadProgressRes) => {
										const {
											loaded,
											total
										} = OnUploadProgressRes
										cur.progress = loaded / total
									}
								).then((uploadRes) => {
									const cloudPath = prefix + cur.fileDiskPath
									let fileID = uploadRes.fileID;
									uniCloud.getTempFileURL({
										fileList: [fileID]
									})
									.then(res => {
										let url = res.fileList[0].tempFileURL;
										let file = {
											appid,
											uni_platform,
											version,
											file_id: fileID,
											url,
											name: cur.name,
											size: cur.file.size,
											cloud_path: cloudPath,
											base
										};
										setTimeout(() => {
											this.uploadSuccessTaskNames.push(name)
											cur.state = 1
											resolve(file)
										}, 100)
									});
								}).catch((err) => {
									cur.state = -1
									reject(`${cur.name} 上传失败：` + JSON.stringify(err))
								})
							}
						})
						if (res) dataArr.push(res);
					}

					if (dataArr && dataArr.length>0){
						// 将sourceMap资源文件写入数据库
						await this.addSourceMapFile(dataArr);
					}
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
			openErrPopup(item) {
				this.errorItem = item
				this.$refs.errMsg.open()
			},

			// 将sourceMap资源文件写入数据库
			async addSourceMapFile(dataArr){
				let cloud_path_arr = [];
				dataArr.map((item, index) => {
					cloud_path_arr.push(item.cloud_path);
				});
				// 先删除同版本的文件（避免重复上传时出现错误）
				await db.collection(dbNameSourceMap).where({
					cloud_path: _.in(cloud_path_arr)
				}).remove();
				// 再添加
				await db.collection(dbNameSourceMap).add(dataArr);
			},
			// 从数据库中获取sourceMap资源文件
			async getSourceMapFileList(obj){
				let {
					base
				} = obj;
				let fileListRes = await db.collection(dbNameSourceMap).where({
					base
				}).limit(1000).get();
				return fileListRes.result.data || [];
			},

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

	.black-theme {
		background-color: #333;
		color: #fff;
	}

	.dialog-close {
		cursor: pointer;
		position: absolute;
		top: 0;
		right: 0;
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		align-items: center;
		padding: 20px;
		margin-top: 10px;
	}

	.dialog-close-plus {
		width: 20px;
		height: 2px;
		background-color: #fff;
		border-radius: 2px;
		transform: rotate(45deg);
	}

	.dialog-close-rotate {
		position: absolute;
		transform: rotate(-45deg);
	}

	.upload-msg-warning {
		padding: 0px 15px;
		color: red;
		font-size: 14px;
	}

	::v-deep .sourcemap-drawser .uni-select {
		flex: 1;
	}

	::v-deep .sourcemap-drawser .uni-select .uni-select__input-text {
		width: 100%;
	}

	.upload-task-header {
		font-size: 14px;
		color: #666;
		padding: 15rpx 25rpx;
		border-top: 1px solid #eee;
		border-bottom: 1px solid #eee;
	}
</style>
