<template>
	<view>
		<alertCode ref="alertCode"></alertCode>

		<view class="tips">
			<view>schema配置详见uniCloud-aliyun/database下的book.schema.json、order.schema.json</view>
		</view>

		<uni-section title="简单查询" subTitle="在符合schema设置的前提下,直接在前端查询云端数据库的数据" type="line"></uni-section>
		<button @click="getData('book')" plain type="primary">查图书book表的数据</button>
		<button @click="getData('order')" plain type="primary">查订单order表的数据</button>

		<uni-section title="查询列表分页" subTitle="设置每页查询数量和页码查询" type="line"></uni-section>
		<view class="item">
			<text>页码：</text>
			<uni-number-box class="num-box1" :min="1" @change="pageCurrent = $event/1" :value="pageCurrent">
			</uni-number-box>
		</view>
		<view class="item">
			<text>每页查询数量：</text>
			<uni-number-box class="num-box2" :min="1" @change="pageSize = $event/1"
				:value="pageSize"></uni-number-box>
		</view>
		<button @click="getPageData('order')" plain type="primary">分页查图书book表的数据</button>

		<uni-section title="联表查询-订单和图书" subTitle="只需在db schema中，将两个表的关联字段建立映射关系，即可实现联表查询。" type="line">
		</uni-section>
		<button @click="getOrderByGetTemp" plain type="primary">数据表较大时，高性能查询</button>
		<button @click="getOrder" plain type="primary">数据表较小时，便捷查询</button>

		<uni-section title="getOne" subTitle="使用clientDB时可以在get方法内传入getOne:true来返回一条数据" type="line"></uni-section>
		<button @click="getOneBook" plain type="primary">查询一本图书数据</button>

		<uni-section title="getCount" subTitle="使用clientDB时可以在get方法内传入getCount:true来同时返回总数" type="line"></uni-section>
		<button @click="getBookHasCount" plain type="primary">查询结果返回总数</button>

		<uni-section title="field" subTitle="查询时可以使用field方法指定返回字段，在<uni-clientDB>组件中也支持field属性。不使用field方法时会返回所有字段"
			type="line"></uni-section>
		<button @click="getBookTitle" plain type="primary">仅查询图书数据的书名</button>

		<!-- <uni-section title="loadMore" subTitle="查询列表分页" type="line"></uni-section>
		<button  @click="getUserData" type="primary">加载下一页</button>
		<button  @click="getUserData" type="primary">点击页码按钮切换不同页</button> -->

		<uni-section title="name as cname" subTitle="如：author as book_author，意思是将数据库的author字段重命名为book_author"
			type="line"></uni-section>
		<button @click="getBookAs" plain type="primary">获得被设置别名的数据</button>

		<uni-section title="orderBy" subTitle="orderBy方法内可以传入一个字符串来指定排序规则。如:订单表order根据quantity销量字段排序" type="line">
		</uni-section>
		<button @click="getOrderOrderBy('quantity asc')" type="primary" plain>按销量升序</button>
		<button plain @click="getOrderOrderBy('create_date desc')" type="primary">按创建时间降序</button>
		<button plain @click="getOrderOrderBy('quantity asc, create_date desc')" type="primary">销量相同时，按创建时间降序</button>

		<uni-section title="查询树形数据"
			subTitle="树形数据，在数据库里一般不会按照tree的层次来存储，因为按tree结构通过json对象的方式存储不同层级的数据，不利于对tree上的某个节点单独做增删改查。一般存储树形数据，tree上的每个节点都是一条单独的数据表记录，然后通过类似parent_id来表达父子关系。如部门的数据表，里面有2条数据，一条数据记录是“总部”，parent_id为空；另一条数据记录“一级部门A”，parent_id为总部的_id"
			type="line"></uni-section>
		<button plain @click="getTreeFn" type="primary">查询树形数据</button>

		<uni-section title="新增数据记录add" subTitle="获取到db的表对象后，通过add方法新增数据记录" type="line"></uni-section>
		<button @click="addData2TestDb()" plain type="primary">
			<text>
				在test表里新增一条
				"data=当前时间戳"的记录
			</text>
		</button>
		<button @click="addMoreData2TestDb()" plain type="primary">
			<text>
				在test表里新增5条
				"data=随机数"的记录
			</text>
		</button>

		<uni-section title="更新数据记录update" subTitle="collection.doc().update(Object data)" type="line"></uni-section>
		<button @click="updateData2TestDb()" plain type="primary">
			<text>
				更新test表里的一条记录
			</text>
		</button>

		<uni-section title="删除数据记录remove" subTitle="获取到db的表对象，然后指定要删除的记录，通过remove方法删除。" type="line"></uni-section>
		<button @click="removeData2TestDb()" plain type="primary">
			<text>
				删除test表里的一条记录
			</text>
		</button>
		<button @click="removeAllData2TestDb()" plain type="primary">
			<text>
				删除test表里的所有数据
			</text>
		</button>


	</view>
</template>

<script>
	const db = uniCloud.database();
	export default {
		data() {
			return {
				msg: {
					result: {
						data: ''
					}
				},
				pageCurrent: 1,
				pageSize: 2
			}
		},
		methods: {
			addMoreData2TestDb() {
				uni.showLoading({
					mask: false
				});
				let dataList = [];
				for (var i = 0; i < 5; i++) {
					dataList.push({
						"data": Math.ceil(Math.random() * 999)
					})
				}
				db.collection('test').add(dataList).then(res => {
					this.$refs.alertCode.open(res.result)
					uni.hideLoading()
				})
			},
			addData2TestDb() {
				uni.showLoading({
					mask: false
				});
				db.collection('test').add({
					data: Date.now()
				}).then(res => {
					this.$refs.alertCode.open(res.result)
					uni.hideLoading()
				})
			},
			updateData2TestDb() {
				uni.showLoading({
					mask: false
				});
				let testDb = db.collection("test")
				testDb.get({
					getOne: true
				}).then(({
					result: {
						data
					}
				}) => {
					if (data) {
						testDb.doc(data._id).update({
							data: Date.now()
						}).then(res => {
							console.log(res);
							this.$refs.alertCode.open(res.result)
							uni.hideLoading()
						})
					} else {
						uni.showToast({
							title: 'test表内没有数据',
							icon: 'none'
						});
						uni.hideLoading()
					}
				})
			},
			removeData2TestDb() {
				uni.showLoading({
					mask: false
				});
				let testDb = db.collection("test")
				testDb.get({
					getOne: true
				}).then(({
					result: {
						data
					}
				}) => {
					if (data) {
						testDb.doc(data._id).remove().then(res => {
							console.log(res);
							this.$refs.alertCode.open(res.result)
							uni.hideLoading()
						})
					} else {
						uni.showToast({
							title: 'test表内没有数据',
							icon: 'none'
						});
						uni.hideLoading()
					}
				})
			},
			async removeAllData2TestDb() {
				let index = 1
				uni.showLoading({
					mask: false
				});
				let testDb = db.collection("test")
				let {
					result: {
						data
					}
				} = await testDb.get()
				console.log(data);
				if (data.length) {
					//用一个不存在的条件来删除所有数据
					let {
						result: {
							deleted
						}
					} = await testDb.where('data!="不存在的条件"').remove();
					uni.showToast({
						title: '成功删除' + deleted + '条数据！',
						icon: 'none'
					});
				} else {
					uni.showToast({
						title: 'test表内没有数据',
						icon: 'none'
					});
					uni.hideLoading()
				}
			},
			getData(tableName) {
				console.log(tableName);
				uni.showLoading({
					mask: true
				});
				// 客户端联表查询
				db.collection(tableName)
					.get()
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					})
					.finally((e) => {
						uni.hideLoading()
					})
			},
			async getOrderByGetTemp() {
				//当数据表记录数较大时，务必使用本方法
				uni.showLoading({mask: true});
				const orderQuery = db.collection('order').field('book_id,quantity').getTemp()	// 使用getTemp先过滤处理获取临时表再联表查询
				const bookQuery = db.collection('book').field('_id,author,title').getTemp()
				const res = await db.collection(orderQuery,bookQuery).field('book_id as books_info,quantity').get()
				uni.hideLoading()
				this.$refs.alertCode.open(res.result)
			},
			getOrder() {
				//直接关联多个表为虚拟表再进行查询。仅数据表字段内容较少时使用，否者将查询超时
				uni.showLoading({mask: true});
				// 客户端联表查询
				db.collection('order,book') // 注意collection方法内需要传入所有用到的表名，用逗号分隔，主表需要放在第一位
					//.where('book_id.title == "三国演义"') // 查询order表内书名为“三国演义”的订单
					.field('book_id{title,author} as books_info,quantity') // 这里联表查询book表返回book表内的title、book表内的author、order表内的quantity
					.get()
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getOneBook() {
				uni.showLoading({
					mask: true
				});
				// 客户端联表查询
				db.collection('book')
					.get({
						getOne: true
					})
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getBookTitle() {
				uni.showLoading({
					mask: true
				});
				// 客户端联表查询
				db.collection('book')
					.field('title')
					.get()
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getBookAs() {
				uni.showLoading({
					mask: true
				});
				// 客户端联表查询
				db.collection('book')
					.field('title,author as book_author')
					.get()
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getOrderOrderBy(str) {
				uni.showLoading({
					mask: true
				});
				db.collection('order')
					.orderBy(str)
					.get()
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getBookHasCount() {
				uni.showLoading({
					mask: true
				});
				db.collection('book')
					.get({
						"getCount": true
					})
					.then(res => {
						this.$refs.alertCode.open(res.result)
					}).catch(err => {
						console.error(err)
					}).finally(() => {
						uni.hideLoading()
					})
			},
			getTreeFn() {
				uni.showLoading({
					mask: true
				});
				db.collection("opendb-department").get({
						getTree: {
							limitLevel: 10, // 最大查询层级（不包含当前层级），可以省略默认10级，最大15，最小1
							//	startWith: "parent_code==''"  // 第一层级条件，此初始条件可以省略，不传startWith时默认从最顶级开始查询
						}
					})
					.then((res) => {
						console.log("res: ",res);
						const resdata = res.result.data
						this.$refs.alertCode.open(resdata)
					}).catch((err) => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					}).finally(() => {
						uni.hideLoading()
					})
			},
			async getPageData() {
				uni.showLoading({
					mask: false
				});
				let res = await db.collection("book")
					.skip((this.pageCurrent - 1) * this.pageSize)
					.limit(this.pageSize)
					.get()
				console.log(res);
				this.$refs.alertCode.open(res.result.data)
				uni.hideLoading()
			}
		}
	}
</script>

<style>
	.tips {
		color: #999999;
		font-size: 14px;
		padding: 15px 20px;
		border: dashed 1px #EEEEEE;
		border-radius: 5px;
		margin: 10px;
	}

	button {
		width: 500rpx;
		margin: 10px 125rpx;
		font-size: 16px;
	}

	/*定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸*/
	::-webkit-scrollbar {
		width: 5px;
		height: 5px;
		background-color: #fafafa;
	}

	/*定义滚动条轨道 内阴影+圆角*/
	::-webkit-scrollbar-track {
		-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		background-color: #fafafa;
	}

	/*定义滑块 内阴影+圆角*/
	::-webkit-scrollbar-thumb {
		border-radius: 10px;
		-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
		background-color: #e1e0ed;
	}

	.item {
		display: flex;
		width: 750rpx;
		justify-content: flex-start;
		align-items: center;
		padding-top: 20px;
		padding-left: 36rpx;
		flex-direction: row;
	}
</style>
