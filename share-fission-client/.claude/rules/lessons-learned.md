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