<template>
	<view class="main">
		<view v-if="loaded">
			<view class="uni-header">
				<view class="uni-group">
					<view class="uni-sub-title">当前应用：</view>
					<view class="uni-title app-list">
						<picker @change="(e) => showAppIndex = e.detail.value" :value="showAppIndex"
							:range="appNameList">
							<view class="uni-input" style="font-size: 14px;">
								{{appNameList[showAppIndex]}}
								<uni-icons type="bottom"></uni-icons>
							</view>
						</picker>
					</view>
				</view>
				<view class="uni-group">
					<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
					<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
					<button class="uni-button publish" type="primary" size="mini" @click="publish">发布新版</button>
					<button class="uni-button" type="warn" size="mini" :disabled="!selectedIndexs.length"
						@click="delTable">批量删除</button>
				</view>
			</view>
			<view class="uni-container">
				<unicloud-db ref="udb" :collection="appVersionListDbName"
					field="store_list,appid,contents,platform,type,version,min_uni_version,url,stable_publish,create_date,title,name"
					:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
					:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
					:options="options">
					<uni-table style="overflow-y: hidden;" :loading="loading" :emptyText="error.message || '没有更多数据'"
						border stripe type="selection" @selection-change="selectionChange">
						<uni-tr>
							<uni-th align="center">AppID</uni-th>
							<uni-th align="center">更新标题</uni-th>
							<uni-th align="center">安装包类型</uni-th>
							<uni-th align="center">平台</uni-th>
							<uni-th align="center">已上架应用市场</uni-th>
							<uni-th align="center">版本号</uni-th>
							<uni-th align="center">安装包状态</uni-th>
							<uni-th align="center">上传时间</uni-th>
							<uni-th align="center">操作</uni-th>
						</uni-tr>
						<uni-tr v-for="(item,index) in data" :key="index" :disabled="item.stable_publish">
							<uni-td align="center"> {{item.appid}} </uni-td>
							<uni-td align="center"> {{item.title || '-'}} </uni-td>
							<uni-td align="center">
								<text :style="{
								padding: '5px 8px',
								backgroundColor: item.type === 'wgt' ? '#f0f9eb' : '#ecf5ff',
								color: item.type === 'wgt' ? '#67c23a' : '#409eff',
								border: `1px solid ${item.type === 'wgt' ? '#e1f3d8' : '#d9ecff'}`,
								borderRadius: '4px'
								}">{{options.type_valuetotext[item.type]}}</text>
							</uni-td>
							<uni-td align="center">
								<uni-data-picker :localdata="options.platform_valuetotext" :value="item.platform"
									:border="false" :readonly="true" split="," />
							</uni-td>
							<uni-td align="center">
								<text>{{store_list_key(item.store_list)}}</text>
							</uni-td>
							<uni-td align="center"> {{item.version}} </uni-td>
							<uni-td align="center"> {{item.stable_publish == true ? '已上线' : '已下线'}} </uni-td>
							<uni-td align="center">
								<uni-dateformat format="yyyy-MM-dd hh:mm:ss" :date="item.create_date"
									:threshold="[0, 0]" />
							</uni-td>
							<uni-td align="center">
								<!-- <view class="uni-group"> -->
								<button @click="navigateTo('./detail?id='+item._id, false)" class="uni-button"
									size="mini" type="primary">详情</button>
								<!-- <button @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button> -->
								<!-- </view> -->
							</uni-td>
						</uni-tr>
					</uni-table>
					<view class="uni-pagination-box">
						<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
							:total="pagination.count" @change="onPageChanged" />
					</view>
				</unicloud-db>
			</view>
		</view>
		<view v-else class="page-loading" :style="containerTop">
			<i class="uni-icon_toast uni-loading"></i>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '@/js_sdk/validator/opendb-app-versions.js';
	import {
		appListDbName,
		appVersionListDbName,
		defaultDisplayApp
	} from '../utils.js'
	import {
		mapState
	} from 'vuex'

	const db = uniCloud.database()
	const dbCmd = db.command
	// 表查询配置
	const dbOrderBy = 'stable_publish desc,create_date desc' // 排序字段
	const dbSearchFields = ['name', 'title', 'stable_publish', 'type'] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	const appidKey = '__app_version_appid'
	const nameKey = '__app_version_name'

	function getScreenHeight() {
		return document.documentElement ? document.documentElement.clientHeight : window.innerHeight;
	}

	function createListQuery(condition = {}) {
		return {
			create_env: dbCmd.neq("uni-stat"),
			...condition
		}
	}

	export default {
		data() {
			return {
				backButtonHover: false,
				appVersionListDbName,
				currentAppid: '',
				currentAppName: '',
				query: '',
				where: '',
				orderby: dbOrderBy,
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				},
				loaded: false,
				containerTop: {},
				appList: [],
				showAppIndex: 0
			}
		},
		async onLoad({
			appid
		}) {
			await this.getAppList()
			if (!this.appList.length) {
				this.showModalToAppManager()
				return
			}
			this.loaded = true

			this.appList.forEach((item, index) => {
				if (item.appid === appid || defaultDisplayApp) {
					this.showAppIndex = index
				}
			})
			this.setAppInfo(this.showAppIndex)
			this.where = createListQuery({
				appid: this.currentAppid
			})
		},
		computed: {
			...mapState('app', ['appid']),
			appNameList() {
				return this.appList.map(item => item.name)
			}
		},
		watch: {
			showAppIndex(val) {
				this.setAppInfo(val)

				this.where = createListQuery({
					appid: this.currentAppid
				})
			}
		},
		onReady() {
			this.containerTop.height = `${getScreenHeight()}px`
		},
		methods: {
			setAppInfo(index) {
				this.currentAppid = this.appList[index].appid
				this.currentAppName = this.appList[index].name
			},
			navigateBack() {
				uni.navigateBack()
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
				const isSameWhere = newWhere === this.where
				this.where = newWhere
				if (this.where) {
					this.where = `(${this.where}) && `
				}
				this.where += `${new RegExp(this.currentAppid, 'i')}.test(appid)`
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
				var dataList = this.$refs.udb.dataList
				return this.selectedIndexs.map(i => dataList[i]._id)
			},
			// 批量删除
			delTable() {
				this.$refs.udb.remove(this.selectedItems())
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				this.$refs.udb.remove(id)
			},
			publish(e) {
				// #ifdef H5
				const {
					top,
					left,
					width,
					height
				} = document.querySelector('.uni-button.publish').getBoundingClientRect()
				// #endif

				const platforms = Object.keys(this.options.type_valuetotext)
				uni.showActionSheet({
					itemList: Object.values(this.options.type_valuetotext),
					// #ifdef H5
					popover: {
						top: top + height,
						left,
						width
					},
					// #endif
					success: async (res) => {
						this.navigateTo(
							`./add?appid=${this.currentAppid}&name=${this.currentAppName}&type=${platforms[res.tapIndex]}`
						)
					}
				});
			},
			async getAppList() {
				try {
					const {
						result
					} = await db.collection(appListDbName).get()
					if (result && result.data && result.data.length > 0) {
						this.appList = result.data.filter(item => item.appid !== this.appid)
					} else {
						this.showModalToAppManager()
					}
				} catch (e) {
					const arr = ['TOKEN_INVALID_TOKEN_EXPIRED', 'TOKEN_INVALID_ANONYMOUS_USER']
					if (arr.indexOf(e.code) === -1)
						this.showModalToAppManager()
				}
			},
			showModalToAppManager() {
				let timer = null
				let second = 3

				function jump() {
					uni.navigateTo({
						url: '/pages/system/app/list'
					})
					clearInterval(timer)
				}

				timer = setInterval(() => {
					if (--second <= 0) {
						jump()
					}
				}, 1000)

				uni.showModal({
					title: '请先添加应用',
					content: '即将跳转至应用管理……',
					showCancel: false,
					confirmText: '立即跳转',
					success: (res) => jump()
				})
			},
			store_list_key(store_list) {
				const arr = store_list ? store_list.filter(item => item.enable) : []
				return arr.length ?
					arr.sort((a, b) => b.priority - a.priority)
					.map(item => item.name).join(',') :
					'-'
			}
		}
	}
</script>
<style lang="scss">
	.page-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		flex: 1;

		i {
			$icon-size: 80rpx;
			width: $icon-size;
			height: $icon-size;
		}
	}

	page,
	page .main,
	.page-loading {
		height: 100%;
	}

	.app-list {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px 10px;
		border-radius: 4px;
		border: 1px solid #2e76ba;
		color: #3A8EE6;

		uni-text {
			margin-left: 10px;
		}
	}
</style>
