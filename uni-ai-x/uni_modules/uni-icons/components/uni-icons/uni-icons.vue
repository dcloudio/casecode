<template>
  <!-- #ifdef APP-NVUE -->
  <text :style="styleObj" class="uni-icons" @click="_onClick">{{
    unicode
  }}</text>
  <!-- #endif -->
  <!-- #ifndef APP-NVUE -->
  <text
    :style="styleObj"
    class="uni-icons"
    :class="['uniui-' + type, customPrefix, customPrefix ? type : '']"
    @click="_onClick"
  >
    <slot></slot>
  </text>
  <!-- #endif -->
</template>

<script setup>
import { computed } from "vue";
import { fontData } from "./uniicons_file_vue.js";

defineOptions({
  name: "UniIcons",
});

const emit = defineEmits(["click"]);

const props = defineProps({
  type: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "#333333",
  },
  size: {
    type: [Number, String],
    default: 16,
  },
  customPrefix: {
    type: String,
    default: "",
  },
  fontFamily: {
    type: String,
    default: "",
  },
});

const getVal = (val) => {
  const reg = /^[0-9]*$/g;
  return typeof val === "number" || reg.test(val) ? val + "px" : val;
};

const unicode = computed(() => {
  const code = fontData.find((v) => v.font_class === props.type);
  return code ? code.unicode : "";
});

const iconSize = computed(() => getVal(props.size));

const styleObj = computed(() => {
  if (props.fontFamily !== "") {
    return `color: ${props.color}; font-size: ${iconSize.value}; font-family: ${props.fontFamily};`;
  }
  return `color: ${props.color}; font-size: ${iconSize.value};`;
});

function _onClick() {
  emit("click");
}
</script>

<style lang="scss">
/* #ifndef APP-NVUE */
@import "./uniicons.css";

@font-face {
  font-family: uniicons;
  src: url("./uniicons.ttf");
}

/* #endif */
.uni-icons {
  font-family: uniicons;
  text-decoration: none;
  text-align: center;
}
</style>
