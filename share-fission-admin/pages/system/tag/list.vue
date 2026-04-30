<template>
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button hide-on-phone" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="primary" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="warn" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
					:type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
				<button class="uni-button" type="primary" size="mini" @click="$refs.batchSms.open()">群发短信</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="uni-id-tag" field="tagid,name,description,create_date" :where="where"
				page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{ data, pagination, loading, error, options }"
				:options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'tagid')"
							sortable @sort-change="sortChange($event, 'tagid')">标签的tagid</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')"
							sortable @sort-change="sortChange($event, 'name')">标签名称</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'description')"
							sortable @sort-change="sortChange($event, 'description')">标签描述</uni-th>
						<uni-th align="center" filter-type="timestamp"
							@filter-change="filterChange($event, 'create_date')" sortable
							@sort-change="sortChange($event, 'create_date')">创建时间</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item, index) in data" :key="index">
						<uni-td align="center">{{ item.tagid }}</uni-td>
						<uni-td align="center">
							<uni-tag type="primary" inverted size="small" :text="item.name"></uni-tag>
						</uni-td>
						<uni-td align="center">{{ item.description }}</uni-td>
						<uni-td align="center">
							<uni-dateformat :threshold="[0, 0]" :date="item.create_date"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('../user/list?tagid=' + item.tagid, false)" class="uni-button"
									size="mini" type="primary">成员</button>
								<button @click="navigateTo('./edit?id=' + item._id, false)" class="uni-button" size="mini"
									type="primary">修改</button>
								<button @click="confirmDelete(item._id)" class="uni-button" size="mini"
									type="warn">删除</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-iconn show-page-size :page-size="pagination.size" v-model="pagination.current"
						:total="pagination.count" @change="onPageChanged" @pageSizeChange="changeSize" />
				</view>
			</unicloud-db>
		</view>

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->

		<!-- #ifdef H5 -->
		<batch-sms ref="batchSms" toType="userTags" :receiver="smsReceiver"></batch-sms>
		<!-- #endif -->

	</view>
</template>

<script>
import {
	enumConverter,
	filterToWhere
} from '@/js_sdk/validator/uni-id-tag.js';

const db = uniCloud.database()
// 表查询配置
const dbOrderBy = '' // 排序字段
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
			query: '',
			where: '',
			orderby: dbOrderBy,
			orderByFieldName: "",
			selectedIndexs: [],
			options: {
				pageSize,
				pageCurrent,
				filterData: {},
				...enumConverter
			},
			imageStyles: {
				width: 64,
				height: 64
			},
			exportExcel: {
				"filename": "uni-id-tag.xls",
				"type": "xls",
				"fields": {
					"标签的tagid": "tagid",
					"标签名称": "name",
					"标签描述": "description"
				}
			},
			exportExcelData: []
		}
	},
	onLoad() {
		this._filter = {}
	},
	onReady() {
		this.$refs.udb.loadData()
	},
	computed: {
		smsReceiver() {
			if (this.selectedIndexs.length) {
				let dataList = this.$refs.udb.dataList
				return this.selectedIndexs.map(i => dataList[i].tagid)
			}
		}
	},
	methods: {
		onqueryload(data) {
			this.exportExcelData = data
		},
		changeSize(pageSize) {
			this.options.pageSize = pageSize
			this.options.pageCurrent = 1
			this.$nextTick(() => {
				this.loadData()
			})
		},
		getWhere() {
			const query = this.query.trim()
			if (!query) {
				return ''
			}
			const queryRe = new RegExp(query, 'i')
			return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
		},
		search() {
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
		confirmDelete(id) {
			this.$refs.udb.remove(id, {
				success: (res) => {
					this.$refs.table.clearSelection()
				}
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
			}
			this.$nextTick(() => {
				this.$refs.udb.loadData()
			})
		}
	}
}
</script>
