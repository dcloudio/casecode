<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<uni-stat-breadcrumb />
			</view>
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
		</view>
		<view class="uni-container">

			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
			</view>
			<view class="uni-stat--x" style="margin-bottom: 0;">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="platformChange" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="channel_code as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_code" />
			</view>
			<!-- 时间纬度 -->
			<view class="flex">
				<uni-stat-tabs type="box" :current="dateTabs.index" :tabs="dateTabs.list" @change="dateTabsChange" />
				<uni-datetime-picker type="datetimerange" v-model="query.pay_date" :end="Date.now()" return-type="timestamp" :clear-icon="true" class="uni-stat-datetime-picker" @change="dateTabs.index=null"/>
			</view>

			<unicloud-db ref="udb" :collection="collectionList" field="user_id,nickname,uni_platform,status,total_fee,refund_fee,appid,pay_date"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" groupby="user_id"
				group-field="sum(total_fee) as total_fee,sum(refund_fee) as refund_fee, sum(subtract(total_fee,refund_fee)) as reality_fee, sum(1) as count,last(nickname) as nickname"
				v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || loading ? '请求中...' : '没有更多数据'" border stripe type="" style="min-height: 900px;"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">排名</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'user_id')">用户</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'reality_fee')">支付金额（不含退款）</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'count')">订单数量</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">{{ parseInt((index+1) + (pagination.current-1) * pagination.size) }} </uni-td>
						<uni-td align="center"><text class="text-btn" @click="pageToUser(item)">{{ nameFormat(item) }}</text> </uni-td>
						<uni-td align="center">{{ (item.reality_fee / 100).toFixed(2) }}</uni-td>
						<uni-td align="center"> <text class="text-btn" @click="pageToOrder(item)"> {{ item.count }} </text> </uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count"
						@change="onPageChanged" />
				</view>
			</unicloud-db>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter,
		filterToWhere
	} from '../../../../js_sdk/validator/uni-pay-orders.js';
	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'total_fee desc' // 排序字段
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	const orderByMapping = {
		"ascending": "asc",
		"descending": "desc"
	}

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

	import timeUtil from "@/js_sdk/uni-stat/timeUtil.js"

	export default {
		data() {
			return {
				collectionList: "uni-pay-orders",
				query: {
					appid: '',
					platform_id: '',
					uni_platform: '',
					version: '',
					pay_date: [],
					channel_code:""
				},
				where: '',
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					filterData: {

					},
		 		...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				},
				exportExcel: {
					"filename": "价值用户排行.xls",
					"type": "xls",
					"fields": {
						"用户ID": "user_id",
						"用户昵称": "nickname",
						"支付金额": "total_fee",
						"订单数量":"count"
					}
				},
				exportExcelData: [],
				// 时间选项
				dateTabs: {
					time: [],
					timeStr:"",
					index: null,
					list: [
						{ _id: 0, name: '今天' },
						{ _id: 1, name: '昨天' },
						{ _id: 7, name: '最近七天' },
						{ _id: 30, name: '最近30天' },
						{ _id: 90, name: '最近90天' },
					]
				},
			}
		},
		onLoad() {
			this._filter = {}
		},
		onReady() {
			//this.$refs.udb.loadData()
		},
		methods: {
			payDatePicker(val) {
				this.query.pay_date = val;
				this.search();
			},
			onqueryload(data) {
				this.exportExcelData = data
			},
			getWhere() {
				let where = "status>0";
				let {
					pay_date,
					appid,
					version,
					uni_platform,
					channel_code
				} = this.query;
				if (pay_date && pay_date.length == 2) {
					where += ` && pay_date>=${pay_date[0]} && pay_date<=${pay_date[1]}`;
				}
				if (appid) {
					where += ` && appid=='${appid}'`;
				}
				if (version) {
					where += ` && stat_data.app_version=='${version}'`;
				}
				if (uni_platform) {
					where += ` && stat_data.platform=='${uni_platform}'`;
				}
				if (channel_code) {
					where += ` && stat_data.channel=='${channel_code}'`;
				}
				//where = where.substring(3).trim();
				where = where.trim();
				console.log('where: ', where)
				return where;
			},
			search() {
				if (!this.query.appid) return;
				const newWhere = this.getWhere()
				this.where = newWhere
				this.$nextTick(() => {
					this.loadData()
				})
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
			navigateTo(url, clear) {
				// clear 表示刷新列表时是否清除页码，true 表示刷新并回到列表第 1 页，默认为 true
				uni.navigateTo({
					url,
					events: {
						refreshData: () => {
							this.loadData(clear)
						}
					}
				})
			},
			// 多选处理
			selectedItems() {
				let dataList = this.$refs.udb.dataList
				return this.selectedIndexs.map(i => dataList[i]._id)
			},
			// 批量删除
			delTable() {
				this.$refs.udb.remove(this.selectedItems(), {
		 		success: (res) => {
						this.$refs.table.clearSelection()
					}
				})
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
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
				}
				this.$nextTick(() => {
		 		this.$refs.udb.loadData()
				})
			},
			platformChange(id, index, name, item) {
				this.query.version = 0
				this.query.uni_platform = item.code
			},
			nameFormat(item){
				if (!item.user_id) {
					return "匿名用户";
				} else if (item.nickname) {
					return `${item.user_id}（${item.nickname}）`
				} else {
					return item.user_id;
				}
			},
			pageToUser(item){
				let { user_id } = item;
				uni.navigateTo({
					url:`/pages/system/user/list?id=${user_id}`
				});
			},
			pageToOrder(item){
				let { user_id } = item;
				uni.navigateTo({
					url:`/pages/uni-stat/pay-order/list/list?user_id=${user_id}`
				});
			},
			// 监听 - 日期选择更改
			dateTabsChange(id, index) {
				this.dateTabs.index = index;
				let start =  getTimeOfSomeDayAgo(id);
				let end = timeUtil.getOffsetStartAndEnd("day", 0).endTime; // end默认=今天的截止时间
				if (id == 1) {
					// 如果是查昨天,则特殊处理下,end=昨天的截止时间
					end = timeUtil.getOffsetStartAndEnd("day",0,start).endTime;
				}
				this.query.pay_date = [start, end];
			},
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.search()
				}
			}
		},
		computed: {
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
	}
</script>

<style lang="scss" scoped>
.text-btn{
	color: $uni-color-primary;
	cursor: pointer;
	margin: 0 5px;
}
</style>
