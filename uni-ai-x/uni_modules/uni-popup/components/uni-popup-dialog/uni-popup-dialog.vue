<template>
  <view class="uni-popup-dialog">
    <view class="uni-dialog-title">
      <text
        class="uni-dialog-title-text"
        :class="['uni-popup__' + dialogType]"
        >{{ titleText }}</text
      >
    </view>
    <view v-if="mode === 'base'" class="uni-dialog-content">
      <slot>
        <text class="uni-dialog-content-text">{{ content }}</text>
      </slot>
    </view>
    <view v-else class="uni-dialog-content">
      <slot>
        <input
          class="uni-dialog-input"
          :maxlength="maxlength"
          v-model="val"
          :type="inputType"
          :placeholder="placeholderText"
          :focus="focus"
        />
      </slot>
    </view>
    <view class="uni-dialog-button-group">
      <view class="uni-dialog-button" v-if="showClose" @click="closeDialog">
        <text class="uni-dialog-button-text">{{ closeText }}</text>
      </view>
      <view
        class="uni-dialog-button"
        :class="showClose ? 'uni-border-left' : ''"
        @click="onOk"
      >
        <text class="uni-dialog-button-text uni-button-color">{{
          okText
        }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { usePopupParent } from "../uni-popup/usePopupParent.js";
import { initVueI18n } from "@dcloudio/uni-i18n";
import messages from "../uni-popup/i18n/index.js";
const { t } = initVueI18n(messages);

defineOptions({
  name: "UniPopupDialog",
});

const emit = defineEmits(["confirm", "close", "update:modelValue", "input"]);

const props = defineProps({
  inputType: {
    type: String,
    default: "text",
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  // #ifdef VUE2
  value: {
    type: [String, Number],
    default: "",
  },
  // #endif
  // #ifdef VUE3
  modelValue: {
    type: [Number, String],
    default: "",
  },
  // #endif
  placeholder: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String,
    default: "error",
  },
  mode: {
    type: String,
    default: "base",
  },
  title: {
    type: String,
    default: "",
  },
  content: {
    type: String,
    default: "",
  },
  beforeClose: {
    type: Boolean,
    default: false,
  },
  cancelText: {
    type: String,
    default: "",
  },
  confirmText: {
    type: String,
    default: "",
  },
  maxlength: {
    type: Number,
    default: -1,
  },
  focus: {
    type: Boolean,
    default: true,
  },
});

const { popup } = usePopupParent();

const dialogType = ref("error");
const val = ref("");

const okText = computed(() => props.confirmText || t("uni-popup.ok"));
const closeText = computed(() => props.cancelText || t("uni-popup.cancel"));
const placeholderText = computed(
  () => props.placeholder || t("uni-popup.placeholder")
);
const titleText = computed(() => props.title || t("uni-popup.title"));

watch(
  () => props.type,
  (v) => {
    dialogType.value = v;
  }
);
watch(
  () => props.mode,
  (v) => {
    if (v === "input") dialogType.value = "info";
  }
);
// #ifdef VUE2
watch(
  () => props.value,
  (v) => {
    if (props.maxlength != -1 && props.mode === "input") {
      val.value = String(v).slice(0, props.maxlength);
    } else {
      val.value = v;
    }
  }
);
// #endif
// #ifdef VUE3
watch(
  () => props.modelValue,
  (v) => {
    if (props.maxlength != -1 && props.mode === "input") {
      val.value = String(v).slice(0, props.maxlength);
    } else {
      val.value = v;
    }
  }
);
// #endif
watch(val, (v) => {
  // #ifdef VUE2
  emit("input", v);
  // #endif
  // #ifdef VUE3
  emit("update:modelValue", v);
  // #endif
});

onMounted(() => {
  if (popup.value) popup.value.disableMask();
  if (props.mode === "input") {
    dialogType.value = "info";
    // #ifdef VUE2
    val.value = props.value;
    // #endif
    // #ifdef VUE3
    val.value = props.modelValue;
    // #endif
  } else {
    dialogType.value = props.type;
  }
});

function onOk() {
  if (props.mode === "input") {
    emit("confirm", val.value);
  } else {
    emit("confirm");
  }
  if (props.beforeClose) return;
  if (popup.value) popup.value.close();
}

function closeDialog() {
  emit("close");
  if (props.beforeClose) return;
  if (popup.value) popup.value.close();
}

function close() {
  if (popup.value) popup.value.close();
}

defineExpose({
  close,
});
</script>

<style lang="scss">
.uni-popup-dialog {
  width: 300px;
  border-radius: 11px;
  background-color: #fff;
}

.uni-dialog-title {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  justify-content: center;
  padding-top: 25px;
}

.uni-dialog-title-text {
  font-size: 16px;
  font-weight: 500;
}

.uni-dialog-content {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.uni-dialog-content-text {
  font-size: 14px;
  color: #6c6c6c;
}

.uni-dialog-button-group {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  border-top-color: #f5f5f5;
  border-top-style: solid;
  border-top-width: 1px;
}

.uni-dialog-button {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */

  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 45px;
}

.uni-border-left {
  border-left-color: #f0f0f0;
  border-left-style: solid;
  border-left-width: 1px;
}

.uni-dialog-button-text {
  font-size: 16px;
  color: #333;
}

.uni-button-color {
  color: #007aff;
}

.uni-dialog-input {
  flex: 1;
  font-size: 14px;
  border: 1px #eee solid;
  height: 40px;
  padding: 0 10px;
  border-radius: 5px;
  color: #555;
}

.uni-popup__success {
  color: #4cd964;
}

.uni-popup__warn {
  color: #f0ad4e;
}

.uni-popup__error {
  color: #dd524d;
}

.uni-popup__info {
  color: #909399;
}
</style>
