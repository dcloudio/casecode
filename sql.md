# MongoDB 数据库设计

> 本文档基于 `share-fission-admin` 项目的实际数据库表结构整理

---

## 1. 用户表 (uni-id-users)

> 基于 uni-id 现有用户表，**仅列出本系统相关字段**

### 已有字段（直接复用）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 用户ID（系统自动生成） |
| my_invite_code | String | 专属邀请码 |
| inviter_uid | Array | 全部上级邀请者数组，`[0]`=一级上线，`[1]`=二级上线 |
| invite_time | Timestamp | 受邀时间 |
| register_time | Timestamp | 注册时间 |
| avatar | String | 头像 |
| nickname | String | 昵称 |

> 注：不再单独创建分销关系表，上下级关系通过 `inviter_uid` 数组表达

---

## 2. 积分记录表 (uni-id-scores)

> 基于 uni-id 现有积分记录表

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 记录ID（系统自动生成） |
| user_id | String | 是 | 用户ID |
| score | int | 是 | 本次变化的积分（正数增加，负数减少） |
| type | int | 是 | 积分类型：1=收入，2=支出 |
| balance | int | 是 | 变化后的积分余额 |
| source | String | 是 | 来源：ad_watch/sign_in/team_reward/exchange/withdraw/withdraw_fee_return/admin_adjust/withdraw_refund |
| source_user_id | String | 否 | 来源用户ID（团队奖励时，记录是谁的下线贡献的） |
| relation_level | int | 否 | 关系层级（团队奖励时）：1=一级下线，2=二级下线 |
| order_id | String | 否 | 关联订单ID（兑换商品时） |
| withdrawal_id | String | 否 | 关联提现记录ID（提现时） |
| comment | String | 否 | 备注说明 |
| create_date | Timestamp | 是 | 创建时间（自动填充） |

### 积分来源枚举 (source)

| 值 | 说明 |
|----|------|
| ad_watch | 观看广告获得 |
| sign_in | 每日签到获得 |
| team_reward | 团队奖励（下线看广告） |
| exchange | 兑换商品消耗 |
| withdraw | 提现消耗 |
| withdraw_fee_return | 提现手续费回流 |
| withdraw_refund | 提现退款 |
| admin_adjust | 管理员调整 |

---

## 3. 提现记录表 (sf-withdrawal-logs)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 记录ID（系统自动生成） |
| user_id | String | 是 | 用户ID |
| score | int | 是 | 提现积分数 |
| exchange_rate | Number | 是 | 兑换汇率（元/积分） |
| amount | Number | 是 | 提现金额（元，扣除手续费前） |
| fee_rate | Number | 是 | 手续费比例（如0.2表示20%） |
| fee | Number | 是 | 手续费金额（元） |
| actual_amount | Number | 是 | 实际到账金额（元） |
| method | String | 是 | 提现方式：bank_card/alipay |
| account_info | Object | 是 | 收款账户信息 |
| status | int | 是 | 状态：0=待审核，1=已通过，2=已拒绝，3=已打款 |
| reject_reason | String | 否 | 拒绝原因 |
| audit_time | Timestamp | 否 | 审核时间 |
| pay_time | Timestamp | 否 | 打款时间 |
| create_time | Timestamp | 是 | 申请时间（自动填充） |

### account_info 结构

```json
{
  "type": "alipay",           // 账户类型：bank_card/alipay
  "name": "张三",              // 真实姓名
  "account": "138****8888",   // 账号
  "bank_name": "中国银行"      // 银行名称（银行卡时）
}
```

---

## 4. 商品分类表 (sf-goods-categories)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 分类ID（系统自动生成） |
| parent_id | String | 否 | 父分类ID，为空表示顶级分类 |
| name | String | 是 | 分类名称 |
| level | int | 否 | 分类层级：1=一级分类，2=二级分类 |
| sort | int | 是 | 排序值，数值越小越靠前 |
| status | int | 是 | 状态：0=禁用，1=启用 |
| create_time | Timestamp | 是 | 创建时间（自动填充） |
| update_time | Timestamp | 否 | 更新时间 |

---

## 5. 商品表 (sf-goods)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 商品ID（系统自动生成） |
| name | String | 是 | 商品名称 |
| description | String | 否 | 商品描述 |
| images | Array\<String\> | 是 | 商品图片URL列表（轮播图） |
| detail_images | Array\<String\> | 否 | 详情图URL列表 |
| category_id | String | 是 | 商品分类ID，关联 sf-goods-categories 表 |
| score_cost | int | 是 | 兑换所需积分 |
| stock | int | 是 | 库存数量 |
| sales_count | int | 否 | 销量统计 |
| sort_order | int | 是 | 排序权重（越大越靠前） |
| status | int | 是 | 状态：1=上架，0=下架 |
| is_deleted | Boolean | 是 | 是否删除（软删除），默认 false |
| create_time | Timestamp | 是 | 创建时间（自动填充） |
| update_time | Timestamp | 否 | 更新时间 |

---

## 6. 卡密表 (sf-card-keys)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 卡密ID（系统自动生成） |
| goods_id | String | 是 | 关联商品ID |
| card_no | String | 是 | 卡号 |
| card_pwd | String | 否 | 卡密 |
| exchange_url | String | 否 | 兑换地址 |
| status | int | 是 | 状态：0=未发放，1=已发放 |
| order_id | String | 否 | 关联订单ID |
| used_time | Timestamp | 否 | 使用时间 |
| create_time | Timestamp | 是 | 导入时间（自动填充） |

---

## 7. 订单表 (sf-orders)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 订单ID（系统自动生成） |
| order_no | String | 是 | 订单编号（展示用，纯数字订单号25位） |
| user_id | String | 是 | 用户ID |
| goods_info | Object | 是 | 商品信息快照 |
| score_cost | int | 是 | 消耗积分数 |
| card_key_id | String | 否 | 关联卡密ID |
| status | String | 是 | 状态：complete=已完成，cancel=已取消 |
| create_time | Timestamp | 是 | 下单时间（自动填充） |
| complete_time | Timestamp | 否 | 完成时间 |

### goods_info 结构

```json
{
  "goods_id": "商品ID",
  "name": "商品名称",
  "image": "商品图片",
  "score_cost": 100
}
```

---

## 8. 广告观看记录表 (sf-ad-watch-logs)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 记录ID（系统自动生成） |
| user_id | String | 是 | 用户ID |
| watch_time | Timestamp | 是 | 观看日期（时间戳） |
| ad_type | String | 否 | 广告类型 |
| ad_id | String | 否 | 广告ID |
| score | int | 是 | 获得积分 |
| revenue | Number | 否 | 广告收益（元，实时模式） |
| is_realtime | Boolean | 是 | 是否实时模式 |
| create_time | Timestamp | 是 | 创建时间（自动填充） |

---

## 9. 系统配置表 (sf-system-config)

> 单条记录存储所有配置，`_id` 固定为 `"main"`

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| _id | String | 是 | "main" | 固定值 |
| ad_score_mode | int | 是 | 0 | 0: 非实时模式 1: 实时模式 |
| ad_score_base | int | 是 | 30 | 单次广告基础积分（非实时模式） |
| ad_score_rate | int | 是 | 1000 | 广告收益转积分比例（实时模式，1元=1000积分） |
| ad_score_self_rate | Number | 是 | 0.5 | 自己获得积分比例（50%） |
| ad_score_l1_rate | Number | 是 | 0.25 | 一级上线获得积分比例（25%） |
| ad_score_l2_rate | Number | 是 | 0.25 | 二级上线获得积分比例（25%） |
| ad_daily_limit | int | 是 | 10 | 每日广告观看次数限制 |
| withdrawal_fee_rate | Number | 是 | 0.2 | 提现手续费比例（20%） |
| withdrawal_min_score | int | 是 | 1000 | 最低提现积分 |
| minimum_exchange_ratio | int | 是 | 0 | 保底兑换比例，当实际兑换比例小于该值时，用户提现以保底兑换比例为准 |
| update_time | Timestamp | 否 | - | 更新时间 |

---

## 10. 资金池表 (sf-fund-pool)

> 用于计算积分兑换汇率，单条记录，`_id` 固定为 `"main"`

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 固定值："main" |
| total_cash | Number | 是 | 资金池总现金（元） |
| total_score | int | 是 | 资金池总积分 |
| exchange_rate | Number | 是 | 当前汇率（元/积分） |
| update_time | Timestamp | 否 | 更新时间 |

---

## 11. 资金池流水表 (sf-fund-pool-logs)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 记录ID（系统自动生成） |
| type | String | 是 | 类型：ad_income/withdrawal/fee_return |
| cash_change | Number | 是 | 现金变动（元） |
| score_change | int | 是 | 积分变动 |
| cash_balance | Number | 是 | 变动后现金余额 |
| score_balance | int | 是 | 变动后积分余额 |
| exchange_rate | Number | 是 | 变动后汇率 |
| related_id | String | 否 | 关联记录ID |
| remark | String | 否 | 备注 |
| statement_date | String | 否 | 结算日期，格式为：2026-01-01 |
| create_time | Timestamp | 是 | 创建时间（自动填充） |

---

## 12. 数据统计表 (sf-daily-statistics)

> 按日聚合统计数据

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | String | 是 | 记录ID（系统自动生成） |
| statement_date | String | 否 | 结算日期，格式为：2026-01-01 |
| ad_revenue | Number | 是 | 广告收益（元），默认 0 |
| score_added | int | 是 | 新增积分，默认 0 |
| score_consumed | int | 是 | 消耗积分（兑换商品），默认 0 |
| score_withdrawn | int | 是 | 提现积分，默认 0 |
| new_users | int | 是 | 新增用户数，默认 0 |
| active_users | int | 是 | 活跃用户数（当日登录），默认 0 |
| viewers_count | int | 是 | 观看人数，默认 0 |
| views_count | int | 是 | 观看次数，默认 0 |
| total_cash | Number | 是 | 当日资金池总现金（元），默认 0 |
| total_score | int | 是 | 当日资金池总积分，默认 0 |
| exchange_rate | Number | 是 | 当日汇率（元/积分），默认 0.01 |
| is_settled | Boolean | 是 | 是否已结算，默认 false |
| remark | String | 否 | 备注 |
| update_time | Timestamp | 否 | 更新时间 |

---

## 表关系说明

1. **用户 → 积分记录**：`uni-id-users._id` → `uni-id-scores.user_id`
2. **用户 → 提现记录**：`uni-id-users._id` → `sf-withdrawal-logs.user_id`
3. **用户 → 订单**：`uni-id-users._id` → `sf-orders.user_id`
4. **用户 → 广告观看记录**：`uni-id-users._id` → `sf-ad-watch-logs.user_id`
5. **商品分类 → 商品**：`sf-goods-categories._id` → `sf-goods.category_id`
6. **商品 → 卡密**：`sf-goods._id` → `sf-card-keys.goods_id`
7. **订单 → 卡密**：`sf-orders.card_key_id` → `sf-card-keys._id`
8. **积分记录 → 订单**：`uni-id-scores.order_id` → `sf-orders._id`
9. **积分记录 → 提现记录**：`uni-id-scores.withdrawal_id` → `sf-withdrawal-logs._id`

---
