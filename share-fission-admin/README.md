# 基于uni-ad的社交裂变项目模板（admin端）

## 介绍

本项目是基于uni-ad的社交裂变项目模板（admin端），使用 **uni-app** 和 **uniCloud** 开发，包含客户端（client）和管理后台（admin）两个端。

该模板实现了"看广告赚收益 + 二级分销（分享用户看广告，自己也有收益） + 积分商城"的完整业务闭环，帮助开发者快速搭建自己的分销裂变平台。

## 主要功能

- **广告变现**：用户通过观看广告获得积分和收益
- **二级分销体系**：支持个人收益、一级上线分成、二级上线分成
- **积分商城**：积分可兑换虚拟商品（自动发卡）或提现
- **用户管理**：用户层级关系、团队成员查看
- **财务管理**：资金管理、提现审核、收益结算
- **数据统计**：每日数据趋势、多维度分析报表

## 适用场景

包括但不限于：

- **内容平台**：通过广告分成激励用户分享传播
- **游戏推广**：游戏试玩、广告观看奖励系统
- **知识付费**：课程分销、会员推广
- **营销活动**：裂变拉新、用户增长活动


## 安装步骤

### 安装admin端

#### 导入admin端项目

[admin端下载地址](https://ext.dcloud.net.cn/plugin?name=share-fission-admin)

#### 安装依赖

导入成功后安装npm依赖，执行下方命令

```bash
npm install --registry https://registry.npmmirror.com
```

#### 配置 uniCloud

1. **使用 HBuilderX**，打开项目
2. **右键点击 `uniCloud` 目录** → 选择"关联云服务空间或项目"
3. **创建或选择云服务空间**（支付宝云/阿里云/腾讯云）
4. **上传云函数**：
   - 右键 `uniCloud/cloudfunctions` 目录
   - 选择"上传所有云函数、公共模块及actions"
5. **初始化数据库**：
   - 右键 `uniCloud/database` 目录
   - 选择"初始化云数据库"

#### 运行项目

```bash
# 在 HBuilderX 中点击"运行" → "运行到浏览器" → "Chrome"
```

#### 登录系统

1. 访问 `http://localhost:5678/admin/`
2. 首次进入页面会有管理员注册按钮
---


### 安装client端

#### 导入client端项目

[client端下载地址](https://ext.dcloud.net.cn/plugin?name=share-fission-client)

client端必须绑定admin端项目运行，导入成功后按下图所示操作

![](https://web-ext-storage.dcloud.net.cn/doc/share-fission/ce54b0e8-83ad-44a5-bc9b-71d1bc4a28ba.png)

#### 配置 uni-starter.config.js 文件

配置文件路径: `uni-starter.config.js`

该配置文件会在 `App.vue` 中挂载到 `getApp().globalData.config`,用于全局应用配置。

**主要配置项:**

1. **h5 配置**
   - `url`: 前端网页托管的域名
   - `openApp`: H5端全局悬浮引导用户下载app的功能(可选)
     - `openUrl`: 点击悬浮下载栏后打开的网页链接
     - `appname`: 左侧显示的应用名称
     - `logo`: 应用的图标

2. **mp 小程序配置**
   - `weixin.id`: 微信小程序原始id(用于小程序分享)

3. **about 关于应用**
   - `appName`: 应用名称
   - `logo`: 应用logo路径
   - `company`: 公司名称
   - `slogan`: 应用口号
   - `download`: 应用下载链接(用于分享和生成二维码)
   - `version`: 版本号(非app端显示,app端自动获取)

4. **download 下载配置**
   - `ios`: iOS应用下载链接
   - `android`: Android应用下载链接

5. **marketId 应用市场**
   - `ios`: iOS应用市场ID
   - `android`: Android应用市场ID

6. **ad 广告配置**
   - `rewardedVideo`: 激励视频广告位ID
   - 需要在 [uni-ad 后台](https://uniad.dcloud.net.cn/) 创建广告位后获取
   - 示例: `"rewardedVideo": "1234567890"`

#### 配置广告

**重要提示**: 本项目核心变现方式为激励视频广告,必须正确配置才能正常运行。

**配置步骤:**

1. **在 uni-ad 后台创建广告位**
   - 访问 [uni-ad 后台](https://uniad.dcloud.net.cn/)
   - 选择广告类型: **激励视频广告**
   - 创建后获取广告位ID (adpid)

2. **配置广告位ID（重要）**

   **配置文件**: `uni-starter.config.js`（项目根目录）

   找到或添加 `ad` 配置节点，将你的广告位ID填入 `rewardedVideo` 字段：

   ```javascript
   export default {
     // ...其他配置
     "ad": {
       // 将下面的广告位ID替换为你在uni-ad后台创建的实际广告位ID
       "rewardedVideo": "你的广告位ID"
     }
   }
   ```

3. **技术说明**
   - 广告工具类: `utils/ad.js`
   - 自动从 `uni-starter.config.js` 读取广告位ID
   - 支持通过参数自定义广告位ID

**详细文档**: [uni-ad 广告联盟](https://uniapp.dcloud.net.cn/uni-ad.html)

#### 运行项目

因项目依赖看广告赚佣金，故只支持发布App（小程序此类应用可能无法上架）

```bash
# 在 HBuilderX 中点击"运行" → "运行到手机或模拟器"
```

[自定义基座运行教程](https://uniapp.dcloud.net.cn/tutorial/run/run-app.html#customplayground)

---

## client 端介绍

### 主要功能

#### 猜谜游戏
- **谜语题库**: 内置谜语数据集，支持难度分类(简单、中等、困难)和类型分类(自然、物品、水果、植物、身体、字谜等)
- **答题流程**: 用户查看谜面 → 输入答案 → 验证正确性 → 答对进入下一题
- **广告解锁**: 答不出时可观看激励视频广告解锁答案
- **进度追踪**: 显示当前答题进度和题目序号
- **页面路径**: `pages/index/index.vue`
- **数据源**: `data/riddles.js` (200条谜语数据)

**注意：猜谜游戏非本项目核心功能，可自行替换为其他载体**

#### 积分系统
- **积分获取**:
  - 观看广告获得积分(主要来源)
  - 每日签到奖励
  - 团队分成收益(下线观看广告时获得)
- **积分消耗**:
  - 兑换商城商品
  - 提现到账户
- **积分记录**:
  - 完整的积分流水记录
  - 支持时间筛选(全部、今日、本周、本月)
  - 显示积分来源、变化金额、余额
- **页面路径**: `pages/ucenter/points-record/points-record.vue`

#### 二级分销系统
- **分销推荐**:
  - 生成专属推广二维码和邀请码
  - 支持保存二维码到相册
  - 一键复制推广链接
  - 页面路径: `pages/ucenter/distribution-invite/distribution-invite.vue`
  - 技术依赖: `uni_modules/Sansnn-uQRCode` 二维码生成库
- **分销逻辑**:
  - 支持两级分销体系(一级下线、二级下线)
  - 通过 `inviter_uid` 数组记录上级关系链
  - 下线观看广告时,上级自动获得分成
  - 分成比例在系统配置中动态设置
- **我的团队**:
  - 收益统计卡片(积分收益、一级用户数、二级用户数)
  - 时间筛选(全部、今日、本周、本月)
  - 层级切换(一级下线、二级下线)
  - 团队成员列表(头像、昵称、加入时间、贡献积分)
  - 页面路径: `pages/ucenter/my-team/my-team.vue`
- **数据结构**: 用户表中 `inviter_uid` 字段存储上级关系数组 `[一级上级uid, 二级上级uid]`

#### 积分商城
- **商品展示**:
  - 顶部显示当前积分余额
  - 一级分类和二级分类筛选
  - 商品列表展示(图片、名称、积分价格、库存)
  - 支持按积分价格排序(升序/降序)
- **商品兑换**:
  - 商品详情页展示(图片、描述、价格、库存)
  - 立即兑换功能
  - 虚拟商品自动发卡机制
  - 兑换记录查询
- **页面路径**:
  - 商城首页: `pages/ucenter/points-mall/points-mall.vue`
  - 商品详情: `pages/ucenter/product-detail/product-detail.vue`
  - 兑换记录: `pages/ucenter/exchange-order/exchange-order.vue`

#### 提现管理
- **提现申请**:
  - 显示可提现积分余额
  - 提现规则展示(兑换比例、手续费、最低额度、到账时间)
  - 提现方式选择(银行卡、支付宝)
  - 账户信息填写表单
  - 页面路径: `pages/ucenter/withdraw/withdraw.vue`
- **提现记录**:
  - 提现申请历史记录
  - 状态跟踪(待审核、已通过、已拒绝)
  - 显示提现金额、手续费、实际到账金额
  - 申请时间、审核时间
  - 页面路径: `pages/ucenter/withdraw-record/withdraw-record.vue`

#### 用户中心
- **用户信息**: 头像、昵称、登录状态展示
- **常用功能**:
  - 我的积分
  - 积分提现
  - 分销推荐
  - 去评分(App专用)
- **更多服务**:
  - 问题与反馈
  - 设置
  - 检查更新(App专用)
  - 关于(App专用)
- **页面路径**: `pages/ucenter/ucenter.vue`

### 项目结构

```
share-fission/
├── pages/                      # 页面文件
│   ├── index/                  # 首页 - 猜谜语游戏
│   ├── ucenter/                # 用户中心模块
│   │   ├── ucenter.vue        # 用户中心主页
│   │   ├── distribution-invite/   # 分销推荐
│   │   ├── my-team/           # 我的团队
│   │   ├── points-mall/       # 积分商城
│   │   ├── points-record/     # 积分记录
│   │   ├── product-detail/    # 商品详情
│   │   ├── exchange-order/    # 兑换记录
│   │   ├── withdraw/          # 积分提现
│   │   └── withdraw-record/   # 提现记录
│   └── uni-agree/             # 用户协议页面
├── components/                 # 自定义组件
├── data/                      # 数据文件
│   └── riddles.js             # 谜语数据集(39条)
├── common/                    # 公共模块
│   └── appInit.js             # 应用初始化
├── uni_modules/               # uni-app 模块
│   ├── uni-id-pages/          # 用户认证模块
│   ├── uni-ui/                # UI组件库
│   └── Sansnn-uQRCode/        # 二维码生成
├── uniCloud-alipay/           # 云服务(与admin端共享)
│   ├── cloudfunctions/        # 云函数
│   └── database/              # 数据库初始化
├── static/                    # 静态资源
├── manifest.json              # 应用清单配置
├── pages.json                 # 页面路由配置
└── package.json               # 项目依赖配置
```

## admin 端介绍

### 主要功能

- **用户管理**：用户层级关系、团队成员查看
- **商品管理**：商品上下架、分类管理、销量统计
- **订单管理**：订单查看、卡密查看、退款处理、卡密导入
- **财务管理**：资金日志、积分记录、提现管理
- **广告管理**：广告观看记录
- **数据统计**：每日数据趋势、多维度分析报表

### 演示地址

[admin端演示地址](https://env-00jy5svvsbp1-static.normal.cloudstatic.cn/admin/index.html#/)

账号：test-admin
密码：test123456

---

### 项目结构

```
share-fission-admin/
├── pages/                      # 页面文件
│   ├── index/                  # 首页每日统计/仪表盘
│   ├── sf-admin/               # 分销业务模块
│   │   ├── user/               # 用户管理
│   │   ├── goods/              # 商品管理
│   │   ├── goods-categories/   # 商品分类
│   │   ├── orders/             # 订单管理
│   │   ├── card-keys/          # 卡密管理
│   │   ├── config/             # 系统配置
│   │   ├── withdrawal-logs/    # 提现日志
│   │   ├── ad-watch-logs/      # 广告观看日志
│   │   ├── scores/             # 积分记录
│   │   └── fund-pool-logs/     # 资金日志
│   ├── system/                 # 系统管理模块
│   │   ├── menu/               # 菜单管理
│   │   ├── permission/         # 权限管理
│   │   ├── role/               # 角色管理
│   │   ├── user/               # 用户管理
│   │   ├── app/                # 应用管理
│   │   └── tag/                # 标签管理
│   └── uni-stat/               # uni统计模块
├── components/                 # 组件目录
│   ├── uni-nav-menu/           # 导航菜单
│   ├── uni-stat-table/         # 统计表格
│   ├── uni-stat-panel/         # 统计面板
│   └── ...                     # 其他组件
├── store/                      # Vuex 状态管理
├── js_sdk/                     # JavaScript SDK
├── uni_modules/                # uni-app 模块
├── uniCloud/                   # 云服务
│   ├── cloudfunctions/         # 云函数
│   └── database/               # 数据库初始化
├── static/                     # 静态资源
├── admin.config.js             # 管理后台配置
├── App.vue                     # App.vue文件
├── main.js                     # 入口文件
├── manifest.json               # 应用清单配置
├── pages.json                  # 页面路由配置
└── package.json                # 项目依赖配置
```

### 部署指南

#### 部署到线上环境

**一键部署**

在 HBuilderX 中选择"发行" → "上传网站到服务器" → "选择对应的服务空间"，如下图所示

![](https://web-ext-storage.dcloud.net.cn/doc/share-fission/14a885aa-df30-461b-b2de-3eb8ae12c327.png)

---

### 开发指南

#### 添加新页面

**步骤 1：创建页面文件**

在 `pages/sf-admin/` 下创建新目录和文件：
```
pages/sf-admin/my-feature/
└── list.vue
```

**步骤 2：编写页面代码**

```vue
<template>
  <view class="uni-container">
    <uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
    <view class="uni-header">
      <uni-stat-tabs :current="0" :tabs="tabs" />
    </view>
    <!-- 页面内容 -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 数据
    }
  },
  methods: {
    // 方法
  }
}
</script>
```

**步骤 3：配置路由**

在 `pages.json` 中添加页面配置：
```json
{
  "path": "sf-admin/my-feature/list",
  "style": {
    "navigationBarTitleText": "我的功能"
  }
}
```

**步骤 4：添加菜单**

在系统管理 → 菜单管理中添加菜单项。

#### 扩展后端接口

本项目使用 **云对象** 架构，所有业务接口都通过 `share-fission-co` 云对象统一管理。

**步骤 1：创建业务模块**

在 `uniCloud-alipay/cloudfunctions/share-fission-co/module/` 下创建新模块文件：

```
uniCloud-alipay/cloudfunctions/share-fission-co/module/
├── admin/              # 管理端模块
│   ├── demo.js         # 示例模块
│   ├── user.js         # 用户管理
│   └── goods.js        # 商品管理
├── client/             # 客户端模块
└── notify/             # 通知模块
```

**步骤 2：编写模块代码**

在 `module/admin/` 下创建 `myModule.js`：

```javascript
/**
 * 我的模块 - 控制器层
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  // 函数执行前钩子
  async _before() {
    // 登录验证中间件
    await this.middleware.auth();
  },

  // 函数执行后钩子
  _after(error, result) {
    if (error) {
      throw error
    }
    if (typeof result === "object" && !result.errCode) result.errCode = 0;
    return result
  },

  // 查询列表
  async getList(data = {}) {
    // 业务逻辑
    return {
      data: [],
      total: 0
    }
  },

  // 查询详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    // 业务逻辑
    return { data: {} }
  }
}
```

**步骤 3：前端调用接口**

在页面中通过 `uniCloud.importObject` 调用云对象方法：

```javascript
const shareFissionCo = uniCloud.importObject('share-fission-co');

// 调用接口
const res = await shareFissionCo.action({
  name: 'admin/myModule/getList',  // 格式：group/moduleName/method
  data: {
    pageSize: 10,
    pageNum: 1
  }
});
```

**步骤 4：上传云对象**

右键 `share-fission-co` 目录 → 上传部署

#### 使用 Claude Code 的 skills 快速开发

本项目配置了多个 Claude 技能（位于 `.claude/skills/` 目录），可以通过 Claude Code CLI 快速完成常见开发任务。

**可用技能列表**

| 技能命令 | 功能说明 | 使用场景 |
|---------|---------|---------|
| `/crud-table` | 快速创建 CRUD 表格页面 | 创建带增删改查功能的管理页面 |
| `/unicloud-database` | 数据库表操作 | 创建数据库表结构、索引和初始数据 |

**使用示例**

1. **快速创建 CRUD 表格页面**
   ```bash
   # 在 Claude Code CLI 中输入
   /crud-table 表名
   ```
   技能会自动完成：
   - 创建页面文件（table.vue + options.js）
   - 创建云对象模块（module/admin/xxx.js）
   - 创建云对象服务（service/xxx.js）
   - 创建数据库表结构（schema + index + init_data）
   - 注册页面路由（pages.json）
   - 添加菜单配置（admin.config.js，你最终需要把这个菜单配置手动添加到数据库）

2. **创建数据库表**
   ```bash
   /unicloud-database
   ```
   自动生成表结构文件（schema.json、index.json、init_data.json），且会智能设计字段名称

**技能优势**

- **标准化**：自动遵循项目架构规范和代码风格
- **高效**：一键生成完整的功能模块，无需手动创建多个文件
- **准确**：基于项目模板文件生成，避免遗漏关键配置
- **智能**：会根据需求询问功能范围（全量 CRUD 或部分功能）

**注意事项**

- 使用技能前，Claude 会询问具体需求（如表名、字段、功能范围等）
- 生成的代码会参考项目中的 demo 示例文件
- 新增的页面会自动添加到 `admin.config.js` 的静态菜单中
- 所有技能生成的代码都遵循 Vue3 Composition API + `<script setup>` 语法

---

## 附录

### 插件市场地址

- [share-fission-client](https://ext.dcloud.net.cn/plugin?name=share-fission-client)
- [share-fission-admin](https://ext.dcloud.net.cn/plugin?name=share-fission-admin)

### 相关文档

- [uni-app](https://uniapp.dcloud.net.cn/)
- [uni-admin](https://doc.dcloud.net.cn/uniCloud/admin.html)
- [uni-ad](https://uniad.dcloud.net.cn/login)
- [uniCloud](https://doc.dcloud.net.cn/uniCloud/)
- [uniCloud 发行注意事项](https://doc.dcloud.net.cn/uniCloud/publish.html)

---