<template>
  <view>
    <text>issue-29085：{{testStatus29085}}</text>
  </view>
</template>

<script>
  import { testUTSJSONObjectArray } from '@/uni_modules/issue-29085'
  export default {
    data() {
      return {
        testStatus29085: "测试未通过"
      }
    },
    onLoad() {
      const objs = testUTSJSONObjectArray({
        objs: [{ name: "obj1" }, { name: "obj2" }]
      })
      if (objs.length == 2) {
        this.testStatus29085 = "测试通过"
      }
    },
    methods: {

    }
  }
</script>

<style>

</style>
