## UTS 语言陷阱

### 陷阱1：字符串比较用==（必犯）

```typescript
// ❌ TypeScript习惯（UTS返回false）
"hello" === "hello"  // false
if (type === "sm3") { }

// ✅ UTS语法
"hello" == "hello"   // true
if (type == "sm3") { }
```

原因：AI习惯TypeScript语法自动使用===

### 陷阱2：三方依赖误判混编（必犯）

**症状：** 找不到名称"PackageName" / Cannot find name "SomeClass"

**AI错误理解：** "编译错误 → 需要创建Kotlin/Swift桥接类"

**正确理解：** 这是正常的！
- 编译时（本地）：没有三方库 → 报错正常
- 构建时（打基座）：Gradle/CocoaPods下载库 → 打包进基座
- 运行时（自定义基座）：UTS直接使用原生类 → 正常工作

**正确做法：**
1. 确认config.json配置正确
2. 打自定义基座
3. 使用自定义基座运行
4. ❌ 不要创建NativeBridge封装

关键认知：UTS可直接import/implements原生类和接口，无需混编。这个错误会一直存在直到打了自定义基座。

### 陷阱3：Nullable类型（高频）

```typescript
// ❌ 错误
const value: string = match[1]  // Type mismatch: String?

// ✅ 正确
const value: string = match[1] ?? ''
const value: string = match[1] ?? 'default'
```

### 陷阱4：禁用any

```typescript
// ❌ 错误
function foo(...args: any[]): void { }

// ✅ 正确
function foo(...args: (string | number | null)[]): void { }
```

### 陷阱5：可选参数用剩余参数

```typescript
// ❌ 错误：UTS不支持可选参数
class Crypto {
  sm3(msg: string, options?: SM3Options): string { }
}

// ✅ 正确：使用剩余参数
class Crypto {
  sm3(msg: string, ...args: (SM3Options | null)[]): string {
    const options = args.length > 0 ? args[0] : null
    if (options != null && options.inputEncoding == 'hex') {
      // 处理逻辑
    }
  }
}
```

### 陷阱6：类型定义统一（高频）

```typescript
// ❌ 错误：类型分散（Android运行时ClassCastException）
// interface.uts
export type CryptoKey = { type: string }
// index.uts
class CryptoKeyImpl { type: string }
function importKey(): Promise<CryptoKey> {
  return new CryptoKeyImpl()  // ClassCastException!
}

// ✅ 正确：统一在一个文件
export class CryptoKeyImpl { type: string }
export type CryptoKey = CryptoKeyImpl
```

根因：类型定义分散在多个文件，Android运行时严格检查类型来源

解决步骤：
1. 确定类型定义的单一来源（通常是index.uts）
2. 将接口类型改为具体类类型
3. 导出类型别名：export type MyType = MyClass
4. 所有导入统一从同一个文件

### 陷阱7：错误处理

```typescript
// ❌ 错误
catch (e) {
  console.error(e.stack)            // 不支持stack
  const msg = String(e)              // 不支持String(e)
  const val = someVar ?? undefined  // 不支持undefined
}

// ✅ 正确
catch (e) {
  console.error(e.toString())
  const val: null | SomeVar = someVar
}
```

关键：不支持undefined用null，不支持e.stack用e.toString()