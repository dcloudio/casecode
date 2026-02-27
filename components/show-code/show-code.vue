<template>
	<view style="background-color: #FFFAE7;">
		<view class="column">
			<view class="row" v-if="!isObject" :class="{'val':e!=':'}">
				<text :class="[codesType]">{{codes}}</text>
				<text>{{e}}</text>
			</view>
			<view v-else class="column">
				<text v-if="isJson">{{L}}</text>
				<text v-else>{{La}}</text>
				<view v-for="(value,key,k) in codes" :key="key" class="pr ml" :style="{'left':kl*8*-1+'px'}">
					<template v-if="isJson">
						<show-code :codes="key" e=":"></show-code>
					</template>
					<!-- #ifdef MP -->
					<show-code :codes="value" :last="false" :kl="key.length"></show-code>
					<!-- #endif -->
					<!-- #ifndef MP -->
					<show-code :codes="value" :last="isLast(codes,key,k)" :e="isLast(codes,key,k)?'':','" :kl="key.length"></show-code>
					<!-- #endif -->
				</view>
				<view class="row" :style="{'left':kl*8*-1+'px'}">
					<text v-if="isJson">{{R}}</text>
					<text v-else>{{Ra}}</text>
					<text class="comma" v-if="!last">,</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	// #ifdef VUE2
	import showCode from '@/components/show-code/show-code.vue';
	// #endif
	export default {
		name: "show-code",
		// #ifdef VUE2
		components: {
			"show-code": showCode
		},
		// #endif
		data() {
			return {
				L: "{",
				R: "}",
				La: "[",
				Ra: "]"
			}
		},
		computed: {
			codesType() {
				return this.tf(this.codes)
			},
			isJson(){
				return this.tf(this.codes) == 'json'
			},
			isObject(){
				return typeof(this.codes) == 'object'
			}
		},
		methods: {
			classNNN(){
				return this.tf(this.codes)
			},
			tf(codes) {
				let cType = typeof(codes)
				if (cType == 'object') {
					if (!codes) {
						return 'null'
					} else if (Array.isArray(codes)) {
						return 'array'
					} else {
						return 'json'
					}
				} else {
					return cType
				}
			},
			isLast(codes,key,k){
				if(this.isJson){
					return Object.keys(codes).length == k+1
				}else{
					// console.log(codes.length,k);
					return codes.length == k+1
				}
			}
		},
		props: {
			codes: {
				default () {
					return {}
				}
			},
			kl: {
				type: Number,
				default () {
					return 0
				}
			},
			e: {
				default () {
					return ","
				}
			},
			last: {
				default () {
					return true
				}
			},
		},
	}
</script>

<style scoped>
	view,
	text {
		display: flex;
	}
	.column {
		flex-direction: column;
		flex-shrink: 0;
	}
	.row {
		position: relative;
	}
	.pr{
		position: relative;
	}
	text{
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		font-weight: 500;
		color: #555;
	}
	.string {
		color: #2f897d;
	}
	.string::before {
		content: '"';
	}
	.string::after {
		content: '"';
	}
	
	.boolean{
		color: #34629d;
	}
	text.string{
		color: #447b15;
	}
	.val text.string{
		color: #2f897d;
	}
	.number {
		color: #9661ef;
	}
	.ml{
		margin-left: 15px;
	}
</style>
