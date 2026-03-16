## 1.4.3（2025-12-08）
- 更新 依赖的uni-id-pages的版本为1.1.25
## 1.4.2（2025-06-24）
- index.html 模板中的 lang="en" 改成 lang="zh-CN"
## 1.4.1（2025-01-13）
- 修复 未关联服务空间时导致项目无法正常显示的问题
## 1.4.0（2024-01-15）
- 更新 db_init.json 按collection拆分，每个collection由schema.json、index.json、init_data.json三个文件描述[详情](https://doc.dcloud.net.cn/uniCloud/hellodb.html#init-db-2)
## 1.3.9（2023-12-29）
- 新增 七牛云扩展存储示例，价格更优、权限更灵活[详见](https://doc.dcloud.net.cn/uniCloud/ext-storage/intro.html)
## 1.3.8（2023-10-24）
- 更新 department 表名称为 opendb-department
- 更新 notice 表名称为 opendb-notice
- 更新 comment 表名称为 opendb-notice-comment
## 1.3.7（2023-05-19）
- 删除错误的css注释
## 1.3.6（2022-11-18）
1. 默认开启云端一体安全网络
2. 修复部分示例弹框不显示问题
## 1.3.5（2022-10-28）
- 新增安全网络示例，[详见](https://uniapp.dcloud.net.cn/uniCloud/secure-network.html)
## 1.3.4（2022-06-29）
新增：支持 ios 安全区
## 1.3.2（2022-06-28）
清除多余的：h5端运行的基础路径配置
## 1.3.1（2022-03-09）
修改错误的变量名称
## 1.3.0（2022-02-25）
新增[云对象](https://uniapp.dcloud.net.cn/uniCloud/cloud-obj)基础示例
## 1.2.9（2021-12-30）
新增适用于：数据表记录量较大时的联表查询示例：通过`getTemp`先过滤处理获取临时表再联表查询，提升查询性能。[详情](https://uniapp.dcloud.io/uniCloud/jql?id=lookup)
## 1.2.7（2021-10-12）
默认版本为：`Vue2`
## 1.2.6（2021-10-03）
修改入口页`main.js` 使用`import {createSSRApp} from 'vue' `
## 1.2.5（2021-08-30）
新增Redis使用示例
## 1.2.4（2021-08-24）
兼容vue3
## 1.2.3（2021-04-28）
删除多余的node_modules文件夹
## 1.2.2（2021-04-27）
优化留言板示例中多余的代码
## 1.2.1（2021-04-22）
移除多余的node_modules文件
## 1.2.0（2021-04-22）
升级uni-id版本，修复某些情况下uni-popup-dialog输入框的值获取失败的问题
## 1.0.9（2021-04-09）
1. 新增升级中心
2. 调整为uni_modules目录
## 1.0.8（2021-04-08）
去除测试文件
