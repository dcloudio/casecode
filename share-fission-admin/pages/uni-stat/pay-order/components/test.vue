<template>
	<view>

	</view>
</template>

<script>
	import {
		mapfields,
		stringifyQuery,
		stringifyField,
		stringifyGroupField,
		getTimeOfSomeDayAgo,
		division,
		format,
		formatDate,
		parseDateTime,
		getFieldTotal,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import {
		fieldsMap,
	} from '../fieldsMap.js'
	export default {
		props: {
			query: {
				type: [Object],
				default: function(){
					return {}
				}
			},
		},
		data() {
			return {
				tableName: 'uni-stat-pay-result',
			}
		},
		created() {
			debounce(()=>{
				this.getChartData(this.query)
			})();
		},
		methods: {
			getChartData(query) {

			},
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.options.pageCurrent = 1 // 重置分页
					debounce(()=>{
						this.getChartData(this.query)
					})();
				}
			}
		},
	}
</script>

<style lang="scss" scoped>

</style>
