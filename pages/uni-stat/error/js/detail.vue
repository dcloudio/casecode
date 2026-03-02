<template>
	<view class="fix-top-window">
		<view class="uni-container">
			<uni-stat-table :data="tableData" :filedsMap="popupFieldsMap" :loading="loading" />
			<view class="uni-pagination-box">
				<uni-pagination show-icon show-page-size :page-size="options.pageSize" :current="options.pageCurrent"
					:total="options.total" @change="changePageCurrent" @pageSizeChange="changePageSize" />
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
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import {
		popupFieldsMap
	} from './fieldsMap.js'

	const panelOption = [{
		title: '错误总数',
		value: 0,
		tooltip: '指应用在某个时间段内出现错误的总数'
	}, {
		title: '错误率',
		value: 0,
		tooltip: '时间范围内的总错误数/应用启动次数，如果小于0.01%，默认显示为0'
	}]

	export default {
		data() {
			return {
				popupFieldsMap,
				options: {
					pageSize: 20,
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
				},
				query: {
					error_hash: '',
					create_time: []
				},
				loading: false,
				tableData: []
			}
		},
		onLoad(option) {
			let {
				error_hash,
				create_time
			} = option
			if (error_hash) {
				create_time = Number(create_time)
				this.query.error_hash = error_hash
				this.query.create_time = [create_time, create_time + 24 * 60 * 60 * 1000]
				this.getTableData(stringifyQuery(this.query))
			}
		},
		methods: {
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTableData(stringifyQuery(this.query))
			},

			changePageSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1 // 重置分页
				this.getTableData(stringifyQuery(this.query))
			},


			getTableData(query) {
				const {
					pageCurrent
				} = this.options
				this.loading = true
				const db = uniCloud.database()
				db.collection('uni-stat-error-logs')
					.where(query)
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
						this.options.total = count
						for (const item of data) {
							item.create_time = parseDateTime(item.create_time, 'dateTime')
						}
						this.tableData = data
					})
					.finally(() => {
						this.loading = false
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
