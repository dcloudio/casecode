# 设计系统规范 - 轻拟物风格

## 设计原则
- 克制使用渐变（仅用于主要 CTA 按钮）
- 自然的阴影效果营造层次
- 统一的圆角规范
- 专业的配色方案
- 细节质感（边框、分割线）

## 颜色系统

### 主色调（品牌色）
```scss
$primary-color: #5B8FF9;           // 主色 - 专业蓝
$primary-light: #7BA5FA;           // 主色浅色
$primary-dark: #3D6FD8;            // 主色深色
$primary-gradient: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);  // 主色渐变（仅用于主要按钮）
```

### 辅助色
```scss
$success-color: #52C41A;           // 成功/积极
$warning-color: #FAAD14;           // 警告/提示
$error-color: #F5222D;             // 错误/危险
$info-color: #1890FF;              // 信息
```

### 中性色
```scss
$text-primary: #262626;            // 主要文字
$text-secondary: #595959;          // 次要文字
$text-tertiary: #8C8C8C;           // 辅助文字
$text-disabled: #BFBFBF;           // 禁用文字

$border-color: #E8E8E8;            // 边框
$divider-color: #F0F0F0;           // 分割线
$bg-color: #FAFAFA;                // 背景色
$bg-white: #FFFFFF;                // 白色背景
```

### 功能色（带透明度）
```scss
$overlay-dark: rgba(0, 0, 0, 0.45);     // 遮罩层
$overlay-light: rgba(0, 0, 0, 0.25);    // 轻遮罩
$shadow-color: rgba(0, 0, 0, 0.08);     // 阴影颜色
```

## 阴影系统

### 标准阴影（3 个级别）
```scss
// 轻阴影 - 用于卡片、输入框
$shadow-light: 0 2px 8px rgba(0, 0, 0, 0.06);

// 中阴影 - 用于悬浮卡片、弹窗
$shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.08);

// 重阴影 - 用于模态框、重要提示
$shadow-heavy: 0 8px 24px rgba(0, 0, 0, 0.12);
```

## 圆角系统

### 标准圆角（4 个级别）
```scss
$radius-small: 4px;      // 小圆角 - 标签、徽章
$radius-medium: 8px;     // 中圆角 - 按钮、输入框
$radius-large: 12px;     // 大圆角 - 卡片
$radius-xlarge: 16px;    // 超大圆角 - 主要卡片
$radius-round: 999px;    // 完全圆形 - 头像、特殊按钮
```

## 间距系统（统一使用 px）

### 标准间距
```scss
$spacing-xs: 4px;        // 超小间距
$spacing-sm: 8px;        // 小间距
$spacing-md: 12px;       // 中间距
$spacing-lg: 16px;       // 大间距
$spacing-xl: 24px;       // 超大间距
$spacing-xxl: 32px;      // 特大间距
```

## 字体系统（强制使用 px）

### 字号
```scss
$font-size-xs: 12px;     // 辅助文字
$font-size-sm: 13px;     // 次要文字
$font-size-base: 14px;   // 基础文字
$font-size-lg: 16px;     // 大文字
$font-size-xl: 18px;     // 标题
$font-size-xxl: 20px;    // 大标题
$font-size-huge: 24px;   // 特大标题
```

### 字重
```scss
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-bold: 600;
```

### 行高
```scss
$line-height-tight: 1.2;
$line-height-normal: 1.5;
$line-height-loose: 1.8;
```

## 组件规范

### 按钮
```scss
// 主要按钮 - 使用渐变
.btn-primary {
  background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(91, 143, 249, 0.25);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 500;
  padding: 12px 24px;
}

// 次要按钮 - 纯色
.btn-secondary {
  background: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  color: #595959;
  font-size: 15px;
  padding: 12px 24px;
}

// 文字按钮
.btn-text {
  background: transparent;
  color: #5B8FF9;
  font-size: 14px;
}
```

### 卡片
```scss
// 标准卡片
.card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 16px;
}

// 强调卡片（带边框）
.card-bordered {
  background: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: 12px;
  padding: 16px;
}

// 主要卡片（带微妙渐变背景）
.card-primary {
  background: linear-gradient(135deg, #5B8FF9 0%, #3D6FD8 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(91, 143, 249, 0.2);
  color: #FFFFFF;
  padding: 20px;
}
```

### 输入框
```scss
.input {
  background: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  color: #262626;
  font-size: 14px;
  padding: 10px 12px;

  &:focus {
    border-color: #5B8FF9;
    box-shadow: 0 0 0 2px rgba(91, 143, 249, 0.1);
  }
}
```

### 标签
```scss
.tag {
  background: #F0F5FF;
  border-radius: 4px;
  color: #5B8FF9;
  font-size: 12px;
  padding: 2px 8px;
}
```

## 使用示例

### 页面布局
```scss
.page {
  background: #FAFAFA;  // 统一背景色
  min-height: 100vh;
}

.container {
  padding: 16px;
}
```

### 列表项
```scss
.list-item {
  background: #FFFFFF;
  border-bottom: 1px solid #F0F0F0;
  padding: 12px 16px;

  &:active {
    background: #FAFAFA;
  }
}
```

## 注意事项

1. **渐变使用原则**：仅在主要 CTA 按钮和重要卡片使用，其他地方使用纯色
2. **阴影使用原则**：不要叠加多个阴影，选择合适的级别即可
3. **圆角使用原则**：同一页面内保持一致，不要混用多种圆角
4. **单位使用原则**：字体强制 px，间距优先 px，布局需要响应式时才用 rpx
5. **颜色使用原则**：避免使用过于饱和的颜色，保持专业感
