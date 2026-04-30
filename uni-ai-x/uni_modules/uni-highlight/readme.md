# uni-highlight
## 本插件支持基于 TextMate 语法规则（如 javascript.tmLanguage.json）的前端代码高亮渲染
### 功能介绍
- 用于代码文本高亮



##  使用指南：基于 TextMate Grammar 的前端语法高亮插件

本插件支持基于 TextMate 语法规则（如 javascript.tmLanguage.json）的前端代码高亮渲染。


###  快速开始

1. 引入uni-modules插件
``` typescript
import { createHighLighter } from "../../uni_modules/uni-highlight
```
2. 准备语法定义文件（.tmLanguage.json）

准备好你需要的语法定义文件，例如：
	•	JavaScript.tmLanguage.json
	•	TypeScript.tmLanguage.json

确保你的语法文件使用 JSON 格式。


3. 初始化高亮器

``` typescript
import grammar from './javascript.tmLanguage.json'
	let uniCodeHighlighter = await createHighLighter({
		languages: {
			'javascript': grammar
		}
	})
```

###注意：引入.tmLanguage.json时，不同平台为不同的引入方式###

``` typescript

// #ifdef WEB || APP-IOS  || MP-WEIXIN
import grammar from './javascript.tmLanguage.json'
...
// #endif

// #ifdef APP-ANDROID || APP-HARMONY
let fileManager = uni.getFileSystemManager()
let content = fileManager.readFileSync('xxxx.tmLanguage.json', 'utf-8') as string
let grammar = JSON.parse(content)
...
// #endif

let uniCodeHighlighter = await createHighLighter({
	languages: {
		'javascript': grammar
	}
})
```

4. 传入代码文本进行高亮

```typescript
const sourceCode =
`
import App from './App.uvue'

import { createSSRApp } from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	return {
		app
	}
}
`

let tokens:[] as Array<IToken> = []

let res = await uniCodeHighlighter.tokenizeFullText('javascript', sourceCode)

const text = sourceCode.split(/\r|\n|\r\n/)

ILineTokensList.forEach((line, i) => {
	line.tokens.forEach((tk) => {
		tokens.push({
			text: text[i].substring(tk.startIndex, tk.endIndex),
			className: tk.scopes[tk.scopes.length - 1].split(".")[0]
		})
	})
	tokens.push({
		text: "\n",
		className: "eol"
	});
})


```



5. 配置样式（CSS）

你可以为不同 scope 定义样式类，例如：

``` css
.tok-keyword { color: #d73a49; font-weight: bold; }
.tok-variable { color: #6f42c1; }
.tok-string { color: #032f62; }
.tok-number  { color: #005cc5; }
.tok-comment { color: #6a737d; font-style: italic; }
```



###  IToken 数据结构说明

高亮器返回的 token 结构如下：
``` typescript
export interface IToken {
  readonly startIndex: number
  readonly endIndex: number
  readonly scopes: string[]
}

export interface ILineTokens {
  readonly tokens: IToken[]
  readonly state: any  // 用于跨行状态管理（如多行注释）
}

```



