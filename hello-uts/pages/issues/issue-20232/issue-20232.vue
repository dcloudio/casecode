<template>
  <view>
    <text>issue-20232：{{ data.testStatus20232 }}</text>
  </view>
</template>

<script>
import { testArrayBufferToBase64 } from '@/uni_modules/issue-20232'

export default {
  data() {
    return {
      data: {
        testStatus20232: '测试未通过'
      }
    }
  },
  onLoad() {
    const a1 = testArrayBufferToBase64()
    this.data.testStatus20232 = a1 == 1708 ? "测试通过" : "测试未通过"
  }
}
</script>

<style>

</style>
