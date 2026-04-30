# uniCloud 云对象模块层技能

## 触发条件
- 用户请求创建云对象模块/控制器

## 参考文件
创建云对象模块时，请先读取以下文件作为参考模板：

| 类型 | 文件路径 |
|------|----------|
| 模块示例 | `uniCloud-alipay/cloudfunctions/share-fission-co/module/admin/demo.js` |

## 架构说明
模块层 (module) 是控制器层，负责：
- 鉴权 (通过 `_before` 钩子)
- 参数校验
- 调用 service 层
- 返回统一格式

## 目录结构
```
module/
├── admin/           # admin 分组
│   ├── demo.js      # demo 模块
│   └── config.js    # config 模块
└── api/             # api 分组 (可选)
    └── ...
```

前端调用路由格式: `{group}/{module}/{method}`
- 示例: `admin/demo/getList` → `module/admin/demo.js` 的 `getList` 方法

## 注意事项
- 模块层只做参数校验，不做业务逻辑
- 使用 `libs.response.fail()` 函数统一错误返回格式
- 通过 `require('../../service')` 统一导入 service
- update 方法接收完整 data，内部分离 `_id` 和更新数据
- remove 方法接收 `ids` 数组，支持批量删除
- 如果需要登录才能操作的模块，需要在 `_before` 钩子用于统一鉴权，调用 `this.middleware.auth()`
