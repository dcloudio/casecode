## 4.0.6（2022-12-12）
修复`getDrawModules`，第一次获取结果正常，后续获取`tile`模块不存在的问题；  
修复安卓type:normal因Canvas API使用了小数或为0的参数导致生成异常的问题（注：安卓非2d Canvas部分API参数不支持携带小数，部分API参数必须大于0）。
## 4.0.1（2022-11-28）
优化组件loading属性的表现；  
新增组件type选项normal，以便于在某些条件编译初始为type=2d时还可以选择使用非2d组件类型；  
修复组件条件编译在其他编辑器语法提示报错；  
修复原生对es5的支持。
## 4.0.0（2022-11-21）
v4版本源代码全面开放，开源地址：[https://github.com/Sansnn/uQRCode](https://github.com/Sansnn/uQRCode)；  

升级说明：v4为大版本更新，虽然已尽可能兼容上一代版本，但不可避免的还是存在一些细节差异，若更新后出现问题，请参考对照[v3 文档](https://uqrcode.cn/doc/v3)，[v4 文档](https://uqrcode.cn/doc)进行修改。
