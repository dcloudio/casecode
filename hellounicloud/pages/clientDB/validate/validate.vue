<template>
	<view class="page">
		<uni-segmented-control class="segmented-control" :current="current" :values="items" @clickItem="clickItem"></uni-segmented-control>
		<view class="content">
			<view v-show="current === 0">
				<myForm></myForm>
			</view>
			<view v-show="current === 1">
				<uni-list>
					<uni-section title="函数验证器 validateFunction" type="line"></uni-section>
					<uni-list-item title="表级跨字段动态验证" rightText="主体名称" note="这是一种可跨字段的表级验证器,会随着表中其中一个字段的值改变另一个字段的验证规则;如:主体为企业、个人时分别设置验证规则。\n 个人:最多输入5个字;企业:最少输入4个字。\n 你可以尝试切换不同的主体类型,输入主体名称测试" />
					<uni-list-item title="可联网的验证" rightText="备注" note="典型功能:敏感词过滤.需要连网调用api验证。" />

					<uni-section title="常规验证 pattern" type="line"></uni-section>
					<uni-list-item title="正则验证" rightText="姓名" note="通过正则表达式满足各类验证需求" />
					<uni-section title="内置验证器format" type="line"></uni-section>
					<uni-list-item title="邮箱、网址" note="后续会持续新增" rightText="email、url" />

					<uni-section title="数据类型 bsonType" type="line"></uni-section>
					<uni-list-item title="整数" note='数值框,如本示例中的体重' rightText="int" />
					<uni-list-item title="数组" note='如:单选/多选框,如本示例中的喜欢的书和体重' rightText="array" />
					<uni-list-item title="布尔值" note='如:开关switch,如本示例中的是否党员' rightText="bool" />

					<uni-section title="数值规范" type="line"></uni-section>
					<uni-list-item title="数值范围" note="最大值:maximum,最小值minimum \n 含最大值exclusiveMaximum,含最小值exclusiveMinimum" />
					<uni-list-item title="字符串长度" note="maxLength限输入的文本长度不超过10" />
					<uni-list-item title="是否必填" note="required:[type, type_name]列举必填字段" rightText="文本框、slider" />


				</uni-list>
			</view>
			<view v-show="current === 2">
				<uni-section title="enum完全列举" type="line"></uni-section>
				<uni-list-item title="完全列举范围" note="enum支持三种类型:简单数组、支持描述的复杂数组、数据查询; \n schema2code不支持简单数组" rightText="多选单选框" />
				<uni-list-item title="来源数据查询" note="一个数据查询而来。也即，在enum中可以配置jql查询语句。本示例的地址就是从表opendb-city-china中查询" rightText="地址" />

				<uni-section title="设置变量的值" type="line"></uni-section>
				<uni-list-item title="预置字段值 defaultValue" note="为字段设置默认值，可用schema直接修改" rightText="" />
				<uni-list-item title="强制字段值 forceDefaultValue" note="强制设置字段值,无法用schema直接修改;但可以通过云函数(含action)修改。支持插入:当前时间戳、当前客户端IP、当前用户Id。"
				 rightText="" />
			</view>
		</view>
	</view>
</template>

<script>
	import myForm from '../../validate-demo/add.vue';
	/*
		注意：“myForm”是由schema2code生成的页面，为演示说明需要将页面作为组件放到 /pages/clientDB/validate内
		故本示例修改了onReady为mounted，并关闭了 140-141行代码，关于提交数据并返回到页面的逻辑
	*/
	export default {
		components: {
			myForm
		},
		data() {
			return {
				items: ['实例demo', '值校验文档', '域校验文档'],
				current: 0
			}
		},
		methods: {
			clickItem(e) {
				console.log(e);
				this.current = e.currentIndex
			}
		}
	}
</script>

<style scoped>
	.page {
		padding-top: 45px;
	}
	.segmented-control {
		background-color: #FFFFFF;
		position: fixed;
		width: 700rpx;
		left: 25rpx;
		top: 0;
		/* #ifdef H5 */
		top: 45px;
		/* #endif */
		z-index: 99;
	}

	pre {
		padding: 16rpx 26rpx;
		white-space: pre-wrap;
	}
</style>
