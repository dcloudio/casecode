# uni-open-bridge

`uni-open-bridge` 


## config.json

```json
{
  "schedule": {
    "__UNI__xxxxxx": {
      "enable": true,
      "mp-weixin": {
        "enable": true,
        "tasks": ["accessToken"]
      },
      "h5-weixin": {
        "enable": false,
        "tasks": ["ticket"]
      }
    }
  },
  "ipWhitelist": ["0.0.0.0"]
}
```

## http 调用

请求类型 `POST`, 需要配置IP白名单字段 `ipWhitelist`，参见 `config.json`

### getAccessToken

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/getAccessToken
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin"
}
```

### setAccessToken

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/setAccessToken
```

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin",
  "value": {
    "access_token": ""
  },
  "expiresIn": 7200
}
```

### removeAccessToken

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/removeAccessToken
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin"
}
```

### getUserKey

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/getUserKey
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin",
  "openid": ""
}
```

### setUserKey

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/setUserKey
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin",
  "openid": "",
  "value": {
    "session_key": ""
  },
  "expiresIn": 7200
}
```

### removeUserKey

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/removeUserKey
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin",
  "openid": ""
}
```

### getTicket

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/getTicket
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin"
}
```


### setTicket

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/setTicket
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin",
  "value": {
    "ticket": ""
  },
  "expiresIn": 7200
}
```

### removeTicket

Url

```
https://xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.bspapp.com/uni-open-bridge/removeTicket
```

参数

```json
{
  "dcloudAppid": "__UNI__xxx",
  "platform": "mp-weixin"
}
```





# uni-open-bridge-common

`uni-open-bridge-common` 是 `uni-id` 体系中用于 `开放平台数据` 管理的公共模块。

> `云函数公共模块`是不同云函数共享代码的一种方式。如果你不了解什么是`云函数公共模块`，请另读文档[公共模块](https://uniapp.dcloud.io/uniCloud/cf-common)

`uni-open-bridge-common` 提供了 `access_token`、`session_key`、`encrypt_key`、`ticket` 的读取、写入、删除操作。

`uni-open-bridge-common` 支持多层 读取 / 写入 机制，`redis -> database -> fallback`，优先级如下:

如果用户没有开通 `redis` 或者操作失败，透传到 `database`，`database` 失败后，如果用户配置了 `fallback`，继续调用 `fallback` 方法，否则抛出 `Error`

`database` 对应的表为: `opendb-open-data`


## access_token

`access_token` 是微信小程序全局唯一后台接口调用凭据，调用绝大多数后台接口时都需使用。开发者可以通过 getAccessToken 接口获取并进行妥善保存。[详情](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/backend-api.html#access_token)


### getAccessToken(key: Object)

读取 access_token


### setAccessToken(key: Object, value: Object, expiresIn: Number)

写入 access_token


### removeAccessToken(key: Object)

删除 access_token


### key 属性

|参数				|类型			|必填	|描述																															|
|:-:				|:-:			|:-:	|:-:																															|
|dcloudAppid|String		|是		|DCloud应用appid。[详情](https://ask.dcloud.net.cn/article/35907)	|
|platform		|String		|是		|[详情](#platform)																								|
|fallback		|Function	|否		|[详情](#fallback)																								|

### value 属性

|参数					|类型		|描述					|
|:-:					|:-:		|:-:					|
|access_token	|String	|							|

### expiresIn

有效时间(秒)


### 示例代码

```js
'use strict';

const {
  getAccessToken,
  setAccessToken,
  removeAccessToken
} = require('uni-open-bridge-common')

exports.main = async (event, context) => {
  const key = {
    dcloudAppid: '',
    platform: ''
  }
  const value = {
    access_token: ''
  }
  const expiresIn = 7200

  // 写入 (redis / 数据库)
  await setAccessToken(key, value, expiresIn)

  // 读取 (redis / 数据库)
  let result1 = await getAccessToken(key)

  // 删除
  await removeAccessToken(key)


  // 删除后读取, 返回 null
  let result2 = await getAccessToken(key)
  console.log(result2) // null

  return null
};
```


## user_key

平台对应的值

|平台				|值					|描述																																																								|
|:-:				|:-:				|:-:																																																								|
|微信小程序	|session_key|微信小程序会话密钥。[详情](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html)	|


### getUserKey(key: Object)

读取 user_key


### setUserKey(key: Object, value: Object, expiresIn: Number)

写入 user_key


### removeUserKey(key: Object)

删除 user_key


### key 属性

|参数				|类型			|必填	|描述																															|
|:-:				|:-:			|:-:	|:-:																															|
|dcloudAppid|String		|是		|DCloud应用appid。[详情](https://ask.dcloud.net.cn/article/35907)	|
|platform		|String		|是		|[详情](#platform)																								|
|openid			|String		|是		|																																	|
|fallback		|Function	|否		|[详情](#fallback)																								|

### value 属性

|参数				|类型		|描述								|
|:-:				|:-:		|:-:								|
|session_key|String	|微信小程序会话密钥	|

### expiresIn

有效时间(秒)


### 示例代码

```js
'use strict';

const {
  getUserKey,
  setUserKey,
  removeUserKey,
} = require('uni-open-bridge-common')

exports.main = async (event, context) => {
  const key = {
    dcloudAppid: '',
    platform: '',
    openid: ''
  }
  const value = {
    'session_key': ''
  }
  const expiresIn = 7200

  // 写入 (redis / 数据库)
  await setUserKey(key, value, expiresIn)

  // 读取 (redis / 数据库)
  let result1 = await getUserKey(key)

  // 删除
  await removeUserKey(key)


  // 删除后读取, 返回 null
  let result2 = await getUserKey(key)
  console.log(result2) // null

  return null
};
```


## encrypt_key

为了避免小程序与开发者后台通信时数据被截取和篡改，微信侧维护了一个用户维度的可靠key，用于小程序和后台通信时进行加密和签名。[详情](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/user-encryptkey.html)

开发者可以分别通过小程序前端和微信后台提供的接口，获取用户的加密 key。


### getEncryptKey(key: Object)

读取 encrypt_key


### setEncryptKey(key: Object, value: Object, expiresIn: Number)

写入 encrypt_key


### removeEncryptKey(key: Object)

删除 encrypt_key


### key 属性

|参数				|类型			|必填	|描述																															|
|:-:				|:-:			|:-:	|:-:																															|
|dcloudAppid|String		|是		|DCloud应用appid。[详情](https://ask.dcloud.net.cn/article/35907)	|
|platform		|String		|是		|[详情](#platform)																								|
|openid			|String		|是		|																																	|
|version		|Number		|是		|版本																															|
|fallback		|Function	|否		|[详情](#fallback)																								|


### value 属性

|参数				|类型		|描述			|
|:-:				|:-:		|:-:			|
|encrypt_key|String	|加密 key	|
|iv					|String	|加密 iv	  |

### expiresIn

有效时间(秒)


### 示例代码

```js
'use strict';

const {
  getEncryptKey,
  setEncryptKey,
  removeEncryptKey
} = require('uni-open-bridge-common')

exports.main = async (event, context) => {
  const key = {
    dcloudAppid: '',
    platform: '',
    openid: '',
    version: 1
  }
  const value = {
    encrypt_key: '',
    iv: ''
  }
  const expiresIn = 7200

  // 写入 (redis / 数据库)
  await setEncryptKey(key, value, expiresIn)

  // 读取 (redis / 数据库)
  let result1 = await getEncryptKey(key)

  // 删除
  await removeEncryptKey(key)

  // 删除后读取, 返回 null
  let result2 = await getEncryptKey(key)
  console.log(result2) // null

  return null
};
```


## ticket

`ticket` 是公众号用于调用微信 JS 接口的临时票据。[详情](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#62)


### getTicket(key: Object)

读取 ticket


### setTicket(key: Object, value: Object, expiresIn: Number)

写入 ticket


### removeTicket(key: Object)

删除 ticket


### key 属性

|参数				|类型			|必填	|描述																															|
|:-:				|:-:			|:-:	|:-:																															|
|dcloudAppid|String		|是		|DCloud应用appid。[详情](https://ask.dcloud.net.cn/article/35907)	|
|platform		|String		|是		|[详情](#platform)																								|
|fallback		|Function	|否		|[详情](#fallback)																								|

### value 属性

|参数				|类型		|描述			|
|:-:				|:-:		|:-:			|
|ticket			|String	|					|

### expiresIn

有效时间(秒)


### 示例代码

```js
'use strict';

const {
  getTicket,
  setTicket,
  removeTicket
} = require('uni-open-bridge-common')

exports.main = async (event, context) => {
  const key = {
    dcloudAppid: '',
    platform: ''
  }
  const value = {
    ticket: ''
  }
  const expiresIn = 7200

  // 写入 (redis / 数据库)
  await setTicket(key, value, expiresIn)

  // 读取 (redis / 数据库)
  let result1 = await getTicket(key)

  // 删除
  await removeTicket(key)


  // 删除后读取, 返回 null
  let result2 = await getTicket(key)
  console.log(result2) // null

  return null
};
```


## Platform@platform

平台对应的值

|值					|描述				|
|:-:				|:-:				|
|mp-weixin	|微信小程序	|
|app-weixin	|微信 App	  |
|h5-weixin	|微信公众号	|
|web-weixin	|微信pc网页	|
|mp-qq			|QQ 小程序		|
|app-qq			|QQ App			|


## fallback@fallback

可选 `async function fallback()`，当 `reids -> database` 都找不到对应 `key` 时，调用此方法，需要返回数据格式如下

```json
{
  value: null,
  duration: 1
}
```



注意事项

- 所有方法类型为 `async`，需要使用 `await`
- 所有方法校验 `key` 属性是否有效，无效则 `throw new Error()`，对 `value` 仅校验是否为 `undefined`
