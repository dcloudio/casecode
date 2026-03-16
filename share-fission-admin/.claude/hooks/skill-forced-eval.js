// skill-forced-eval.js 核心逻辑
const instructions = `## 指令：强制技能激活流程（必须执行）

### 步骤 1 - 评估
针对以下每个技能，陈述：[技能名] - 是/否 - [理由]

可用技能列表：
- crud-table: 表格数据CRUD
- unicloud-module: 云对象模块层(控制器)
- unicloud-service: 云对象服务层
- uniapp-pages-add: 新增页面技能
- unicloud-database: 数据库操作

### 步骤 2 - 激活
如果任何技能为"是" → 立即使用 Skill() 工具激活
如果所有技能为"否" → 说明"不需要技能"并继续

### 步骤 3 - 实现
只有在步骤 2 完成后，才能开始实现。`;

console.log(instructions);
