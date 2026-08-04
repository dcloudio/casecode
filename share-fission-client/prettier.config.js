module.exports = {
  // 单行最大字符数
  printWidth: 180,
  // 缩进空格数
  tabWidth: 2,
  // false代表使用空格缩进
  useTabs: false,
  // 语句末尾添加分号
  semi: true,
  // true 使用单引号 false 使用双引号
  singleQuote: true,
  // ES5 兼容的尾逗号
  trailingComma: 'es5',
  // 对象花括号内加空格，如 { foo: bar }
  bracketSpacing: true,
  // HTML 标签属性的闭合括号放在同一行
  bracketSameLine: false,
  // 箭头函数参数始终加括号，如 (x) => x
  arrowParens: 'always',
  // 换行符使用 lf
  endOfLine: 'lf',
  // HTML 空白敏感度按 CSS display 属性决定
  htmlWhitespaceSensitivity: 'css',
  // Vue 文件中 <script> 和 <style> 内容缩进
  vueIndentScriptAndStyle: true,
  // 对象属性仅必要时加引号
  quoteProps: 'as-needed',
  // 保留Markdown/注释的手动换行
  proseWrap: 'preserve',
  // 自动格式化嵌入的代码片段（如Markdown代码块）
  embeddedLanguageFormatting: 'auto',
  // 标签多个短属性尽可能同行显示
  singleAttributePerLine: false,
  // 单独覆盖特定文件的配置
  overrides: [
    {
      // 以下文件使用双引号
      files: ['**/config.js', '**/uni-config-center/**/*.js'],
      options: {
        singleQuote: false, // 使用双引号
        quoteProps: 'preserve',
      },
    },
  ],
};
