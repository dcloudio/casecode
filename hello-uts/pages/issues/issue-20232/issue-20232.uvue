<template>
	<view>
		<text>issue-20232：{{data.testStatus20232}}</text>
	</view>
</template>

<script setup lang="uts">
import { testArrayBufferToBase64 } from '@/uni_modules/issue-20232'

type DataType = {
  testStatus20232: string;
}

const data = reactive({
  testStatus20232: '测试未通过'
} as DataType)


onLoad(() => {
  const a1 = testArrayBufferToBase64()
  console.log("a1", a1)
  data.testStatus20232 = a1 == 1708 ? "测试通过" : "测试未通过"
})
</script>

<style>

</style>