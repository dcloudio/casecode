# 文档已移至uni-id-pages文档[https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html)



关于插件更新的说明：

所有uni_modules，在HBuilderX里点右键都可以直接升级。或者在插件市场导入覆盖。

覆盖时HBuilderX会弹出代码差异比对，可以决定接受哪些更改、拒绝哪些更改。

当拒绝局部修改时，注意可能产生兼容性问题。

你需要二次开发uni-id-pages的前端页面，
- 如果改动不大，那么每次更新uni-id-pages时，在HBuilderX的对比界面对比一下就好
- 如果改动较大，建议复制一套前端页面到自己工程的pages目录下，pages.json里只引用根目录pages下的页面，不引用uni_modules下的页面。然后每次uni-id-pages更新，你对比下比上一版uni-id-pages改了什么，看你是否需要再合并到你自己的pages里。pages.json里不引用uni_modules里的页面的话，打包时不会把这些页面打包进去，不影响发行后的包体积