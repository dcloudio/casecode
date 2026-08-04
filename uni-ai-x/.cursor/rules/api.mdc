---
description: Uni-App X api
globs: *.uts,*.ts,*.uvue,*.vue
alwaysApply: false
---

### Global API (no uni. prefix required)
Get system information: getApp(), getSystemInfoSync()
Lifecycle management: application-level events such as onLaunch and onShow

### Platform native APIs
Android/iOS/Harmony/Web Mini Program can be directly called by the native interface of all platforms (import through import)
Example: import Build from 'android.os.Build' to get the device model

### Cross-platform encapsulation API
Network request: uni.request (Promise supported)
File operation: uni.writeFile (overwrite/append mode needs to be explicitly declared)
Location service: uni.getLocation (need to dynamically apply for location permission)

### Cloud Service API
uniCloud database: uniCloud.database()
File storage: uniCloud.uploadFile (supports multipart upload)

### UI Component API
Custom component communication: $emit/$refs binding
UI drawing: uni.createCanvasContext (WebGL supported)

### Key usage specifications
- iOS does not support direct calls to Swift APIs in JS-driven mode, and must be encapsulated as uts plug-ins
- Dynamic permission application process:
Registered permission listener: uni.addInterceptor('beforeEnter')
Permission verification: uni.checkSetting({scope: 'scope.userLocation'})
Pop-up application: uni.authorize({scope: 'scope.camera'})
- The native API must be encapsulated as a uni_modules plugin