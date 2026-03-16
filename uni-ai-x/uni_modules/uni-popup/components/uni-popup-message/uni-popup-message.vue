<template>
  <view class="uni-popup-message">
    <view
      class="uni-popup-message__box fixforpc-width"
      :class="'uni-popup__' + type"
    >
      <slot>
        <text
          class="uni-popup-message-text"
          :class="'uni-popup__' + type + '-text'"
          >{{ message }}</text
        >
      </slot>
    </view>
  </view>
</template>

<script setup>
import { getCurrentInstance, onMounted } from "vue";
import { usePopupParent } from "../uni-popup/usePopupParent.js";

/**
 * PopUp 弹出层-消息提示
 */
const props = defineProps({
  type: {
    type: String,
    default: "success",
  },
  message: {
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 3000,
  },
  maskShow: {
    type: Boolean,
    default: false,
  },
});

const { popup } = usePopupParent();

let timer = null;

onMounted(() => {
  if (popup.value) {
    popup.value.maskShow = props.maskShow;
    if (typeof popup.value.setMessageChild === "function") {
      popup.value.setMessageChild(getCurrentInstance()?.proxy);
    } else {
      popup.value.messageChild = getCurrentInstance()?.proxy;
    }
  }
});

function timerClose() {
  if (props.duration === 0) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (popup.value) popup.value.close();
  }, props.duration);
}

defineExpose({
  timerClose,
});
</script>
<style lang="scss">
.uni-popup-message {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  justify-content: center;
}

.uni-popup-message__box {
  background-color: #e1f3d8;
  padding: 10px 15px;
  border-color: #eee;
  border-style: solid;
  border-width: 1px;
  flex: 1;
}

@media screen and (min-width: 500px) {
  .fixforpc-width {
    margin-top: 20px;
    border-radius: 4px;
    flex: none;
    min-width: 380px;
    /* #ifndef APP-NVUE */
    max-width: 50%;
    /* #endif */
    /* #ifdef APP-NVUE */
    max-width: 500px;
    /* #endif */
  }
}

.uni-popup-message-text {
  font-size: 14px;
  padding: 0;
}

.uni-popup__success {
  background-color: #e1f3d8;
}

.uni-popup__success-text {
  color: #67c23a;
}

.uni-popup__warn {
  background-color: #faecd8;
}

.uni-popup__warn-text {
  color: #e6a23c;
}

.uni-popup__error {
  background-color: #fde2e2;
}

.uni-popup__error-text {
  color: #f56c6c;
}

.uni-popup__info {
  background-color: #f2f6fc;
}

.uni-popup__info-text {
  color: #909399;
}
</style>
