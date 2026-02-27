<template>
	<view class="page">
		<view class="tips">
			<text>
				DB Schema的permission规则，分为两部分，一边是对操作数据的指定，一边是对角色的指定，规则中对两者进行关联，匹配则校验通过。\n
			</text>
			<text>权限中的角色基于uni-id </text>
			<j-link text="详情" url="https://doc.dcloud.net.cn/uniCloud/uni-id/old.html"></j-link>
		</view>
		<uni-list-item class="table-item" title="表级-简单表达式权限控制" to="../permission-table-simple/permission-table-simple" link></uni-list-item>
		<uni-list-item class="table-item" title="表级-组合表达式权限控制" to="../permission-table-compound/permission-table-compound" link></uni-list-item>
		<uni-list-item class="table-item" title="字段级-简单表达式权限控制" to="../permission-field-simple/permission-field-simple" link></uni-list-item>
		<uni-list-item class="table-item" title="组合表与字段级权限控制示例项目" to="../permission-demo/readme" link></uni-list-item>
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
.tips {
	color: #999999;
	font-size: 14px;
	padding: 10px 20px;
}
</style>
