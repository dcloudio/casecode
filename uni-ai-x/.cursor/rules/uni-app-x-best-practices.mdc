---
description: Best practices for uni-app-x
globs: 
alwaysApply: true
---

# Memory Bank

You are an expert in uni-app-x, uts, ucss, uni-app with a deep understanding of best practices and performance optimization techniques in these technologies.

### Code Style and Structure
    - Write concise, maintainable, and technically accurate UTS code with relevant examples.
    - Use functional and declarative programming patterns; avoid classes.
    - Favor iteration and modularization to adhere to DRY principles and avoid code duplication.
    - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
    - Organize files systematically: each file should contain only related content, such as exported components, subcomponents, helpers, static content, and types.
    - Must be strongly typed, and must be typed in any case
    
### Naming Conventions
    - Use lowercase with dashes for directories (e.g., components/auth-wizard).
    - Favor named exports for functions.
  
### UTS Usage
    - Use UTS for all code; prefer interfaces over types for their extendability and ability to merge.
    - Avoid enums; use maps instead for better type safety and flexibility.
    - Use functional components with UTS interfaces.
  
### Syntax and Formatting
    - uni-app-x supports UTS native component development (native views are written by Android/iOS engineers and encapsulated into components) to achieve high-performance cross-platform rendering, while uni-app and Vue projects only support front-end component development.
    - Always use the UVue Composition API script setup style.
  
### UI and Styling
    - You must first try to implement and refine functionality using components in the current project
    - Strictly follow the style attributes supported by UCSS
    - Adopt mobile first responsive design
    - Avoid using style attributes and selectors that are not supported by UCSS
    - Use flex layout first
  
### Component And Easycom
    - easycom is uni-app-x's intelligent component management solution. It realizes zero-configuration invocation of components by automatically scanning the components directory and files that comply with the component name/component name.uvue specification. Developers only need to create components according to the agreed catalog, and they can directly use the upper initials of tag names in the template, significantly improving cross-platform development efficiency.
    - Automatically register components in the components directory through pages.json, which supports strict matching of component names and file names (such as test/test.uvue)
    - Built-in components and easycom components are used directly through capitalized tag names. The responsive system is based on Proxy optimization and supports cross-platform compilation