<template>
  <view>
    <text>issue-26943：{{data.testStatus26943}}</text>
  </view>
</template>

<script setup lang="uts">
import { testGenericCallback } from '@/uni_modules/issue-26943'

type DataType = {
  testStatus26943: string;
}

const data = reactive({
  testStatus26943: '测试未通过'
} as DataType)

onLoad(() => {
  testGenericCallback({
    success(res) {
      data.testStatus26943 = JSON.stringify(res) == JSON.stringify(["a", "b"]) ? "测试通过" : "测试未通过"
    }
  })
})

defineExpose({
  data
})
</script>

<style>

</style>