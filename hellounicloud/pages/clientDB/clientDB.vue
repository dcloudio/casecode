<template>
	<view>
		<uni-list>
			<uni-list-item class="item" title="API操作数据库" note="增删改查、分页查询、联表查询、tree查询" to="./clientDB-api/clientDB-api" link>
				<text slot="header" class="ico">&#xe650;</text>
			</uni-list-item>
			<uni-list-item class="item" title="unicloud-db组件" note="一个数据库查询组件，它是对clientDB的js库的再封装。前端通过组件方式直接获取uniCloud的云端数据库中的数据，并绑定在界面上进行渲染。" to="./unicloud-db-demo/unicloud-db-demo" link>
				<text slot="header" class="ico">&#xe603;</text>
			</uni-list-item>
			<uni-list-item class="item" title="控制前端操作数据库的权限" note="从表级,字段级根据:账户角色、权限、记录字段、账户uid等控制操作权限" to="./permission/permission" link>
				<text slot="header" class="ico">&#xe61f;</text>
			</uni-list-item>
			<uni-list-item class="item" title="字段值域校验" note="是否必填（required）、数据类型（bsonType）、数字范围（maximum、minimum）、字符串长度范围（minLength、maxLength）、format、pattern正则表达式" to="./validate/validate" link>
				<text slot="header" class="ico">&#xe651;</text>
			</uni-list-item>
			<uni-list-item class="item" title="完整示例" to="./demo/demo" note="结合schema的api和组件前端操作数据库,权限控制,actions、foreignKey等,做一个:不同账户权限浏览、删除、审核的系统" link>
				<text slot="header" class="ico">&#xe61b;</text>
			</uni-list-item>
		</uni-list>
	</view>
</template>
<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			
		}
	}
</script>
<style>
.ico{
	font-size: 14px;
	color: #007AFF;
	padding-right:6px;
	margin-top: 5px;
}
</style>
