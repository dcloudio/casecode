# 介绍

`uQRCode`是一款基于`Javascript`环境开发的二维码生成插件，适用所有`Javascript`运行环境的前端应用和`Node.js`应用。

`uQRCode`可扩展性高，它支持自定义渲染二维码，可通过`uQRCode API`得到二维码绘制关键信息后，使用`canvas`、`svg`或`js`操作`dom`的方式绘制二维码图案。还可自定义二维码样式，如随机颜色、圆点、方块、块与块之间的间距等。

欢迎加入群聊【uQRCode交流群】：[695070434](https://jq.qq.com/?_wv=1027&k=JRjzDqiw)。

# 设计器

uQRCode发布了配套的可视化设计器，可根据自己喜好在设计器中设计二维码样式，一键生成配置代码复制到项目中，详情请在微信小程序搜索“柚子二维码”，或扫描下方小程序码体验。

![uQRCode设计器](https://uqrcode.cn/mp_weixin_code.jpg)

## 设计器模板示例

![uQRCode设计器](https://uqrcode.cn/yz_1.png)
![uQRCode设计器](https://uqrcode.cn/yz_2.png)
![uQRCode设计器](https://uqrcode.cn/yz_3.png)
![uQRCode设计器](https://uqrcode.cn/yz_4.png)
![uQRCode设计器](https://uqrcode.cn/yz_5.png)
![uQRCode设计器](https://uqrcode.cn/yz_6.png)
![uQRCode设计器](https://uqrcode.cn/yz_7.png)
![uQRCode设计器](https://uqrcode.cn/yz_8.png)
![uQRCode设计器](https://uqrcode.cn/yz_9.png)

# 快速上手

> 在`uni-app`中，我们更推荐使用组件方式来生成二维码，组件方式大大提高了页面的可读性以及避开了一些平台容易出问题的地方，当组件无法满足需求的时候，再考虑切换成原生方式。

官方文档：[https://uqrcode.cn/doc](https://uqrcode.cn/doc)。

github地址：[https://github.com/Sansnn/uQRCode](https://github.com/Sansnn/uQRCode)。

npm地址：[https://www.npmjs.com/package/uqrcodejs](https://www.npmjs.com/package/uqrcodejs)。

uni-app插件市场地址：[https://ext.dcloud.net.cn/plugin?id=1287](https://ext.dcloud.net.cn/plugin?id=1287)。

## 原生方式

原生方式仅需要获取`uqrcode.js`文件便可使用。详细配置请移步到：文档 > [原生](https://uqrcode.cn/doc/document/native.html)。

### 安装

1. 通过`npm`安装，成功后即可使用`import`或`require`进行引用。
``` bash
# npm安装
npm install uqrcodejs
# 或者
npm install @uqrcode/js
```

2. 通过项目开源地址获取`uqrcode.js`，下载`uqrcode.js`后，将其复制到您项目指定目录，在页面中引入`uqrcode.js`文件即可开始使用。

### 引入

- 通过`import`引入。
``` javascript
// npm安装
import UQRCode from 'uqrcodejs'; // npm install uqrcodejs
// 或者
import UQRCode from '@uqrcode/js'; // npm install @uqrcode/js
```

- `Node.js`通过`require`引入。
``` javascript
// npm安装
const UQRCode = require('uqrcodejs'); // npm install uqrcodejs
// 或者
const UQRCode = require('@uqrcode/js'); // npm install @uqrcode/js
```

- 原生浏览器环境，在js脚本加载时添加到`window`。
``` html
<script type="text/javascript" src="uqrcode.js"></script>
<script>
    var UQRCode = window.UQRCode;
</script>
```

### 简单用法

`uQRCode`基于`Canvas API`封装了一套方法，建议开发者使用`canvas`生成，一键调用，非常方便。以下是示例：

- HTML示例
  - DOM部分
  ``` html
  <canvas id="qrcode" width="200" height="200"></canvas>
  ```

  - JS部分
  ``` javascript
  // 获取uQRCode实例
  var qr = new UQRCode();
  // 设置二维码内容
  qr.data = "https://uqrcode.cn/doc";
  // 设置二维码大小，必须与canvas设置的宽高一致
  qr.size = 200;
  // 调用制作二维码方法
  qr.make();
  // 获取canvas元素
  var canvas = document.getElementById("qrcode");
  // 获取canvas上下文
  var canvasContext = canvas.getContext("2d");
  // 设置uQRCode实例的canvas上下文
  qr.canvasContext = canvasContext;
  // 调用绘制方法将二维码图案绘制到canvas上
  qr.drawCanvas();
  ```

- uni-app示例
  - Template部分
  ``` html
  <canvas id="qrcode" canvas-id="qrcode" style="width: 200px;height: 200px;"></canvas>
  ```
  
  - JS部分
  ``` javascript
  onReady() {
    // 获取uQRCode实例
    var qr = new UQRCode();
    // 设置二维码内容
    qr.data = "https://uqrcode.cn/doc";
    // 设置二维码大小，必须与canvas设置的宽高一致
    qr.size = 200;
    // 调用制作二维码方法
    qr.make();
    // 获取canvas上下文
    var canvasContext = uni.createCanvasContext('qrcode', this); // 如果是组件，this必须传入
    // 设置uQRCode实例的canvas上下文
    qr.canvasContext = canvasContext;
    // 调用绘制方法将二维码图案绘制到canvas上
    qr.drawCanvas();
  }
  ```
  
- 微信小程序，推荐使用Canvas 2D，关于Canvas 2D的使用请参考微信开放文档。

### 高级用法

考虑到部分平台可能不支持`canvas`，所以`uQRCode`并没有强制要求和`canvas`一起使用，您还可以选择其他方式来生成二维码，例如使用`js`操作`dom`进行绘制或是使用`svg`绘制等。以下是示例：

- uni-app v-for+view

```html
<template>
  <view>
    <view class="qrcode">
      <view v-for="(row, rowI) in modules" :key="rowI" style="display: flex;flex-direction: row;">
        <view v-for="(col, colI) in row" :key="colI">
          <view v-if="col.isBlack" style="width: 10px;height: 10px;background-color: black;">
            <!-- 黑色码点 -->
          </view>
          <view v-else style="width: 10px;height: 10px;background-color: white;">
            <!-- 白色码点 -->
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import UQRCode from '../../uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';

  export default {
    data() {
      return {
        modules: []
      }
    },
    onLoad() {
      const qr = new UQRCode();
      qr.data = 'uQRCode';
      qr.make();
      this.modules = qr.modules;
    },
    methods: {

    }
  }
</script>
```

- js操作dom

``` html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>uQRCode二维码生成</title>
</head>
<body>
    <div id="qrcode" style="position: relative;"></div>
    <script type="text/javascript" src="uqrcode.js"></script>
    <script>
    // 引入uQRCode
    var UQRCode = window.UQRCode;
    // 获取uQRCode实例
    var qr = new UQRCode();
    // 设置二维码内容
    qr.data = "https://uqrcode.cn/doc";
    // 设置二维码大小，必须与canvas设置的宽高一致
    qr.size = 200;
    // 设置二维码前景图，可以是路径
    qr.foregroundImageSrc =
        'data:image/png;base64,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';
    // 调用制作二维码方法
    qr.make();

    var drawModules = qr.getDrawModules();
    // 遍历drawModules创建dom元素
    var qrHtml = '';
    for (var i = 0; i < drawModules.length; i++) {
        var drawModule = drawModules[i];
        switch (drawModule.type) {
        case 'tile':
            /* 绘制小块 */
            qrHtml += `<div style="position: absolute;left: ${drawModule.x}px;top: ${drawModule.y}px;width: ${drawModule.width}px;height: ${drawModule.height}px;background: ${drawModule.color};"></div>`;
            break;
        case 'image':
            /* 绘制图像 */
            qrHtml += `<img style="position: absolute;left: ${drawModule.x}px;top: ${drawModule.y}px;width: ${drawModule.width}px;height: ${drawModule.height}px;" src="${drawModule.imageSrc}" />`;
            break;
        }
    }
    document.getElementById('qrcode').innerHTML = qrHtml;
    </script>
</body>
</html>
```

- svg
``` html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>uQRCode二维码生成</title>
</head>
<body>
    <svg id="qrcode" width="200" height="200" xmlns="http://www.w3.org/2000/svg" version="1.1"></svg>
    <script type="text/javascript" src="uqrcode.js"></script>
    <script>
    // 引入uQRCode
    var UQRCode = window.UQRCode;
    // 获取uQRCode实例
    var qr = new UQRCode();
    // 设置二维码内容
    qr.data = "https://uqrcode.cn/doc";
    // 设置二维码大小，必须与canvas设置的宽高一致
    qr.size = 200;
    // 设置二维码前景图，可以是路径
    qr.foregroundImageSrc =
        'data:image/png;base64,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';
    // 调用制作二维码方法
    qr.make();

    var drawModules = qr.getDrawModules();
    // 遍历drawModules创建svg元素
    var qrHtml = '';
    for (var i = 0; i < drawModules.length; i++) {
        var drawModule = drawModules[i];
        switch (drawModule.type) {
        case 'tile':
            /* 绘制小块 */
            qrHtml += `<rect x="${drawModule.x}" y="${drawModule.y}" width="${drawModule.width}" height="${drawModule.height}" style="fill: ${drawModule.color};" />`;
            break;
        case 'image':
            /* 绘制图像 */
            qrHtml += `<image href="${drawModule.imageSrc}" x="${drawModule.x}" y="${drawModule.y}" width="${drawModule.width}" height="${drawModule.height}" />`;
            break;
        }
    }
    document.getElementById('qrcode').innerHTML = qrHtml;
    </script>
</body>
</html>
```

> 更多用法大家自行探索咯，期待分享哟~

### 导出临时文件路径

原生方式基于`Canvas`的，请自行参阅各平台`Canvas`的导出方式。以下是部分示例：

- uni-app
```javascript
// 通过uni.createCanvasContext方式创建绘制上下文的，对应导出API为uni.canvasToTempFilePath
// 调用完ctx.draw()方法后不能第一时间导出，否则会异常，需要有一定的延时
setTimeout(() => {
    uni.canvasToTempFilePath(
        {
            canvasId: this.canvasId,
            fileType: this.fileType,
            width: this.canvasWidth,
            height: this.canvasHeight,
            success: res => {
                console.log(res);
            },
            fail: err => {
                console.log(err);
            }
        }, 
        // this // 组件内使用必传当前实例
    );
}, 300);
```

- Canvas2D
```javascript
// 得到base64
console.log(canvas.toDataURL());
// 得到buffer
console.log(canvas.toBuffer());
```

### 保存二维码到本地相册

必须在导出临时文件路径成功后再执行保存。uni-app通用保存方式（H5除外）：
```javascript
uni.saveImageToPhotosAlbum({
    filePath: tempFilePath,
    success: res => {
        console.log(res);
    },
    fail: err => {
        console.log(err);
    }
});
```

H5可以通过设置`<a>`标签`href`属性的方式进行保存：
```javascript
const aEle = document.createElement('a');
aEle.download = 'uQRCode'; // 设置下载的文件名，默认是'下载'
aEle.href = tempFilePath;
document.body.appendChild(aEle);
aEle.click();
aEle.remove(); // 下载之后把创建的元素删除
```
经过测试，PC端浏览器可以下载，部分安卓自带或第三方浏览器可以下载，安卓微信浏览器不适用，移动端iOS所有浏览器均不适用，差异较大，还是推荐各位导出文件给图片组件显示，然后提示用户通过长按图片进行保存这种方式。

## uni-app组件方式

### 安装

通过uni-app插件市场地址安装：[https://ext.dcloud.net.cn/plugin?id=1287](https://ext.dcloud.net.cn/plugin?id=1287)。详细配置请移步到：文档 > [uni-app组件](https://uqrcode.cn/doc/document/uni-app.html)。

### 引入

uni-app默认为easycom模式，可直接键入`<uqrcode>`标签。

### 简单用法

安装`uqrcode`组件后，在`template`中键入`<uqrcode/>`。设置`ref`属性可使用组件内部方法，`canvas-id`属性为组件内部的canvas组件标识，`value`属性为二维码生成对应内容，`options`为配置选项，可配置二维码样式，绘制Logo等，详见：[options](https://uqrcode.cn/doc/document/uni-app.html#options) 。

``` html
<uqrcode ref="uqrcode" canvas-id="qrcode" value="https://uqrcode.cn/doc" :options="{ margin: 10 }"></uqrcode>
```

### 导出临时文件路径

为了保证方法调用成功，请在 [complete](https://uqrcode.cn/doc/document/uni-app.html#complete) 事件返回`success=true`后调用。

```javascript
// uqrcode为组件的ref名称
this.$refs.uqrcode.toTempFilePath({
  success: res => {
    console.log(res);
  }
});
```

### 保存二维码到本地相册

为了保证方法调用成功，请在 [complete](https://uqrcode.cn/doc/document/uni-app.html#complete) 事件返回`success=true`后调用。

```javascript
// uqrcode为组件的ref名称
this.$refs.uqrcode.save({
  success: () => {
    uni.showToast({
      icon: 'success',
      title: '保存成功'
    });
  }
});
```

## 更多使用说明请前往官方文档查看：[https://uqrcode.cn/doc](https://uqrcode.cn/doc)。