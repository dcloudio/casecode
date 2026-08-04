## uni-id-pages-x 示例项目

### 常见问题

1. 报错 `Error: Invalid uni-id config file`

	创建并配置uni-id的配置文件，在目录	`uniCloud/cloudfunctions/common/uni-config-center/` 下新建 `uni-id/config.json` ， [参考文档云端配置config.json的说明完成配置](https://doc.dcloud.net.cn/uniCloud/uni-id/summary.html#config)

2. 报错 `onDBError {code: "SYSTEM_ERROR", message: "Config parameter missing, tokenSecret is required"}`

	在目录 `uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json` 中配置tokenSecret，参考文档[https://doc.dcloud.net.cn/uniCloud/uni-id/summary.html#config](https://doc.dcloud.net.cn/uniCloud/uni-id/summary.html#config)


### 仓库分支与 HBuilder 版本对应关系

- master 对应 [HBuilder](https://www.dcloud.io/hbuilderx.html) 正式版
- alpha 对应 [HBuilder](https://www.dcloud.io/hbuilderx.html) Alpha 版
- dev 对应 [HBuilder](https://www.dcloud.io/hbuilderx.html) 内部 dev 版
