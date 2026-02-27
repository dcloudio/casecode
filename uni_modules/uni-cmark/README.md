# uni-cmark

一个由 AI 基于 C 语言库 [cmark-gfm](https://github.com/github/cmark-gfm.git) 封装的 Markdown 解析 UTS 插件，适用于 uni-app 生态。

## 功能特点

- **高性能解析**：底层采用 C 语言实现的 cmark-gfm 库，确保了卓越的解析性能和效率。
- **全平台支持**：支持 uni-app 及 uni-app x 项目，并可运行于 Android、iOS、Web 及微信小程序等平台。
- **流式解析能力**：支持实时流式 Markdown 解析，非常适合集成到 AI 聊天等需要增量显示内容的场景中。详情可参考 [uni-ai-x](https://doc.dcloud.net.cn/uniCloud/uni-ai-x.html)。
- **完整语法兼容**：全面支持标准 Markdown 语法以及 GitHub Flavored Markdown (GFM) 扩展语法。

## 基本使用

在使用 `md2json` 进行解析之前，**必须先调用 `initCmark` 进行初始化**。该初始化在应用生命周期内调用一次即可。

```typescript
import { md2json, initCmark } from '@/uni_modules/uni-cmark'

// 初始化 cmark-gfm 库（仅 Web 和微信小程序端需要此操作，其他平台为空实现）
await initCmark()

// 待解析的 Markdown 文本
const markdownText = `# 标题
这是一个**粗体**文本和*斜体*文本。

\`\`\`javascript
console.log('Hello World')
\`\`\`
`

// 解析 Markdown 文本
// 根据平台差异，返回值的类型会有所不同
// #ifdef APP-IOS
// iOS 端：为优化性能，返回的是一个 JSON 字符串
const jsonString = md2json(markdownText) as string;
const jsonList = JSON.parse(jsonString) as MarkdownToken[];
// #endif

// #ifndef APP-IOS
// 非 iOS 端：返回一个包含数据和错误信息的对象
const parseMdRes = md2json(markdownText) as ParseMdRes;
if (parseMdRes.errorMsg) {
	console.error('解析失败:', parseMdRes.errorMsg);
}
const jsonList = parseMdRes.data;
// #endif

console.log(jsonList);
```


### 参数

- `markdownText: string` - 必需。需要被解析的原始 Markdown 格式文本。

### 返回值

`md2json` 函数的返回值类型会根据运行平台的不同而变化：

- **iOS 平台**：
返回值为 `string` 类型。这是一个 JSON 格式的字符串。这样做是为了减少 UTS 插件层与 JS 层之间的通信开销，在 JS 层统一进行 `JSON.parse` 通常能获得更好的整体性能。

- **非 iOS 平台** (Android, Web, 微信小程序等)：
返回值为 `ParseMdRes` 对象类型，其结构如下：
```typescript
type ParseMdRes = {
		data: MarkdownToken[],  // 解析成功后得到的 Markdown 抽象语法树（AST）
		errorMsg: string        // 解析过程中产生的错误信息。如果解析成功，该字段为空字符串
}
```

## 数据结构

### `MarkdownToken`

`MarkdownToken` 是 Markdown 文本被解析后生成的抽象语法树（AST）中的节点。每个节点代表一个 Markdown 元素。

```typescript
type MarkdownToken = {
    type?: string;           // 节点类型 (例如: 'heading', 'paragraph', 'strong', 'list')
    raw?: string;            // 该节点对应的原始 Markdown 文本片段
    text?: string;           // 节点的纯文本内容（如果适用）
    html?: string;           // 节点对应的 HTML 字符串表示（如果适用）
    tokens?: MarkdownToken[];// 子节点数组，用于表示复合元素（如列表、加粗文本等）
    checked?: number;        // 仅用于任务列表项，表示是否被选中。0 为未选中，1 为选中。
    escaped?: number;        // (内部使用) 标记文本是否已转义
    pre?: number;            // (内部使用) 标记是否处于预格式化块中
    block?: number;          // 标记该节点是否为块级元素。0 为行内元素，1 为块级元素。
    ordered?: number;        // 仅用于列表，表示是否为有序列表。0 为无序列表，1 为有序列表。
    loose?: number;          // 仅用于列表，表示列表的紧凑程度。0 为紧凑列表，1 为松散列表。
    task?: number;           // 仅用于列表项，表示是否为任务列表项。0 或 1。
    inLink?: number;         // (内部使用) 标记节点是否位于链接内部
    inRawBlock?: number;     // (内部使用) 标记节点是否位于原始文本块内部
    isClose?: number;        // (内部使用) 标记是否为闭合标签
    codeBlockStyle?: 'indented'; // 仅用于代码块，表示代码块的样式（如 'indented' 表示缩进式）
    lang?: string;           // 仅用于代码块，表示代码的编程语言（如 'javascript', 'python'）
    tag?: string;            // 节点对应的 HTML 标签名（如 'h1', 'p', 'strong'）
    href?: string;           // 仅用于链接或图片，存储 URL 地址
    title?: string;          // 仅用于链接或图片，存储标题（hover 时显示）
    depth?: number;          // 节点在 AST 中的嵌套深度
    start?: number | string; // 仅用于有序列表，表示列表的起始编号
    items?: MarkdownToken[]; // 仅用于列表，包含列表项的数组
    align?: 'center' | 'left' | 'right' | null; // 仅用于表格单元格，表示对齐方式。
    codeTokens?: MarkdownToken[][]; // (内部使用) 用于语法高亮的代码标记
    deepIndex?: number;      // (内部使用) 深度索引
    orderedIndex?: number;   // (内部使用) 有序索引
    className?: string;      // 建议的 CSS 类名
    uniqueId?: string;       // 节点的唯一标识符
    start_column?: number;   // 节点在原始文本中的起始列号
    end_column?: number;     // 节点在原始文本中的结束列号
    width?: number;          // (较少使用) 宽度信息
    height?: number;         // (较少使用) 高度信息
}
```
*注*：
1. 带有 `(内部使用)` 标记的字段主要用于插件内部逻辑，在大多数上层应用场景中，你可能不需要关注这些字段。
2. 在 Swift + UTS 环境中部分情况下布尔值存在限制，本插件用数字 0 和 1 替代布尔值的 true false

## 相关项目

- [uni-ai-x](https://gitcode.com/dcloud/uni-ai-x) - 一个基于 uni-cmark 构建的 AI 聊天 UI 套件。
- [cmark-gfm](https://github.com/github/cmark-gfm) - uni-cmark 插件所依赖的底层 C 语言 Markdown 解析库。