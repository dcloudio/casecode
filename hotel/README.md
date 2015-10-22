# 目录结构
1. src 为源码目录（为避免 HBuilder 同步 node_modules 等构建工具用到的目录，所以将源码放到 src 目录）
2. docs 为文档目录，包括可能会用到的 ctrip 文档和项目过程中产生的一些文档
3. gulpfile.js 为 gulp（构建工具）脚本文件
4. package.json 为 npm 规范模块配置文件

# 构建说明
1. 分别全局和当前目录安装 gulp (``` [sudo] npm install gulp [-g] ```)
2. 安装构建用模块 (``` npm install ```)
3. 执行 gulp ，执行默认构建任务

# 依赖
1. [MUI](https://github.com/dcloudio/mui)
2. [VUE](https://github.com/vuejs/vue)
3. [jQuery](https://github.com/jquery/jquery)

# 截图
<img src="https://raw.githubusercontent.com/dcloudio/casecode/master/screenshots/hotel.png" width="320"/>
