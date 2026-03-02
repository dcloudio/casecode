<template>
	<uni-table :loading="loading" border stripe emptyText="暂无数据">
		<uni-tr>
			<block v-for="(mapper, index) in filedsMap" :key="index">
				<uni-th v-if="mapper.title" :key="index" align="center">
					<!-- #ifdef MP -->
					{{mapper.title}}
					<!-- #endif -->
					<!-- #ifndef MP -->
					<uni-tooltip>
						{{mapper.title}}
						<uni-icons v-if="tooltip && mapper.tooltip" type="help" color="#666" />
						<template v-if="tooltip && mapper.tooltip" v-slot:content>
							<view class="uni-stat-tooltip-s">
								{{mapper.tooltip}}
							</view>
						</template>
					</uni-tooltip>
					<!-- #endif -->
				</uni-th>
			</block>
		</uni-tr>
		<uni-tr v-for="(item ,i) in data" :key="i">
			<block v-for="(mapper, index) in filedsMap" :key="index">
				<uni-td v-if="mapper.title" :key="index" align="center">
					{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
				</uni-td>
			</block>
		</uni-tr>
	</uni-table>
</template>

<script>
	export default {
		name: "uni-stat-table",
		data() {
			return {

			};
		},
		props: {
			data: {
				type: Array,
				default: () => {
					return []
				}
			},
			filedsMap: {
				type: Array,
				default: () => {
					return []
				}
			},
			loading: {
				type: Boolean,
				default: false
			},
			tooltip: {
				type: Boolean,
				default: false
			}
		}
	}
</script>

<style>
	.uni-stat-tooltip-s {
		width: 160px;
		white-space: normal;
	}
</style>
