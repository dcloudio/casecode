<template>
    <view class="root">
		<view class="uni-title dashed-box">
			<text class="tip">
				schema2code是一个根据数据库schema自动生成代码的工具。它可以直接生成云端一体的列表、详情、新建、修改页面，云端一体直接可用。大幅提升开发效率。
			</text>
			<text>\n schema路径:uniCloud/database/user-info.schema.json \n</text>
			<button class="showSchemaCode" size="mini" @click="showSchemaCode" type="primary" plain>查看schema代码</button>
		</view>
		<j-video :src="videoUrl" title="schema2code步骤演示" height="421rpx" width="750rpx"></j-video>
		<alertCode ref="alertCode"></alertCode>
		<button class="toForm" @click="toForm" type="primary" size="mini" plain>前往生成的云端一体页面</button>
    </view>
</template>

<script>
import schemaCode from './schemaCode';
    export default {
        data() {
            return {
				schemaCode:schemaCode,
				videoUrl:"https://web-assets.dcloud.net.cn/unidoc/zh/schema2code%E7%9A%84%E4%B8%A4%E7%A7%8D%E6%96%B9%E5%BC%8F.mp4",
				// https://web-assets.dcloud.net.cn/unidoc/zh/create-schema2code-video.mp4
            }
        },
        methods: {
			async showSchemaCode(){
				return this.$refs.alertCode.open(schemaCode)
			},
			toForm(){
				uni.navigateTo({
					url:'../user-info/list'
				})
			}
        }
    }
</script>

<style scoped>
.code-view{
	height:750rpx;
	width: 750rpx;
	padding:5px 8px;
	overflow: scroll;
	background-color:#fffae7;
}
.code-box{
    white-space:nowrap;
	color: #447315;
	font-size: 12px;
}
.root{
	flex-direction: column;
}
.dashed-box{
	border: dashed 1px #EEEEEE;
	border-radius: 5px;
	width: 750rpx;
	position: relative;
}
.uni-title {
	width: 680rpx;
	margin: 15rpx;
	font-size:26rpx;
	padding:20rpx;
	line-height:1.5;
	background-color: #FFFFFF;
}
.uni-title text{
	font-size:24rpx;
	color:#888;
}
.toForm{
	width: 500rpx;
	margin:30px 125rpx;
}
.uni-title text.link{
	color: #586b95;
}
text.tip{
	background-color: #FFFFFF;
	color: #333;
	height: 80px;
	width: 750rpx;
}
.showSchemaCode{
	margin-top: 10px;
}
</style>
