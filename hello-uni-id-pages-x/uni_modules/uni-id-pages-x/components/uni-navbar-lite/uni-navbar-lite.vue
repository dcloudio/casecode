<template>
  <view class="uni-navbar">
    <view class="uni-navbar-inner" :style="navbarStyle">
      <view class="left-content" @click="back">
        <text class="uni-icons uniui-back"></text>
      </view>
      <view class="uni-navbar-content">
        <slot>{{title}}</slot>
      </view>
      <view class="right-content">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    name: "uni-navbar",
    props: {
      title: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        statusBarHeight: 0
      };
    },
    computed: {
      navbarStyle() {
        return `margin-top:${this.statusBarHeight}px`
      },
    },
    created() {
      const sys = uni.getSystemInfoSync()
      const statusBarHeight = sys.statusBarHeight
      this.statusBarHeight = statusBarHeight
    },
    methods: {
      back() {
        uni.navigateBack({})
      }
    },
  }
</script>

<style>
  @import './uni-icons.css';

  .uni-icons {
    font-family: UniIconsLight;
    text-decoration: none;
    text-align: center;
    font-size: 22px;
    font-style: normal;
    color: #333;
  }

  .uni-navbar {
    border: 1px #eee solid;
    background-color: #fff;
  }

  .uni-navbar-inner {
    position: relative;
    flex-direction: row;
    justify-content: space-between;
    height: 45px;
  }

  .left-content,
  .right-content {
    justify-content: center;
    align-items: center;
    width: 45px;
    height: 100%;
  }

  .uni-navbar-content {
    position: absolute;
    height: 100%;
    top: 0;
    bottom: 0;
    left: 45px;
    right: 45px;
    justify-content: center;
    align-items: center;
  }
</style>
