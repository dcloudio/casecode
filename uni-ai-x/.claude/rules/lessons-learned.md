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