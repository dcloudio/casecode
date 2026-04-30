# uni-get-phone-number

鸿蒙应用通过华为账号授权手机号一键登录

## 使用方式

**配置app_icon**

在项目的`harmony-configs/AppScope/resources/base/media`目录下，创建名为`app_icon.png`的应用图标，用于获取手机号弹窗上展示。

**配置app_name**

在项目的`harmony-configs/AppScope/resources/base/element/string.json`文件中, 添加以下字段：
```
{
	"string": [{
		"name": "app_name",
		"value": "应用名称"
	}]
}
```

**引入插件**

通过嵌入原生鸿蒙插件方式引入 [文档](https://uniapp.dcloud.net.cn/tutorial/harmony/native-component.html)

```vue
<template>
	<embed
		tag="appharmonygetphonenumber"
		:options="options"
		@clickprivacytext="onClickPrivacyText"
		@getphonenumber="onGetPhoneNumber"
		@ready="onReady"
		@close="onClose"
		@error="onError"
	></embed>
</template>

<script>
  const agreements = [
	  {
        text: "用户协议",
        url: "https://xxx"
      }, {
        text: "隐私协议",
        url: "https://xxx"
      }
  ]
  export default {
    data() {
      return {
        options: {
          show: true,
          privacyConfig: agreements.map(agreement => agreement.text)
        }
      };
    },
    methods: {
      onClickPrivacyText(e) {
        console.log("点击隐私条款", e);
        
        const {tag} = e.detail
        const agreement = agreements.find(agreement => agreement.text === tag)
        if (agreement) {
          uni.navigateTo({
            url: `/pages/webview/webview?url=${encodeURIComponent(agreement.url)}`
          })
        }
      },
      onGetPhoneNumber(e) {
        console.log("获取手机号回调", e);
      },
      onReady(e) {
        console.log("插件加载完成", e);
      },
      onClose(e) {
        console.log("关闭插件", e);
      },
      onError(e) {
        console.log("插件报错", e);
      }
    }
  };
</script>
```

## 参数说明

| 参数名                   | 说明         | 类型       | 必填 | 默认值  | 备注 |
|-----------------------|------------|----------|----|------|----|
| options               | 配置项        | Object   | 是  | -    |    |
| options.show          | 是否显示插件     | Boolean  | 否  | true | -  |
| options.privacyConfig | 隐私条款文本     | String[] | 是  | -    | -  |
| clickprivacytext      | 点击隐私条款回调函数 | Function | 否  | -    | -  |
| getphonenumber        | 获取手机号回调函数  | Function | 是  | -    | -  |
| ready                 | 插件加载完成回调函数 | Function | 否  | -    | -  |
| close                 | 关闭插件回调函数   | Function | 否  | -    | -  |
| error                 | 插件报错回调函数   | Function | 否  | -    | -  |