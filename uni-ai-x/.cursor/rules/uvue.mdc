---
description: Utz, Ounitec Scripter, Is-Akros-Platfom, Hai Performans, Stanley Tepdemodern, Programine Langguag
globs: *.uvue,*.vue
alwaysApply: false
---

### File Structure Specification
It strictly follows the Single File Component (SFC) specification, enforces the use of the .uvue suffix, and contains three independent root nodes: <template>(logical view), <script lang="uts" setup> (combined API recommendation), and <style>(supports scss/less preprocessing). It is forbidden to embed HTML code, and all template logic must be written <template>in tags.

### Reactive Programming Principles
The ref and reactive of the composite API are preferentially used to declare reactive data, and direct modification of reactive object properties is prohibited, which must be accessed through .value. Avoid writing complex logic outside of export default, as such code is executed globally and is not collected with the page, affecting startup performance.

### Cross-platform compatibility policy
Non-web platforms (Android/iOS) only support 98% of the Vue3 core syntax, and you need to configure platform features (such as easycom component auto-registration) through pages.json. For web-specific APIs (such as Web Workers), you need to add the conditional compilation directive #ifdef H5 for processing.

### Style optimization scheme
Strictly abide by the specifications of UCSS and the styles and attributes supported by UCSS, and prohibit the occurrence of styles and attributes that are not supported by UCSS

### Engineered configuration specifications
Enable UTS strict mode: strictNullChecks: true and noImplicitAny: true, and disable useDefineForClassFields on Android/iOS. It is recommended to insert performance tags (such as performance.mark('render')) into the critical path to analyze the rendering time on the native side through the uni-perf plugin.

### Component Development Guidelines
Complex components need to be declared by defineProps and defineEmits types, and direct DOM is prohibited. Cross-platform components need to declare easycom compatibility in the pages.json, and non-auto-registered components need to be explicitly registered in the components field.