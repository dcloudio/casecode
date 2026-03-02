<template>
	<!-- 对应页面：支付统计-转换漏斗分析  -->
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
		</view>
		<view class="uni-container">

			<view class="uni-stat--x flex p-1015">
				<view class="uni-stat--app-select">
					<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc" :def-item="1" label="应用选择" v-model="query.appid" :clear="false" />
					<uni-data-select collection="opendb-app-versions" :where="versionQuery" class="ml-m" field="_id as value, version as text, uni_platform as label, create_date as date" format="{label} - {text}" orderby="date desc" label="版本选择" v-model="query.version_id" />
				</view>
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id" @change="platformChange" />
				<uni-data-select ref="version-select" v-if="query.platform_id && query.platform_id.indexOf('==') === -1" collection="uni-stat-app-channels" :where="channelQuery" class="p-channel" field="_id as value, channel_name as text" orderby="text asc" label="渠道/场景值选择" v-model="query.channel_id" />
			</view>
			<!-- 漏斗分析 -->
			<funnelChart :query="query"></funnelChart>
			<!-- 转化率趋势图 -->
			<trendChart :query="query"></trendChart>
		</view>

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
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

	import timeUtil from "@/js_sdk/uni-stat/timeUtil.js"

	import funnelChart from "./components/funnelChart"
	import trendChart from "./components/trendChart"
	export default {
		components:{
			funnelChart,
			trendChart,
		},
		data() {
			return {
				tableName: 'uni-stat-pay-result',
				query: {
					dimension: 'hour',
					appid: '',
					platform_id: '',
					uni_platform: '',
					version_id: '',
					start_time: [],
				},
				loading: false,
			}
		},
		onLoad(option) {
			const {
				appid
			} = option
			if (appid) {
				this.query.appid = appid
			}
		},
		created() {

		},
		methods: {
			// 监听 - 平台更改
			platformChange(id, index, name, item) {
				this.query.version_id = 0;
				this.query.uni_platform = item.code;
			},
		},
		watch: {

		},
		computed: {
			versionQuery() {
				const {
					appid,
					uni_platform
				} = this.query
				const query = stringifyQuery({
					appid,
					uni_platform
				})
				return query
			},
			channelQuery() {
				const {
					appid,
					platform_id,
				} = this.query
				const query = stringifyQuery({
					appid,
					platform_id
				})
				return query
			},
		},


	}
</script>
