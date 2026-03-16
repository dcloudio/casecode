## 1.1.20（2024-04-28）
- uni-id-co 兼容uni-app-x对客户端uniPlatform的调整（uni-app-x内uniPlatform区分app-android、app-ios）
## 1.1.19（2024-03-20）
- uni-id-co 修复 实人认证的认证照片在阿里云服务空间没有保存到指定路径下的Bug
- uni-id-co 修复 云对象开发依赖未移除的Bug
## 1.1.18（2024-02-20）
- 修复 PC设置头像无效的问题
## 1.1.17（2023-12-14）
- uni-id-co 移除一键登录、短信的调用凭据
## 1.1.16（2023-10-18）
- 修复 当不满足一键登录时页面回退无法继续登录的问题
## 1.1.15（2023-07-13）
- uni-id-co 修复 QQ登录时不存在头像时报错的问题
## 1.1.14（2023-05-19）
- 修复 退出登录不会跳转至登录页的问题
## 1.1.13（2023-05-10）
- 修复 启用摇树优化 报错的问题
## 1.1.12（2023-05-05）
- uni-id-co 新增 调用 add-user 接口创建用户时允许触发 beforeRegister 钩子方法，beforeRegister 钩子[详见](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#before-register)
- uni-id-co 新增 自无 unionid 到有 unionid 状态进行登录时为用户补充 unionid 字段
- uni-id-co 修复 i18n 在特定场景下报错的 bug
- uni-id-co 修复 跨平台解绑微信/QQ时无法解绑的 bug
- uni-id-co 修复 微信小程序等平台创建验证码时无法展示的 bug
- uni-id-co 修复 更新 push_clientid 时因 device_id 没有变化导致无法更新
## 1.1.11（2023-03-24）
- 修复 tabbar页面因为token无效而强制跳转至登录页面（url参数包含`uniIdRedirectUrl`）后无法返回的问题
## 1.1.10（2023-03-24）
- 修复 PC微信扫码登录跳转地址错误
- uni-id-co 新增 请求鉴权支持 uni-cloud-s2s 模块验证签名 [uni-cloud-s2s文档](https://uniapp.dcloud.net.cn/uniCloud/uni-cloud-s2s.html)
## 1.1.9（2023-03-24）
- 修复 跳转至登录页面的url参数包含`uniIdRedirectUrl`后无法返回的问题
## 1.1.8（2023-03-02）
- 修复 调试模式下没有对微信授权手机号登录方式进行配置检测
## 1.1.7（2023-02-27）
- 【重要】新增 实名认证功能 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#frv)
## 1.1.6（2023-02-24）
- uni-id-co 新增 注册用户时允许配置默认角色 [文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#config-defult-role)
- uni-id-co 优化 `updateUserInfoByExternal`接口，允许修改头像、性别
- uni-id-co 修复 请求签名密钥字段 `requestAuthSecret` 缺少为空判断
- uni-id-co 修复 `externalRegister`接口头像未使用`avatar_file`字段保存
- 修复 web微信登录回调地址不正确
## 1.1.5（2023-02-23）
- 更新 微信小程序端 更新头像信息，如果是使用微信的头像则不再调用裁剪接口
## 1.1.4（2023-02-21）
- 修复 部分情况下 `uniIdRedirectUrl` 参数无效的问题
## 1.1.3（2023-02-20）
- 修复 非微信小程序端报`TypeError: uni.hideHomeButton is not a function`的问题
## 1.1.2（2023-02-10）
- 新增 微信小程序端 首页需强制登录时，隐藏返回首页按钮
- uni-id-co 新增 外部联登后修改用户信息接口(updateUserInfoByExternal) [文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-update-userinfo)
- uni-id-co 优化外部联登接口（登录、注册）逻辑
## 1.1.1（2023-02-02）
- 新增 微信小程序端 支持选择使用微信资料的“头像”和“昵称” 设置用户资料 [详情参考](https://wdoc-76491.picgzc.qpic.cn/MTY4ODg1MDUyNzQyMDUxNw_21263_rTNhg68FTngQGdvQ_1647431233?w=1280&h=695.7176470588236)
## 1.1.0（2023-01-31）
- 【重要】优化 小程序端资源包大小（运行时大小为：731KB，发行后为：583KB；注：可以直接将本插件作为分包使用）
- 更新 微信小程序端 上传头像功能 用`wx.cropImage`实现图片裁剪
- 修复 选择一键登录时会先显示 非密码登录页面的问题
- 修复 一键登录 点击右上角的关闭按钮没有返回上一页的问题
## 1.0.41（2023-01-16）
- 优化 压缩依赖的文件资源大小
## 1.0.40（2023-01-16）
- 更新依赖的 验证码插件`uni-captcha`版本的版本为 0.6.4 修复 部分情况下APP端无法获取验证码的问题 [详情参考](https://ext.dcloud.net.cn/plugin?id=4048)
- 修复 客户端token过期后，点击退出登录按钮报错的问题
- uni-id-co 修复 updateUser 接口`手机号`和`邮箱`参数值为空字符串时，修改无效的问题
## 1.0.39（2022-12-28）
- uni-id-co 修复 URL化时第三方登录无法获取 uniPlatform 参数
- uni-id-co 修复 validator error
## 1.0.38（2022-12-26）
- uni-id-co 优化 手机号与邮箱验证规则为空字符串时不校验
## 1.0.37（2022-12-09）
- 优化admin端样式
## 1.0.36（2022-12-08）
- uni-id-co 修复 `updateUser` 接口部分参数为空时数据修改异常
## 1.0.35（2022-11-30）
- uni-id-co 新增 匹配到的用户不可在当前应用登录时的错误码 `uni-id-account-not-exists-in-current-app` [错误码说明](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#errcode)
## 1.0.34（2022-11-29）
- 优化 toast 错误提示时间为3秒
- uni-id-co 修复 无法从 clientInfo 中获取 uniIdToken
## 1.0.33（2022-11-25）
- uni-id-co 新增 外部系统联登接口，可为外部系统创建与uni-id相对应的账号，使该账号可以使用依赖uniId的系统及功能 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external)
- uni-id-co 新增 URL化请求时鉴权签名验证 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#http-reqeust-auth)
- uni-id-co 修复 微信登录时用户未设置头像的报错问题
## 1.0.32（2022-11-21）
- 新增 设置密码页面
- 新增 登录后跳转设置密码页面配置项`setPasswordAfterLogin` [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-pwd-after-login)
- uni-id-co 新增 设置密码接口 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#set-pwd)
## 1.0.31（2022-11-16）
- uni-id-co 修复 验证码可能无法收到的bug
## 1.0.30（2022-11-11）
- uni-id-co 修复 用户只有openid时绑定微信/QQ报错
## 1.0.29（2022-11-10）
- uni-id-co 支持URL化方式请求 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#adapter-http)
## 1.0.28（2022-11-09）
- uni-id-co 升级密码加密算法，支持hmac-sha256加密 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#password-safe)
- uni-id-co 新增 开发者可以自定义密码加密规则 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#custom-password-encrypt)
- uni-id-co 新增 支持将其他系统用户迁移至uni-id [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#move-users-to-uni-id)
## 1.0.27（2022-10-26）
- uni-id-co 新增 secureNetworkHandshakeByWeixin 接口，用于建立和微信小程序的安全网络连接
## 1.0.26（2022-10-18）
- 修复 uni-id-pages 导入时异常的Bug
## 1.0.25（2022-10-14）
- uni-id-co 增加 微信授权手机号登录方式 [文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-weixin-mobile)
- uni-id-co 增加 解绑第三方平台账号 [文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-third-account)
- uni-id-co 微信绑定手机号支持通过`getPhoneNumber`事件回调的`code`绑定 [文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#bind-mobile-by-mp-weixin)
- 修复 sendSmsCode 接口未在参数内传递 templateId 时 未能从配置文件读取 templateId 的Bug
## 1.0.24（2022-10-08）
- 修复 报uni-id-users表schema内错误的bug
## 1.0.23（2022-10-08）
- 修复 vue3下vite编译发行打包失败
- 修复 某些情况下注册账号，报TypeErroe：Cannot read properties of undefined （reading ’showToast‘）的错误
## 1.0.22（2022-09-23）
- 修复 某些情况下，修改密码报“两次输入密码不一致”的bug
## 1.0.21（2022-09-21）
- 修复 store.hasLogin的值在某些情况下会出错的bug
## 1.0.20（2022-09-21）
- 新增 store 账号信息状态管理，详情：用户中心页面 路径：`/uni_modules/uni-id-pages/pages/userinfo/userinfo`
## 1.0.19（2022-09-20）
- 修复 小程序端，使用将自定义节点设置成[虚拟节点](https://uniapp.dcloud.net.cn/tutorial/vue-api.html#%E5%85%B6%E4%BB%96%E9%85%8D%E7%BD%AE)的uni-ui组件，样式错乱的问题
## 1.0.18（2022-09-20）
- 修复 微信小程序端 WXSS 编译报错的bug
## 1.0.17（2022.09-19）
- 修复 无法退出登录的bug
## 1.0.16（2022-09-19）
- 修复 在 Edge 浏览器下 input[type="password"] 会出现浏览器自带的密码查看按钮
- 优化 退出登录重定向页面为 uniIdRouter.loginPage
- 新增 注册账号页面支持返回登录页面
## 1.0.15（2022-09-19）
- 更新表结构，解决在uni-admin中部分clientDB操作没有权限的问题
## 1.0.14（2022-09-16）
- 修改 配置项`isAdmin`默认值为`false`
## 1.0.13（2022-09-16）
- 新增 管理员注册页面
- 新增 配置项`isAdmin`区分是否为管理端
- 新增 登录成功后自动跳转；跳转优先级：路由携带(`uniIdRedirectUrl`参数) > 返回上一路由 > 跳转首页
- uni-id-co 优化 注册管理员时管理员存在提示文案
## 1.0.12（2022-09-07）
- 修复 getSupportedLoginType判断是否支持微信公众号、PC网页微信扫码登录方式报错的Bug
- 优化 适配pc端样式
- 新增 邮箱验证码注册
- 新增 邮箱验证码找回密码
- 新增 退出登录(全局)回调事件：`uni-id-pages-logout`，支持通过[uni.$on](https://uniapp.dcloud.net.cn/api/window/communication.html#on)监听;
- 调整 抽离退出登录方法至`/uni_modules/uni-id-pages/common/common.js`中，方便在项目其他页面中调用
- 调整 用户中心（路径：`/uni_modules/uni-id-pages/pages/userinfo/userinfo`）默认不再显示退出登录按钮。支持页面传参数`showLoginManage=true`恢复显示
## 1.0.11（2022-09-01）
- 修复 iOS端，一键登录功能卡在showLoading的问题
- 更新 合并密码强度与长度配置 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#config)
- uni-id-co 修复 调用 removeAuthorizedApp 接口报错的Bug
- uni-id-co 新增 管理端接口 updateUser [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#update-user)
- uni-id-co 调整 为兼容旧版本，未配置密码强度时提供最简单的密码规则校验（长度大于6即可）
- uni-id-co 调整 注册、登录时如果携带了token则尝试对此token进行登出操作
- uni-id-co 调整 管理端接口 addUser 增加 mobile、email等参数 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#add-user)
## 1.0.10（2022-08-25）
- 修复 导入uni-id-pages插件时未自动导入uni-open-bridge-common的Bug
## 1.0.9（2022-08-23）
- 修复 uni-id-co 缺失uni-open-bridge-common依赖的Bug
## 1.0.8（2022-08-23）
- 新增 H5端支持微信登录（含微信公众号内的网页授权登录 和 普通浏览器内网页生成二维码，实现手机微信扫码登录）[详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#weixinlogin)
- 新增 登录成功(全局)回调事件：`uni-id-pages-login-success`，支持通过[uni.$on](https://uniapp.dcloud.net.cn/api/window/communication.html#on)监听;
- 新增 密码强度（是否必须包含大小写字母、数字和特殊符号以及长度）配置 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#config)
- 调整 uni-id-co 密码规则调整，废除之前的简单校验，允许配置密码强度 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#password-strength)
- 调整 uni-id-co 存储用户 openid 时同时以客户端 AppId 为 Key 的副本，参考：[微信登录](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-weixin)、[QQ登录](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#login-by-qq)
- 调整 uni-id-co 依赖 uni-open-bridge-common 存储用户 session_key、access_token 等信息 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#save-user-token)
- 新增 uni-id-co 增加 beforeRegister 钩子用户在注册前向用户记录内添加一些数据 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-summary.html#before-register)
## 1.0.7（2022-07-19）
- 修复 uni-id-co接口 logout时没有删除token的Bug
## 1.0.6（2022-07-13）
- 新增 允许覆盖内置校验规则 [详情](https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#custom-validator)
- 修复 app端clientInfo.appVersionCode为数字导致校验无法通过的Bug
## 1.0.5（2022-07-11）
修复 微信小程序调用uni-id-co接口报错的Bug [详情](https://ask.dcloud.net.cn/question/148877)
## 1.0.4（2022-07-06）
- uni-id-co增加clientInfo字段类型校验
- 监听token更新时机，同步客户端push_clientid至uni-id-device表，改为：同步客户端push_clientid至uni-id-device表和opendb-device表
## 1.0.3（2022-07-05）
新增监听token更新时机，同步客户端push_clientid至uni-id-device表
## 1.0.2（2022-07-04）
修复微信小程序登录时无unionid报错的Bug [详情](https://ask.dcloud.net.cn/question/148016)
## 1.0.1（2022-06-28）
添加相关uni-id表
## 1.0.0（2022-06-23）
正式版
