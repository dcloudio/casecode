# 经验教训登记册

> 只记录已达到 DoD 并验证有效的经验

## 代码风格

### 使用可选链操作符

```javascript
// 错误
if (!msg.body || !msg.body.updateData) return ""

// 正确
if (!msg.body?.updateData) return ""
```

### 单位使用规范

**原则：px 为主，特殊需要自适应时才使用 rpx**

```css
/* 推荐：固定尺寸使用 px */
.border {
  border: 1px solid #ddd;  /* 边框用 px */
}

.fixed-element {
  width: 100px;
  height: 50px;
  padding: 10px 15px;
}

/* 特殊情况：需要响应式自适应时使用 rpx */
.responsive-card {
  width: 690rpx;  /* 需要在不同屏幕下等比缩放 */
  padding: 30rpx;
  font-size: 28rpx;  /* 字体需要响应式 */
}
```

**适用场景：**
- px：**文字字号（强制）**、边框、固定尺寸元素
- rpx：需要在不同屏幕尺寸下等比缩放的布局、间距

**强制规则：**
- ✅ 所有 `font-size` 必须使用 px
- ❌ 禁止使用 `font-size: 28rpx`

## uni-app H5 自动化测试

### 自定义组件应按渲染后的 DOM 验收

uni-app 的自定义组件在 H5 中会编译为 `uni-view`、`uni-image` 等标签，Playwright 不应依赖源码标签名。优先选择稳定的业务类名；需要测量组件内部尺寸时，先检查渲染后的 DOM，并区分父容器的边框盒与子元素的内容盒。

验证方式：使用 Playwright 在 320px、375px、430px 视口检查个人中心页，并覆盖长昵称、头像渲染、横向溢出和设置入口跳转。

## uni-app 自定义导航安全区

### 绝对定位装饰应共享状态栏偏移

自定义头部根据 `statusBarHeight` 下移标题或返回按钮时，灯笼题字等绝对定位装饰也必须使用同一安全区偏移量。只扩高容器而保持装饰的固定 `top`，会在高状态栏设备上产生交叠。

验证方式：使用 Playwright 在 320px、375px、430px 视口模拟 59px 状态栏，确认返回按钮、标题云纹与灯笼题字的边界框均无重叠。
