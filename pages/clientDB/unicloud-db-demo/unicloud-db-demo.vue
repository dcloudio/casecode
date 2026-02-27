<template>
	<view class="root">
		<unicloud-db ref="udb" v-slot:default="{data, loading, error, options,pagination,hasMore}"
			:options="options"
			:page-data="pageData"
			:collection="collection"
			:field="field.join(',')"
			:page-size="pageSize"
			:orderby="orderby"
			:getone="getone"
			:page-current="pageCurrent"
			:getcount="getcount"
			>
				<view class="box">
					<view class="info" v-if="!getone">
						<text>查询匹配条数：{{getcount?pagination.count:"未知"}}，当前页数据条数：{{data.length}}。</text>
					</view>
					<view class="code">
						<view v-if="loading">加载中...</view>
						<showCode v-else :codes="data"></showCode>
					</view>
					<text class="hasMore" v-if="!hasMore&&!loading">没有更多数据了</text>
				</view>
		</unicloud-db>
		<view class="row">
			<button @click="add" type="primary" plain size="mini">增</button>
			<button @click="remove" type="primary" plain size="mini">删</button>
			<button @click="update" type="primary" plain size="mini">改</button>
			<button @click="getFn" type="primary" plain size="mini">查</button>
		</view>
		<view class="item">
			<view class="row">
				<text class="title">指定查询结果是否仅返回数组第一条数据（getone）</text>
				<switch class="switch-getone" :checked="getone" @change="getone = $event.detail.value" />
			</view>
			<text class="msg">默认 false。在false情况下返回的是数组，即便只有一条结果，也需要[0]的方式获取。在值为 true 时，直接返回结果数据，少一层数组，一般用于非列表页，比如详情页</text>
		</view>
		<template v-if="!getone">
			<view class="item">
				<text class="title">分页策略选择（page-data）</text>
				<uni-data-checkbox v-model="pageData" :localdata='pageDataList' />
				<text class="msg">值为 add 代表下一页的数据追加到之前的数据中，常用于滚动到底加载下一页；值为 replace 时则替换当前data数据，常用于PC式交互，列表底部有页码分页按钮，默认值为add</text>
			</view>
			<view v-if="pageData == 'replace'" class="item row">
				<text class="title">当前页码（pageCurrent）</text>
				<uni-number-box class="num-box1" :min="1" @change="changePageCurrent($event/1)" :value="pageCurrent"></uni-number-box>
			</view>
			<view v-else class="item toLoadMore">
				<text class="title">加载更多loadMore</text>
				<view class="msg">
					在列表的加载下一页场景下，使用ref方式访问组件方法，加载更多数据，每加载成功一次，当前页 +1
				</view>
				<button class="loadMore" size="mini" plain type="primary" @click="$refs.udb.loadMore()">加载更多</button>
			</view>
			
			<view class="item row">
				<text class="title">每页数据数量（pageSize）</text>
				<uni-number-box class="num-box2" :min="1" @change="$event/1>0?pageSize = $event/1:''" :value="pageSize"></uni-number-box>
			</view>
			<view class="item">
				<text class="msg">
					orderby 格式为 字段名 空格 asc(升序)/desc(降序)，多个字段用 , 分割，优先级为字段顺序 \n \n
				</text>
				<text class="title">点击设置用于排序字段</text>
				<uni-data-checkbox multiple @change="setOrderby" v-model="orderbyArr" :localdata="mArrJson(fields)" />
				<view class="title row">
					<text>当前orderby="</text>
					<text space="ensp">{{orderby}}</text>
					<text>"</text>
				</view>
			</view>
			<view class="item">
				<view class="row">
					<text class="title">是否查询总数据条数（getcount）</text>
					<switch class="switch-getcount" :checked="getcount" @change="getcount = $event.detail.value" />
				</view>
				<text class="msg">默认 false，需要分页模式时指定为 true</text>
			</view>
		</template>
		
		<view class="item">
			<text class="title">指定要查询的字段（field）</text>
			<uni-data-checkbox class="field-checkbox" multiple v-model="field"
			:localdata="mArrJson(fields)" />
			<text class="msg">多个字段用 , 分割。不写本属性，即表示查询所有字段。支持用 oldname as newname方式对返回字段重命名</text>
		</view>
	</view>
</template>

<script>
	var udb;
	import showCode from '@/components/show-code/show-code';
	export default {
		components:{showCode},
		data() {
			return {
				options:{a:'123'},
				collection:"order",
				fields:['book_id','create_date','quantity'],
				field:['book_id','create_date','quantity'],
				pageData:"replace",
				pageDataList:[{"text":"add",value:"add"},{"text":"replace",value:"replace"}],
				pageSize:2,
				orderbyArr:[],
				orderbyObj:{},
				orderby:'',
				getone:false,
				pageCurrent:1,
				getcount:true,
				L: "{",
				R: "}",
				dataList:[]
			}
		},
		mounted() {
			udb = this.$refs.udb
		},
		onLoad() {
			setTimeout(()=>{
				this.dataList = this.$refs.udb.dataList
			}, 2000);
		},
		watch: {
			field(field, oldValue) {
				if(field.length === 0){
					// uni.showToast({
					// 	title: 'field不能为空',
					// 	icon: 'none'
					// });
					uni.showModal({
						title:"当前field为空",
						content: '即表示显示所有字段',
						showCancel: false,
						confirmText:"知道了"
					});
					//this.field = oldValue
				}
			},
			pageData(pageData){
				if(pageData=='add'){
					this.$nextTick(()=>{
						udb.loadData({clear:true})
					})
				}
			},
			getone(){
				udb.loadData({clear:true})
			}
		},
		methods: {
			changePageCurrent(e){
				if(e/1>0){
					this.pageCurrent = e
				}
			},
			async setOrderby({detail:{value}}) {
				let arr = Object.keys(this.orderbyObj)
				if(arr.length>value.length){
					for (let key in this.orderbyObj) {
						if( !value.includes(key) ){
							delete this.orderbyObj[key]
						}
					}
				}else{
					await new Promise((callback)=>{
						value.forEach( async(key)=>{
							if(!this.orderbyObj[key]){
								let itemList = ['asc','desc'];
								uni.showActionSheet({
									itemList,
									success: ({tapIndex}) => {
										this.orderbyObj[key] = itemList[tapIndex];
									},
									fail: (err) => {
										console.log(err);
										this.orderbyArr = arr
									},
									complete() {
										callback()
									}
								});
							}
						})
					})
				}
				let orderby = '';
				for (let key in this.orderbyObj) {
					orderby += key+' '+this.orderbyObj[key]+','
				}
				orderby = orderby.slice(0,orderby.length-1)
				console.log('orderby',orderby);
				this.orderby = orderby
			},
			mArrJson(arr){
				let arrJson = []
				arr.forEach((i)=>{
					arrJson.push({'text':i,value:i})
				})
				return arrJson
			},
			async add(){
				await udb.add({
					book_id:"add-test",
					quantity:Date.now()
				},{
					success: (res) => { // 新增成功后的回调
						console.log("res.result: ",res.result);
						this.getFn()
						return res
					}
				})
			},
			remove(){
				const _id = udb.dataList[0]._id
				udb.remove(_id)
			},
			update(){
				const _id = udb.dataList[0]._id
				udb.update(_id,{book_id:"这条数据被改"},
				{
					success: (res) => { // 新增成功后的回调
						this.getFn()
					}
				})
			},
			getFn(){
				udb.loadData()
			},
			linkGetFn(){
				
			}
		}
	}
</script>

<style scoped>
view{
	display: flex;
	flex-direction:column;
}
.root{
	padding-top: 200px;
}
.box{
	height: 200px;
	width: 100vw;
	position: fixed;
	justify-content: center;
	align-items: center;
	top: 0;
	/* #ifdef H5 */
	top: 44px;
	/* #endif */
	left: 0;
	z-index: 999;
	background-color: #FFFFFF;
}
.code{
	padding:16px;
	width:95vw;
	overflow: auto;
	font-size: 12px;
	border: dashed 1px #E5E5E5;
	background-color:#fffae7;
	color: #2b8300;
}
.info{
	flex-direction: row;
	background-color: #FFFFFF;
	color: #0077CC;
	font-size: 14px;
	align-items: center;
}
.hasMore{
	font-size: 12px;
	color: #DD524D;
}
.title{
	font-size: 12px;
	min-height:16px;
	margin-right: 10px;
}
.item{
	flex-direction: column;
	padding: 15px;
	border-top: solid 1px #EFEFF4;
}
.row{
	flex-direction: row;
	align-items: center;
}
.msg{
	font-size: 12px;
	color: #666666;
}
button{
	margin: 10px;
}
@media screen and (max-width: 300px) {
	/*定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸*/
	::-webkit-scrollbar  
	{  
	    width: 5px;  
	    background-color: #fafafa;  
	}  
	  
	/*定义滚动条轨道 内阴影+圆角*/  
	::-webkit-scrollbar-track  
	{  
	    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.1);  
	    border-radius: 10px;  
	    background-color: #fafafa;  
	}  
	  
	/*定义滑块 内阴影+圆角*/  
	::-webkit-scrollbar-thumb  
	{  
	    border-radius: 10px;  
	    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.1);  
	    background-color: #e1e0ed;
	}
}

@media screen and (min-width: 300px) {
    .box {
        height: 300px;
    }
	.code{
	    height: 260px;
	}
	.root{
		padding-top: 300px;
	}
}
</style>
