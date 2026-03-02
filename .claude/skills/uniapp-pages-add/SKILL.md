# uni-app 新增页面技能

## 触发条件
- 用户请求创建新页面
- 用户请求添加页面路由

## 新增页面步骤

### 1. 创建页面文件
**路径规范**: `pages/模块名/页面名.vue`

```
pages/
└── sf-admin/       # 本项目admin后台专有模块
    └── config/
        └── list.vue
```

### 2. 注册页面路由

#### 方式 A: 注册到主包 (Main Package)
在 `pages.json` 的 `pages` 数组中添加:

```json
{
  "path": "pages/模块名/页面名",
  "style": {
    "navigationBarTitleText": "页面标题"
  }
}
```

#### 方式 B: 注册到分包 (SubPackages) - 推荐
如果页面属于独立模块，建议使用分包。在 `pages.json` 的 `subPackages` 数组中添加或修改:

```json
"subPackages": [
  {
    "root": "pages/sf-admin",  // 分包根目录
    "pages": [
      {
        "path": "config/list",  // 相对路径 (最终为 pages/sf-admin/config/list)
        "style": {
          "navigationBarTitleText": "系统配置"
        }
      }
    ]
  }
]
```

**分包注意事项:**
1. `root` 指定分包根目录。
2. `pages` 数组中的 `path` 是相对于 `root` 的路径，**不要重复写根目录**。
   - 正确: `"path": "config/list"` (root="pages/sf-admin")
   - 错误: `"path": "pages/sf-admin/config/list"`

### 3. Vue3 组合式页面模板

```vue
<template>
  <view class="fix-top-window">
    <view class="uni-header">
      <uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
      <view class="uni-group">
        <!-- 操作按钮区 -->
      </view>
    </view>
    <view class="uni-container">
      <!-- 页面主体内容 -->
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

// ========== 状态定义 ==========
const loading = ref(false)
const formData = reactive({
  // 表单字段
})

// ========== 计算属性 ==========
const computedValue = computed(() => {
  // 计算逻辑
})

// ========== 方法定义 ==========
const loadData = async () => {
  loading.value = true
  try {
    // 加载数据
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 页面样式 */
</style>
```

## 页面跳转

### 保留当前页面，跳转到新页面
```javascript
uni.navigateTo({
  url: '/pages/user/detail?id=123'
})
```

### 关闭当前页面，跳转到新页面
```javascript
uni.redirectTo({
  url: '/pages/user/list'
})
```

### 关闭所有页面，打开新页面
```javascript
uni.reLaunch({
  url: '/pages/index/index'
})
```

### 返回上一页
```javascript
uni.navigateBack({
  delta: 1
})
```

## 获取页面参数

```javascript
import { onLoad } from '@dcloudio/uni-app'

onLoad((options) => {
  const { id } = options
  console.log('页面参数:', id)
})
```

## 常用页面布局类

| 类名 | 说明 |
|------|------|
| `fix-top-window` | 固定顶部窗口 |
| `uni-header` | 页面头部区域 |
| `uni-container` | 页面内容容器 |
| `uni-group` | 按钮组容器 |

## 注意事项
- 【重要】新加的页面需要在 `admin.config.js` 的 `staticMenu` 属性中增加菜单，统一都是  `sf-admin` 菜单的子菜单（菜单最多创建三级，`sf-admin` 自身作为第一级）
- 页面路径不带 `.vue` 后缀
- 首页必须放在 `pages` 数组第一位
- 使用 Vue3 Composition API + `<script setup>` 语法
- 页面文件使用小写 + 连字符命名
- **避免重复注册**: 确保同一个页面路径只出现一次 (不要同时在 `pages` 和 `subPackages` 中注册，也不要在多个分包中注册同一个文件)
