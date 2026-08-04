# uniCloud 数据库操作

## 触发条件
- 需要操作数据库时

## 新增表

**步骤**

1. `/uniCloud-alipay/database` 目录创建 `表名.schema.json` 文件，此为表结构，参考 `sf-withdrawal-logs.schema.json`
2. `/uniCloud-alipay/database` 目录创建 `表名.index.json` 文件，此为索引，参考 `sf-withdrawal-logs.index.json`
3. `/uniCloud-alipay/database` 目录创建 `表名.init_data.json` 文件，此为数据库初始数据，参考 `sf-withdrawal-logs.init_data.json`
4. `/uniCloud-alipay/cloudfunctions/share-fission-co/constants/Tables.js` 文件新增表名印射关系

**需要用户操作的事情**

- 用户可能是说新增商品分类表，此时必须要让用户选择几个表名待选项，同时用户也可以直接给表名
- 必须要让用户选择表大致需要实现的功能，这样更方便设计字段

## 常用命令操作符
```javascript
const _ = db.command;

// 比较
_.eq(value)    // 等于
_.neq(value)   // 不等于
_.gt(value)    // 大于
_.gte(value)   // 大于等于
_.lt(value)    // 小于
_.lte(value)   // 小于等于

// 逻辑
_.and([...])   // 与
_.or([...])    // 或
_.not(...)     // 非

// 数组
_.in([...])    // 在数组中
_.nin([...])   // 不在数组中

// 字段
_.exists(true) // 字段存在
_.set(value)   // 设置字段值
_.remove()     // 删除字段
_.inc(n)       // 自增
```

## 注意事项

- 正则查询时，不允许对满足objectid格式的字符串进行正则查询，故需要先判断如果满足objectid格式，则改为相等匹配

示例

```js
const libs = require('../libs'); 

let where = {};
// 关键词搜索
if (libs.common.isObjectId(keyword)) {
  where = _.or([
    { name: keyword },
    { department: keyword }
  ]);
} else {
  where = _.or([
    { name: new RegExp(keyword, 'i') },
    { department: new RegExp(keyword, 'i') }
  ]);
}
```


