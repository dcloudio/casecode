<template>
  <view
    v-if="showPopup"
    class="uni-popup"
    :class="[popupstyle, isDesktop ? 'fixforpc-z-index' : '', (popupstyle === 'top' || popupstyle === 'left' || popupstyle === 'right') ? 'uni-popup-' + popupstyle : '']"
  >
    <view @touchstart="touchstart">
      <uni-transition
        key="1"
        v-if="maskShow"
        name="mask"
        mode-class="fade"
        :styles="maskClass"
        :duration="duration"
        :show="showTrans"
        @click="onTap"
      />
      <uni-transition
        key="2"
        :mode-class="ani"
        name="content"
        :styles="transClass"
        :duration="duration"
        :show="showTrans"
        @click="onTap"
      >
        <view
          class="uni-popup__wrapper"
          :style="getStyles"
          :class="[popupstyle, (popupstyle === 'left' || popupstyle === 'right') ? 'uni-popup__wrapper-' + popupstyle : '']"
          @click="clear"
        >
          <slot />
        </view>
      </uni-transition>
    </view>
    <!-- #ifdef H5 -->
    <keypress v-if="maskShow" @esc="onTap" />
    <!-- #endif -->
  </view>
</template>

<script setup>
// #ifdef H5
import keypress from "./keypress.js";
// #endif
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

defineOptions({
  name: "uniPopup",
});

const emit = defineEmits(["change", "maskClick"]);

const props = withDefaults(
  defineProps({
    animation: { type: Boolean, default: true },
    type: { type: String, default: "center" },
    isMaskClick: { type: Boolean, default: null },
    maskClick: { type: Boolean, default: null },
    backgroundColor: { type: String, default: "none" },
    safeArea: { type: Boolean, default: true },
    maskBackgroundColor: { type: String, default: "rgba(0, 0, 0, 0.4)" },
    borderRadius: { type: String, default: undefined },
  }),
  { borderRadius: "0" }
);

const config = {
  top: "top",
  bottom: "bottom",
  center: "center",
  left: "left",
  right: "right",
  message: "top",
  dialog: "center",
  share: "bottom",
};

const duration = ref(props.animation ? 300 : 0);
const ani = ref([]);
const showPopup = ref(false);
const showTrans = ref(false);
const popupWidth = ref(0);
const popupHeight = ref(0);
const maskClass = reactive({
  position: "fixed",
  bottom: 0,
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: props.maskBackgroundColor,
});
const transClass = ref({
  backgroundColor: "transparent",
  borderRadius: props.borderRadius || "0",
  position: "fixed",
  left: 0,
  right: 0,
});
const maskShow = ref(true);
const mkclick = ref(
  props.isMaskClick === null && props.maskClick === null
    ? true
    : props.isMaskClick !== null
      ? props.isMaskClick
      : props.maskClick
);
const popupstyle = ref("top");
const messageChild = ref(null);
const clearPropagation = ref(false);
let timer = null;
let safeAreaInsets = 0;

const bg = computed(() => {
  if (props.backgroundColor === "" || props.backgroundColor === "none") {
    return "transparent";
  }
  return props.backgroundColor;
});

const isDesktop = computed(
  () => popupWidth.value >= 500 && popupHeight.value >= 500
);

const getStyles = computed(() => {
  const res = { backgroundColor: bg.value };
  if (props.borderRadius && props.borderRadius !== "0") {
    res.borderRadius = props.borderRadius;
  }
  return res;
});

function setH5Visible(visible = true) {
  // #ifdef H5
  const body = document.getElementsByTagName("body")[0];
  if (body) body.style.overflow = visible ? "visible" : "hidden";
  // #endif
}

watch(
  () => props.type,
  (type) => {
    if (!config[type]) return;
    const fn = config[type];
    if (fn === "top") top(true);
    else if (fn === "bottom") bottom(true);
    else if (fn === "center") center(true);
    else if (fn === "left") left(true);
    else if (fn === "right") right(true);
  },
  { immediate: true }
);

watch(isDesktop, (newVal) => {
  if (!config[newVal]) return;
  const fn = config[props.type];
  if (fn === "top") top(true);
  else if (fn === "bottom") bottom(true);
  else if (fn === "center") center(true);
  else if (fn === "left") left(true);
  else if (fn === "right") right(true);
}, { immediate: true });

watch(
  () => props.maskClick,
  (val) => {
    mkclick.value = val;
  },
  { immediate: true }
);
watch(
  () => props.isMaskClick,
  (val) => {
    mkclick.value = val;
  },
  { immediate: true }
);

watch(showPopup, (show) => {
  setH5Visible(!show);
});

function closeMask() {
  maskShow.value = false;
}

function disableMask() {
  mkclick.value = false;
}

function clear(e) {
  // #ifndef APP-NVUE
  if (e && e.stopPropagation) e.stopPropagation();
  // #endif
  clearPropagation.value = true;
}

function showPoptrans() {
  nextTick(() => {
    showPopup.value = true;
    showTrans.value = true;
  });
}

function open(direction) {
  if (showPopup.value) return;
  const innerType = ["top", "center", "bottom", "left", "right", "message", "dialog", "share"];
  if (!(direction && innerType.indexOf(direction) !== -1)) {
    direction = props.type;
  }
  if (!config[direction]) {
    console.error("缺少类型：", direction);
    return;
  }
  const fn = config[direction];
  if (fn === "top") top();
  else if (fn === "bottom") bottom();
  else if (fn === "center") center();
  else if (fn === "left") left();
  else if (fn === "right") right();
  emit("change", { show: true, type: direction });
}

function close() {
  showTrans.value = false;
  emit("change", { show: false, type: props.type });
  clearTimeout(timer);
  timer = setTimeout(() => {
    showPopup.value = false;
  }, 300);
}

function touchstart() {
  clearPropagation.value = false;
}

function onTap() {
  if (clearPropagation.value) {
    clearPropagation.value = false;
    return;
  }
  emit("maskClick");
  if (!mkclick.value) return;
  close();
}

function top(onlyType) {
  popupstyle.value = isDesktop.value ? "fixforpc-top" : "top";
  ani.value = ["slide-top"];
  transClass.value = {
    position: "fixed",
    left: 0,
    right: 0,
    backgroundColor: bg.value,
    borderRadius: props.borderRadius || "0",
  };
  if (onlyType) return;
  showPopup.value = true;
  showTrans.value = true;
  nextTick(() => {
    showPoptrans();
    if (messageChild.value && props.type === "message") {
      messageChild.value.timerClose();
    }
  });
}

function bottom(onlyType) {
  popupstyle.value = "bottom";
  ani.value = ["slide-bottom"];
  transClass.value = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: safeAreaInsets + "px",
    backgroundColor: bg.value,
    borderRadius: props.borderRadius || "0",
  };
  if (onlyType) return;
  showPoptrans();
}

function center(onlyType) {
  popupstyle.value = "center";
  // #ifdef MP-WEIXIN
  ani.value = ["fade"];
  // #endif
  // #ifndef MP-WEIXIN
  ani.value = ["zoom-out", "fade"];
  // #endif
  transClass.value = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: props.borderRadius || "0",
  };
  // #ifndef APP-NVUE
  transClass.value.display = "flex";
  transClass.value.flexDirection = "column";
  // #endif
  if (onlyType) return;
  showPoptrans();
}

function left(onlyType) {
  popupstyle.value = "left";
  ani.value = ["slide-left"];
  transClass.value = {
    position: "fixed",
    left: 0,
    bottom: 0,
    top: 0,
    backgroundColor: bg.value,
    borderRadius: props.borderRadius || "0",
  };
  // #ifndef APP-NVUE
  transClass.value.display = "flex";
  transClass.value.flexDirection = "column";
  // #endif
  if (onlyType) return;
  showPoptrans();
}

function right(onlyType) {
  popupstyle.value = "right";
  ani.value = ["slide-right"];
  transClass.value = {
    position: "fixed",
    bottom: 0,
    right: 0,
    top: 0,
    backgroundColor: bg.value,
    borderRadius: props.borderRadius || "0",
  };
  // #ifndef APP-NVUE
  transClass.value.display = "flex";
  transClass.value.flexDirection = "column";
  // #endif
  if (onlyType) return;
  showPoptrans();
}

onMounted(() => {
  const fixSize = () => {
    let info;
    // #ifdef MP-WEIXIN
    info = uni.getWindowInfo();
    // #endif
    // #ifndef MP-WEIXIN
    info = uni.getSystemInfoSync();
    // #endif
    const { windowWidth, windowHeight, windowTop, safeArea: sa, screenHeight, safeAreaInsets: insets } = info;
    popupWidth.value = windowWidth;
    popupHeight.value = windowHeight + (windowTop || 0);
    if (sa && props.safeArea) {
      // #ifdef MP-WEIXIN
      safeAreaInsets = screenHeight - sa.bottom;
      // #endif
      // #ifndef MP-WEIXIN
      safeAreaInsets = insets?.bottom ?? 0;
      // #endif
    } else {
      safeAreaInsets = 0;
    }
  };
  fixSize();
});

onUnmounted(() => {
  setH5Visible(true);
});

onActivated(() => {
  setH5Visible(!showPopup.value);
});

onDeactivated(() => {
  setH5Visible(true);
});

function setMessageChild(child) {
  messageChild.value = child;
}

defineExpose({
  open,
  close,
  closeMask,
  disableMask,
  maskShow,
  messageChild,
  setMessageChild,
});
</script>
<style lang="scss">
/* 蒸汽模式：仅单层 class，无 .a .b 组合选择器 */
.uni-popup {
  position: fixed;
  /* #ifndef APP-NVUE */
  z-index: 99;
  /* #endif */
}

.uni-popup-top,
.uni-popup-left,
.uni-popup-right {
  /* #ifdef H5 */
  top: var(--window-top);
  /* #endif */
  /* #ifndef H5 */
  top: 0;
  /* #endif */
}

.uni-popup__wrapper {
  /* #ifndef APP-NVUE */
  display: block;
  /* #endif */
  position: relative;
}

.uni-popup__wrapper-left,
.uni-popup__wrapper-right {
  /* #ifdef H5 */
  padding-top: var(--window-top);
  /* #endif */
  /* #ifndef H5 */
  padding-top: 0;
  /* #endif */
  flex: 1;
}

.fixforpc-z-index {
  /* #ifndef APP-NVUE */
  z-index: 999;
  /* #endif */
}

.fixforpc-top {
  top: 0;
}
</style>
