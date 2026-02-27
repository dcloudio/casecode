---
description: Uni-App X implements a subset of Web CSS on the App platform
globs: *.css,*.ucss,*.uvue,*.scss,*.less,*. sass
alwaysApply: false
---

### Layout Specifications
- Disable layout such as float, grid, etc., all containers must use display:flex, and the default direction is vertical (implemented via flex-direction:column)
- Page-level scrolling requires manual wrapping<scroll-view style="flex:1">, and it is recommended to use conditional compilation on Android

### Selector Restrictions
- Only class selectors (.class) are supported, ID/attribute selectors are prohibited (e.g.#id,[attr])
- Class names must comply with the [A-Za-z0 -9_-]+ specification, and special characters are prohibited (such as @class)

### Style isolation rules
- The text style (color, font-size) must be written <text>in the component, and the container component (<view>) prohibits setting text-related properties
- Disable inheritance-related keywords such as inherit and unset

### Hierarchy Control
z-index only takes effect on sibling nodes at the same level, and absolute fixed bits that are separated from the document stream do not support hierarchical coverage

### Module Support List
| support module   | disable feature       | alternative                          |
|------------|----------------|-----------------------------------|
| Flex layout   | Grid/Float     | Use Nested Flex for complex layouts          |
| Background and border| background picture       | Implemented through <image>components               |
| Animation and Transition| CSS animation        | Use JavaScript API to achieve dynamic effects        |
| variable system   | CSS variables        | Inject global variables through UTS               |
| responsive     | media queries       | Processing using conditional compilation instructions              |

### Code review priorities
- Forbidden! important (only allowed in class selector)
- Avoid multiple layers of nesting (recommended depth ≤3 layers)
- Priority is given to rpx units (1rpx=0.5 physical pixels)
- Unusable style: position:fixed (use absolute+top:env(safe-area-inset-top) instead)
- Inavailable attribute: opacity:0.5 (use background:rgba(0,0,0,0.5))
- Not available writing:<view style="color:red">text</view> (needs to be rewritten to<text style="color:red">text</text>)