# 简介

> 新增于HBuilderX 4.72+  

`uni-ai x`，是一个开源的、全平台的、原生的、云端一体的ai聊天套件。

能够连接ai大模型，真流式接收和输出内容，原生渲染markdown。  
基于跨平台原生开发框架 [uni-app x](https://doc.dcloud.net.cn/uni-app-x/) 可以被编译为不同平台的编程语言，如： 

| 平台						| 编译语言		|
|------					|----------	|
| web平台/小程序	| JavaScript|
| Android平台		| Kotlin		|
| iOS平台				| Swift			|
| 鸿蒙OS平台			| ArkTS			|

## 项目背景：
市面上开源的AI聊天套件大多以Web端为主，像ChatGPT、DeepSeek等的App端并不开源。  
而通过Web-view接入AI的体验差强人意，自己开发面临如下核心挑战：  
- **流式网络请求**：基于POST的SSE技术实现实时数据传输  
- **Markdown流式解析**：动态解析富文本格式标记  
- **编程语言代码高亮**：实现语法识别与样式渲染  
- **Table表格解析渲染**：结构化数据的可视化呈现  
- **流式排版性能**：确保内容加载不阻塞UI交互操作  
- **跨平台开发困境**：缺乏成熟跨平台框架，鸿蒙端开发尤为艰难  
- **极致性能要求**：每个Token需同步完成Markdown解析、代码高亮及排版渲染，运算密集且不能卡顿UI  

**uni-ai x由此应运而生**，专注攻克全平台原生AI聊天场景的技术痛点。

可以满足开发者的如下需求：
1. 基于`uni-ai x`开发全新的ai应用
2. 在之前的app中引入`uni-ai x`的sdk，给app补充ai聊天能力
3. 客户端和服务器均开源，可以自由定制扩展

## 功能和特点

`uni-ai x`功能上参考 deepseek 的客户端设计，并扩展了更多平台。

1. 多端支持与主题适配 
支持Web/H5、iOS、Android、鸿蒙 App、微信小程序。Web 端采用响应式布局，适配 PC 宽屏和移动设备，并提供浅色和暗黑两种主题模式
2. 丰富的 AI 服务集成与高级功能 
集成多家主流 AI 服务商，用户可灵活切换不同 AI 模型，部分模型支持"深度思考"和"联网搜索"等高级能力
3. 消息与会话管理  
支持多轮对话和历史会话管理，具备会话切换、删除、自动创建等功能，提供完整的 AI 聊天体验
4. 高级渲染与输出特性 
支持 AI 回复内容的流式输出和原生 Markdown 格式渲染，内置高性能解析器，支持代码高亮和复杂文本结构展示

各端效果如下截图，依次平台为：iOS、Android、鸿蒙<br/>
<img width="200px" src="https://img-cdn-tx.dcloud.net.cn/stream/plugin_screens/69cf7a60-4b4d-11f0-acb4-1f9e73bd04f1_3.jpg/webp?&v=1752044804"/>
<img width="260px" src="https://img-cdn-tx.dcloud.net.cn/stream/plugin_screens/69cf7a60-4b4d-11f0-acb4-1f9e73bd04f1_1.png/webp?&v=1752044564"/>
<img width="200px" src="https://img-cdn-tx.dcloud.net.cn/stream/plugin_screens/69cf7a60-4b4d-11f0-acb4-1f9e73bd04f1_2.png/webp?&v=1752044569"/>
<br/>
web pc端：
<br/>
<img width="630px" src="https://img-cdn-tx.dcloud.net.cn/stream/plugin_screens/69cf7a60-4b4d-11f0-acb4-1f9e73bd04f1_0.png/webp?&v=1752044560"/>

### Android端demo：

<img width="200px" src="https://web-ext-storage.dcloud.net.cn/doc/uni-ai-x/qrcode.png"/>

扫码或[点此下载](https://web-ext-storage.dcloud.net.cn/doc/uni-ai-x/qrcode.png)

## 交流群  
更多问题欢迎[点此](https://im.dcloud.net.cn/#/?joinGroup=68511b0b7ae60eb5c891cfbc)加入uni-ai官方交流群

当前项目正在快速迭代UI体验，请关注本项目，订阅更新通知。

## 开发文档[详情查看](https://doc.dcloud.net.cn/uniCloud/uni-ai-x.html#install)

## 声明
本项目依赖以下作品
1. markdown 语法解析依赖 [kux-marked](https://ext.dcloud.net.cn/plugin?name=kux-marked)
2. 代码块的字体为 [FiraCode-Regular](https://github.com/tonsky/FiraCode)