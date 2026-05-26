<template>
  <view>
    <text>issue-26943：{{ data.testStatus26943 }}</text>
  </view>
</template>

<script>
import { testGenericCallback } from '@/uni_modules/issue-26943'

export default {
  data() {
    return {
      data: {
        testStatus26943: '测试未通过'
      }
    }
  },
  onLoad() {
    testGenericCallback({
      success: (res) => {
        this.data.testStatus26943 = JSON.stringify(res) === JSON.stringify(['a', 'b']) ? '测试通过' : '测试未通过'
      }
    })
  }
}
</script>

<style>

</style>
