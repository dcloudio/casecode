import { getCurrentInstance, onMounted, ref } from 'vue'

/**
 * 组合式 API：获取父组件 uniPopup 实例
 * @param {string} name 父组件 name，默认 'uniPopup'
 * @returns {{ popup: import('vue').Ref<import('vue').ComponentPublicInstance | null> }}
 */
export function usePopupParent(name = 'uniPopup') {
  const popup = ref(null)
  onMounted(() => {
    let parent = getCurrentInstance()?.parent
    while (parent) {
      const parentName = parent.type?.name || parent.type?.__name
      if (parentName === name) {
        popup.value = parent.proxy
        break
      }
      parent = parent.parent
    }
  })
  return { popup }
}
