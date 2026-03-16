<template>
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search"
					:placeholder="$t('common.placeholder.query')" />
				<button class="uni-button hide-on-phone" type="default" size="mini"
					@click="search">{{$t('common.button.search')}}</button>
				<button class="uni-button" type="primary" size="mini"
					@click="navigateTo('./add')">{{$t('common.button.add')}}</button>
				<button class="uni-button" type="warn" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">{{$t('common.button.batchDelete')}}</button>
				<button class="uni-button" type="primary" size="mini" :disabled="!selectedIndexs.length"
					@click="openTagsPopup">{{$t('common.button.tagManager')}}</button>
				<!-- #ifdef H5 -->
				<button class="uni-button" type="primary" size="mini" @click="$refs.batchSms.open()">{{$t('common.button.sendSMS')}}</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
					:type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">{{$t('common.button.exportExcel')}}</button>
				</download-excel>
				<!-- #endif -->
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collectionList" :where="where"
				page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{ data, pagination, loading, error, options }"
				:options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || $t('common.empty')" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'username')"
							sortable @sort-change="sortChange($event, 'username')">用户名</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'nickname')"
							sortable @sort-change="sortChange($event, 'nickname')">用户昵称</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'mobile')"
							sortable @sort-change="sortChange($event, 'mobile')">手机号码</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.status_localdata"
							@filter-change="filterChange($event, 'status')">用户状态</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'email')"
							sortable @sort-change="sortChange($event, 'email')">邮箱</uni-th>
						<uni-th align="center">角色</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="tagsData"
							@filter-change="filterChange($event, 'tags')">用户标签</uni-th>
						<uni-th align="center">可登录应用</uni-th>
						<uni-th align="center" filter-type="timestamp"
							@filter-change="filterChange($event, 'last_login_date')" sortable
							@sort-change="sortChange($event, 'last_login_date')">最后登录时间</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">{{item.username}}</uni-td>
						<uni-td align="center">{{item.nickname}}</uni-td>
						<uni-td align="center">{{item.mobile}}</uni-td>
						<uni-td align="center">{{options.status_valuetotext[item.status]}}</uni-td>
						<uni-td align="center">
							<uni-link :href="'mailto:' + item.email" :text="item.email"></uni-link>
						</uni-td>
						<uni-td align="center"> {{ item.role }}</uni-td>
						<uni-td align="center">
							<block v-for="(tag,tagIndex) in item.tags" :key="tagIndex">
								<uni-tag type="primary" inverted size="small" :text="tag" v-if="item.tags" style="margin: 0 5px;"></uni-tag>
							</block>
						</uni-td>
						<uni-td align="center">
							<uni-link v-if="item.dcloud_appid === undefined" :href="noAppidWhatShouldIDoLink">
								未绑定可登录应用<view class="uni-icons-help"></view>
							</uni-link>
							{{ item.dcloud_appid }}
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :threshold="[0, 0]" :date="item.last_login_date"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('./edit?id=' + item._id, false)" class="uni-button" size="mini"
									type="primary">{{ $t('common.button.edit') }}</button>
								<button @click="confirmDelete(item._id)" class="uni-button" size="mini"
									type="warn">{{ $t('common.button.delete') }}</button>
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
		<uni-popup ref="tagsPopup" type="center">
			<view class="tags-manager--x">
				<view class="tags-manager--header mb">管理标签</view>
				<uni-data-checkbox ref="checkbox" v-model="managerTags" class="mb ml" :multiple="true"
					collection="uni-id-tag" field="tagid as value, name as text"></uni-data-checkbox>
				<view class="uni-group">
					<button @click="managerMultiTag" class="uni-button" type="primary"
						style="margin-right: 75px;">保存</button>
				</view>
			</view>
		</uni-popup>
		<!-- #ifdef H5 -->
		<batch-sms ref="batchSms" toType="user" :receiver="smsReceiver" :condition="smsCondition"></batch-sms>
		<!-- #endif -->
	</view>
</template>

<script>
	import {
		enumConverter,
		filterToWhere
	} from '../../../js_sdk/validator/uni-id-users.js';
	import UniForms from "@/uni_modules/uni-forms/components/uni-forms/uni-forms";
	import UniFormsItem from "@/uni_modules/uni-forms/components/uni-forms-item/uni-forms-item";
	import UniEasyinput from "@/uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput";

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'last_login_date desc' // 排序字段
	const dbSearchFields = ['username', 'role.role_name', 'mobile', 'email'] // 支持模糊搜索的字段列表
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
				collectionList: [ db.collection('uni-id-users').field('ali_openid,apple_openid,avatar,avatar_file,comment,dcloud_appid,department_id,email,email_confirmed,gender,invite_time,inviter_uid,last_login_date,last_login_ip,mobile,mobile_confirmed,my_invite_code,nickname,role,score,status,username,wx_unionid,qq_unionid,tags').getTemp(),db.collection('uni-id-roles').field('role_id, role_name').getTemp() ],
				query: '',
				where: '',
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				pageSizeIndex: 0,
				pageSizeOption: [20, 50, 100, 500],
				tags: {},
				managerTags: [],
				queryTagid: '',
				queryUserId: '',
				options: {
					pageSize,
					pageCurrent,
					filterData: {
						"status_localdata": [{
								"text": "正常",
								"value": 0,
								"checked": true
							},
							{
								"text": "禁用",
								"value": 1
							},
							{
								"text": "审核中",
								"value": 2
							},
							{
								"text": "审核拒绝",
								"value": 3
							}
						]
					},
					...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				},
				exportExcel: {
					"filename": "uni-id-users.xls",
					"type": "xls",
					"fields": {
						"用户名": "username",
						"手机号码": "mobile",
						"用户状态": "status",
						"邮箱": "email",
						"角色": "role",
						"last_login_date": "last_login_date"
					}
				},
				exportExcelData: [],
				noAppidWhatShouldIDoLink: 'https://uniapp.dcloud.net.cn/uniCloud/uni-id?id=makeup-dcloud-appid',
				smsCondition: {}
			}
		},
		onLoad(e) {
			this._filter = {}
			const tagid = e.tagid
			const userId = e.id

			if (tagid) {
				this.queryTagid = tagid
				const options = {
					filterType: "select",
					filter: [tagid]
				}
				this.filterChange(options, "tags")
			}

			if (userId) {
				this.queryUserId = userId
				const options = {
					filterType: "select",
					filter: [userId]
				}
				this.filterChange(options, "_id")
			}
		},
		onReady() {
			this.loadTags()
			if (!this.queryTagid && !this.queryUserId) {
				this.$refs.udb.loadData()
			}
		},
		computed: {
			tagsData() {
				const dynamic_data = []
				for (const key in this.tags) {
					const tag = {
						value: key,
						text: this.tags[key]
					}
					if (key === this.queryTagid) {
						tag.checked = true
					}
					dynamic_data.push(tag)
				}
				return dynamic_data
			},
			smsReceiver() {
				if (this.selectedIndexs.length) {
					let dataList = this.$refs.udb.dataList
					return this.selectedIndexs.map(i => dataList[i]._id)
				} else {
					return undefined;
				}
			}
		},
		methods: {
			onqueryload(data) {
				for (let i = 0; i < data.length; i++) {
					let item = data[i]
					const roleArr = item.role.map(item => item.role_name)
					item.role = roleArr.join('、')
					const tagsArr = item.tags && item.tags.map(item => this.tags[item])
					item.tags = tagsArr
					if (Array.isArray(item.dcloud_appid)) {
						item.dcloud_appid = item.dcloud_appid.join('、')
					}
					item.last_login_date = this.$formatDate(item.last_login_date)
				}
				this.exportExcelData = data
			},
			changeSize(pageSize) {
				this.options.pageSize = pageSize
				this.options.pageCurrent = 1
				this.$nextTick(() => {
					this.loadData()
				})
			},
			openTagsPopup() {
				this.$refs.tagsPopup.open()
			},
			closeTagsPopup() {
				this.$refs.tagsPopup.close()
			},
			getWhere() {
				const query = this.query.trim()
				if (!query) {
					return ''
				}
				const queryRe = new RegExp(query, 'i')

				console.log(
					JSON.stringify(
						db.command.or(
							dbSearchFields.map(name => {
								return {
									[name]: queryRe
								}
							})
						)
					)
				)

				return db.command.or(
					dbSearchFields.map(name => {
						return {
							[name]: queryRe
						}
					})
				)
				return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
			},
			search() {
				const newWhere = this.getWhere()

				this.where = newWhere
				// 下一帧拿到查询条件
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
							this.loadTags()
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

				// uni-sms-co
				if (Object.keys(this._filter).length) {
					this.smsCondition = this._filter
				} else {
					this.smsCondition = {}
				}

				this.$nextTick(() => {
					this.$refs.udb.loadData()
				})
			},
			loadTags() {
				db.collection('uni-id-tag').limit(500).get().then(res => {
					res.result.data.map(item => {
						this.$set(this.tags, item.tagid, item.name)
					})
				}).catch(err => {
					uni.showModal({
						title: '提示',
						content: err.message,
						showCancel: false
					})
				})
			},
			managerMultiTag() {
				const ids = this.selectedItems()

				db.collection('uni-id-users').where({
					_id: db.command.in(ids)
				}).update({
					tags: this.managerTags
				}).then(() => {
					uni.showToast({
						title: '修改标签成功',
						duration: 2000
					})
					this.$refs.table.clearSelection()
					this.managerTags = []
					this.loadData()
					this.closeTagsPopup()
				}).catch(err => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(err => {
					uni.hideLoading()
				})
			}
		}
	}
</script>

<style lang="scss">
	.tags-manager {

		&--x {
			width: 400px;
			padding: 40px 30px;
			border-radius: 5px;
			background-color: #fff;
		}

		&--header {
			font-size: 22px;
			color: #333;
			text-align: center;
		}
	}

	.mb {
		margin-bottom: 80px;
	}

	.ml {
		margin-left: 30px;
	}
</style>
