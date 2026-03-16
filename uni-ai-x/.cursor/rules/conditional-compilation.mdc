---
description: Uni-App X conditional compilation
globs: *.uts,*.uvue,*.css,*.less,*.scss,*.ts,*.js,*.sass,*.json
alwaysApply: false
---

### core syntax
```
// Platform basic judgment
#ifdef APP-PLUS
  //Mini programs/APP common code
#elifdef APP-ANDROID
  // Android-specific logic
#elifdef APP-IOS
  // IOS-specific logic
#endif

// Environmental judgment
#ifdef DEBUG
  console.log('Debugging information')
#endif
```

### Multi-terminal UI adaptation
```
<template>
  <view #ifdef="APP-IOS">
    <uni-swipe-cell :rightWidth="120"></uni-swipe-cell>
  </view>
  <view #ifndef="APP-HARMONY">
    <div class="custom-cell">123</div>
  </view>
</template>
```

### Core Platform Identifier
VUE3 uni-app js engine version is used to distinguish between vue2 and 3, see HBuilderX 3.2.0 for details 
VUE2 uni-app js engine version is used to distinguish between vue2 and 3, see more
UNI-APP-X is used to distinguish whether it is a uni-app x project Details HBuilderX 3.9.0 
uniVersion is used to distinguish the version of the compiler Details HBuilderX 3.9.0 
APP App
When the APP-PLUS uni-app js engine version is compiled to an app
APP-PLUS-NVUE or APP-NVUE App nvue page
APP-ANDROID App Android Platform Details
APP-IOS App iOS Platform Details
APP-HARMONY App HarmonyOS Next platform
H5 H5 (WEB recommended)
WEB web (same as H5) HBuilderX 3.6.3 
MP-WEIXIN WeChat Mini Program
MP-ALIPAY APPLET
MP-BAIDU BAIDU MINI PROGRAM
MP-TUTIAO TIKTOK MINI PROGRAM
MP-LARK Feishu Mini Program
MP-QQ QQ applet
MP-KUAISHOU Kuaishou Mini Program
MP-JD JD Mini Program
MP-360 360 applet
MP-HARMONY Harmony Yuan Service HBuilderX 4.34 
MP-XHS Xiaohongshu Mini Program
MP WeChat Mini Program/Alipay Mini Program/Baidu Mini Program/Douyin Mini Program/Feishu Mini Program/QQ Mini Program/360 Mini Program/Hongmeng Yuan Service
QUICKAPP-WEBVIEW (INCLUDING ALLIANCE AND HUAWEI)
QUICKAPP-WEBVIEW-UNION
QUICKAPP-WEBVIEW-HUAWEI 快訂計

- Compiler versioning
UNI-APP-X: Distinguish uni-app x items (requires HBuilderX 3.9)
uniVersion: supports version comparison (e.g. #ifdef uniVersion > 3.9)

### Advanced
- COMBINATORIAL LOGIC: SUPPORT AND/OR LOGIC OPERATIONS (E.G. APP-PLUS AND (ANDROID OR IOS))
- Dynamic Identity: Add a custom compilation identity via plus.define({IS_LOGIN: true}).

### Note
- Json files also support conditional compilation
- Conditional compilation is implemented using annotations. Comments are written differently in different syntaxes. js/nuts uses//annotations, css uses/* annotations */, and vue/nvue/uvue templates.<!-- comment --> ;
- The conditional compilation APP-PLUS contains APP-NVUE and APP-VUE. APP-PLUS-NVUE is no different from APP-NVUE. APP-NVUE is added at the end for simplification;
For the undefined platform name, it may be that the name is misspelled, or it may be that the lower version of HBuilderX does not recognize the platform yet. At this time, the code in #ifdef will not take effect, but the code in #ifndef will take effect;
- When using conditional compilation, please ensure that the syntax of the files before and after compilation is correct, that is, ensure that they can pass the syntax check regardless of whether conditional compilation takes effect. For example: there cannot be extra commas in json files, and there cannot be repeated imports in js;