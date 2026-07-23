<template>
  <view class="app-tabbar-space" :style="safeAreaStyle">
    <view class="app-tabbar" role="tablist" aria-label="主导航">
      <view class="tabbar-frame">
        <view class="tabbar-cloud tabbar-cloud-left" aria-hidden="true">
          <view class="cloud-curl cloud-curl-small"></view>
          <view class="cloud-curl cloud-curl-large"></view>
          <view class="cloud-tail"></view>
        </view>
        <view class="tabbar-cloud tabbar-cloud-right" aria-hidden="true">
          <view class="cloud-curl cloud-curl-small"></view>
          <view class="cloud-curl cloud-curl-large"></view>
          <view class="cloud-tail"></view>
        </view>

        <view class="tabbar-items">
          <view
            v-for="item in items"
            :key="item.key"
            class="tabbar-item"
            :class="{ 'tabbar-item-active': item.key === current }"
            role="tab"
            :aria-label="item.text"
            :aria-selected="item.key === current"
            :hover-class="item.key === current ? 'none' : 'tabbar-item-pressed'"
            @click="switchTo(item)"
          >
            <image class="tabbar-icon" :src="item.key === current ? item.selectedIconPath : item.iconPath" mode="aspectFit" draggable="false"></image>
            <text class="tabbar-label">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    name: 'AppTabbar',
    props: {
      current: {
        type: String,
        required: true,
        validator(value) {
          return ['index', 'mall', 'team', 'mine'].includes(value);
        },
      },
    },
    data() {
      return {
        safeAreaBottom: null,
        items: [
          {
            key: 'index',
            text: '猜谜语',
            pagePath: '/pages/index/index',
            iconPath: '/static/tabbar/index.png',
            selectedIconPath: '/static/tabbar/index_active.png',
          },
          {
            key: 'mall',
            text: '积分商城',
            pagePath: '/pages/ucenter/points-mall/points-mall',
            iconPath: '/static/tabbar/mall.png',
            selectedIconPath: '/static/tabbar/mall_active.png',
          },
          {
            key: 'team',
            text: '我的团队',
            pagePath: '/pages/ucenter/my-team/my-team',
            iconPath: '/static/tabbar/grid.png',
            selectedIconPath: '/static/tabbar/grid_active.png',
          },
          {
            key: 'mine',
            text: '我的',
            pagePath: '/pages/ucenter/ucenter',
            iconPath: '/static/tabbar/me.png',
            selectedIconPath: '/static/tabbar/me_active.png',
          },
        ],
      };
    },
    computed: {
      safeAreaStyle() {
        if (this.safeAreaBottom === null) return null;

        return {
          '--tabbar-safe-area-bottom': `${this.safeAreaBottom}px`,
        };
      },
    },
    created() {
      // #ifdef APP-PLUS
      const systemInfo = uni.getSystemInfoSync();
      const safeAreaInsetsBottom = Number(systemInfo.safeAreaInsets?.bottom);
      const derivedSafeAreaBottom =
        systemInfo.safeArea && Number.isFinite(systemInfo.screenHeight)
          ? Math.max(0, systemInfo.screenHeight - systemInfo.safeArea.bottom)
          : 0;
      const safeAreaBottom = Math.max(
        Number.isFinite(safeAreaInsetsBottom) ? safeAreaInsetsBottom : 0,
        derivedSafeAreaBottom,
      );

      this.safeAreaBottom = safeAreaBottom > 0 ? 5 : null;
      // #endif
    },
    mounted() {
      this.hideNativeTabBar();
    },
    methods: {
      hideNativeTabBar() {
        uni.hideTabBar({
          animation: false,
        });
      },
      switchTo(item) {
        if (item.key === this.current) return;

        uni.switchTab({
          url: item.pagePath,
        });
      },
    },
  };
</script>

<style scoped>
  view,
  text,
  image {
    box-sizing: border-box;
    letter-spacing: 0;
  }

  .app-tabbar-space {
    --tabbar-safe-area-bottom: constant(safe-area-inset-bottom);
    --tabbar-safe-area-bottom: env(safe-area-inset-bottom);

    width: 100%;
    height: calc(76px + var(--tabbar-safe-area-bottom, 0px));
    flex: 0 0 auto;
  }

  .app-tabbar {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 9999;
    width: calc(100% - 24px);
    max-width: 430px;
    margin: 0 auto;
  }

  .tabbar-frame {
    position: relative;
    height: calc(72px + var(--tabbar-safe-area-bottom, 0px));
    overflow: hidden;
    padding: 4px 5px calc(4px + var(--tabbar-safe-area-bottom, 0px));
    border: 2px solid #e9ac56;
    border-radius: 27px 27px 24px 24px;
    background: linear-gradient(180deg, rgba(255, 253, 245, 0.98) 0%, rgba(255, 246, 224, 0.98) 100%);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.96), inset 0 0 0 3px rgba(221, 158, 72, 0.24), 0 -4px 14px rgba(125, 66, 19, 0.11), 0 5px 12px rgba(125, 66, 19, 0.2);
  }

  .tabbar-frame::after {
    position: absolute;
    top: 7px;
    right: 8px;
    bottom: calc(7px + var(--tabbar-safe-area-bottom, 0px));
    left: 8px;
    border: 1px solid rgba(226, 178, 105, 0.34);
    border-radius: 20px;
    content: '';
    pointer-events: none;
  }

  .tabbar-items {
    position: relative;
    z-index: 2;
    display: flex;
    width: 100%;
    height: 62px;
    flex-direction: row;
    align-items: stretch;
  }

  .tabbar-item {
    position: relative;
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px 2px 3px;
    border: 1px solid transparent;
    border-radius: 20px;
    transition: background-color 120ms ease, border-color 120ms ease, opacity 120ms ease, transform 120ms ease;
  }

  .tabbar-item-active {
    border-color: rgba(227, 174, 94, 0.56);
    background: rgba(255, 252, 241, 0.96);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.82), 1px 1px 6px rgba(135, 78, 30, 0.13);
  }

  .tabbar-item-pressed {
    opacity: 0.78;
    transform: scale(0.97);
  }

  .tabbar-icon {
    display: block;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    filter: brightness(0) saturate(100%) invert(16%) sepia(42%) saturate(1323%) hue-rotate(346deg) brightness(88%) contrast(96%);
  }

  .tabbar-item-active .tabbar-icon {
    filter: brightness(0) saturate(100%) invert(37%) sepia(96%) saturate(2593%) hue-rotate(353deg) brightness(99%) contrast(93%);
  }

  .tabbar-label {
    display: block;
    max-width: 100%;
    margin-top: 2px;
    overflow: hidden;
    color: #5a2c18;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 13px;
    font-weight: 600;
    line-height: 17px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tabbar-item-active .tabbar-label {
    color: #ed4b20;
    font-weight: 700;
  }

  .tabbar-cloud {
    position: absolute;
    top: 5px;
    z-index: 1;
    display: flex;
    width: 44px;
    height: 16px;
    flex-direction: row;
    align-items: flex-start;
    opacity: 0.52;
    pointer-events: none;
  }

  .tabbar-cloud-left {
    left: 4px;
  }

  .tabbar-cloud-right {
    right: 4px;
    transform: scaleX(-1);
  }

  .cloud-curl {
    flex-shrink: 0;
    border: 1px solid #dba24e;
    border-bottom: 0;
    border-left: 0;
    border-radius: 0 100% 0 0;
  }

  .cloud-curl-small {
    width: 11px;
    height: 7px;
    margin-top: 5px;
  }

  .cloud-curl-large {
    width: 14px;
    height: 10px;
    margin-top: 1px;
    margin-left: -2px;
  }

  .cloud-tail {
    width: 22px;
    height: 1px;
    margin-top: 11px;
    margin-left: -2px;
    background: linear-gradient(90deg, #dba24e, transparent);
    transform: rotate(8deg);
    transform-origin: left center;
  }
</style>
