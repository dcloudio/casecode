# CRUD 表格页面技能

## 触发条件
- 用户请求创建 CRUD 表格页面

## 用户选择
- 必须要先让用户选择是否支持 CRUD 全量功能，比如有些页面可能只要R，有些是不能C、D等等，选项为【全部】、【查看】、【新增】、【编辑、删除】、【其他】，如果用户选择了【其他】，必须要让用户先输入要实现的功能
- 如果用户明确已说出指令，如需要全量功能或只要查看等，则不再需要上面的用户选择步骤
 
## 参考文件
创建 CRUD 表格页面时，请先读取以下文件作为参考模板：

| 类型 | 文件路径 |
|------|----------|
| 页面模板 | `pages/demo/table/table.vue` |
| 列配置 | `pages/demo/table/options.js` |
| 云对象模块 | `uniCloud-alipay/cloudfunctions/share-fission-co/module/admin/demo.js` |
| 云对象服务 | `uniCloud-alipay/cloudfunctions/share-fission-co/service/demo.js` |

## 技术栈
- Vue3 Composition API + `<script setup>`
- Element Plus (el-table-v2 虚拟表格)
- uniCloud 云对象

## 创建步骤
1. 读取上述参考文件
2. 根据用户需求创建对应的页面和云端代码
3. 在 `pages.json` 中注册页面路由
4. 在 `service/index.js` 中注册服务模块

## 依赖技能

- `uniapp-pages-add`
- `unicloud-module`
- `unicloud-service`
- `unicloud-database`

## 注意事项
- 使用 `_id` 而非 `id` (MongoDB 文档ID)
- 编辑前必须深拷贝，防止修改影响表格显示
- 所有异步操作使用 `try/catch/finally` 管理 loading
- 弹窗只在操作成功时关闭，失败时保持打开状态
- 移动端适配使用 `.pc-only` 和 `.mobile-only` 控制显示
- 列配置的宽度请勿 `minWidth`，统一使用 `width`
- 【重要】新加的页面需要在 `admin.config.js` 的 `staticMenu` 属性中增加菜单，统一都是  `sf-admin` 菜单的子菜单（菜单最多创建三级，`sf-admin` 自身作为第一级）