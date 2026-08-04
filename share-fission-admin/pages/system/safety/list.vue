<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" :placeholder="$t('common.placeholder.query')" />
				<button class="uni-button hide-on-phone" type="default" size="mini" @click="search">{{$t('common.button.search')}}</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collectionList" :options="options" :where="where" page-data="replace" :orderby="orderby"
			 :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error}">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe >
					<uni-tr>
						<uni-th align="center">序号</uni-th>
						<uni-th align="center">用户名</uni-th>
						<uni-th align="center">昵称</uni-th>
						<uni-th align="center">内容</uni-th>
						<uni-th align="center">IP</uni-th>
						<uni-th align="center">时间</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">{{(pagination.current -1)*pagination.size + (index+1)}}</uni-td>
						<uni-td align="center">{{item.user_id[0] && item.user_id[0].username || '-'}}</uni-td>
						<uni-td align="center">{{item.user_id[0] && item.user_id[0].nickname || '-'}}</uni-td>
						<uni-td align="center">{{item.type}}</uni-td>
						<uni-td align="center">{{item.ip}}</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.create_date" :threshold="[0, 0]" />
						</uni-td>
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
	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'create_date desc' // 排序字段
	const dbSearchFields = ["user_id.username","user_id.nickname","type", "ip"] // 支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	export default {
		data() {
			return {
				collectionList: [ db.collection('uni-id-log').field('type, ip, create_date, user_id').getTemp(),db.collection('uni-id-users').field('_id, username,nickname').getTemp() ],
				query: '',
				where: '',
				orderby: dbOrderBy,
				options: {
					pageSize,
					pageCurrent
				}
			}
		},
		methods: {
			getWhere() {
				const query = this.query.trim()
				if (!query) {
					return ''
				}
				let queryRe;
				try {
					queryRe = new RegExp(query, 'i')
				} catch(err){
					uni.showToast({
						title:'请勿输入\等不满足正则格式的符号',
						icon:"none"
					})
					return;
				}
				return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
			},
			search() {
				const newWhere = this.getWhere()
				const isSameWhere = newWhere === this.where
				this.where = newWhere
				if (isSameWhere) { // 相同条件时，手动强制刷新
					this.loadData()
				}
			},
			loadData(clear = true) {
				this.$refs.udb.loadData({
					clear
				})
			},
			onPageChanged(e) {
				this.$refs.udb.loadData({
					current: e.current
				})
			},
			navigateTo(url) {
				uni.navigateTo({
					url,
					events: {
						refreshData: () => {
							this.loadData()
						}
					}
				})
			},
			// 多选处理
			selectedItems() {
				let dataList = this.$refs.udb.dataList
				return this.selectedIndexs.map(i => dataList[i]._id)
			},
			//批量删除
			delTable() {
				this.$refs.udb.remove(this.selectedItems())
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				this.$refs.udb.remove(id)
			}
		}
	}
</script>
<style>
</style>
