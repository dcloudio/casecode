<template>
  <view class="page-header">
    <view class="header-title-area">
      <view class="page-title">{{ title }}</view>
      <view class="page-subtitle" v-if="subTitle">{{ subTitle }}</view>
    </view>
    <view class="header-extra" v-if="$slots.extra">
      <slot name="extra"></slot>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subTitle: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.page-header {
  background-color: #fff;
  padding: 20px 24px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title-area {
    display: flex;
    align-items: baseline;
    gap: 12px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }

    .page-subtitle {
      font-size: 13px;
      color: #909399;
    }
  }

  .header-extra {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

@media screen and (max-width: 768px) {
  .page-header {
    padding: 16px;

    .header-title-area {
      .page-title {
        font-size: 18px;
      }
    }
  }
}
</style>
