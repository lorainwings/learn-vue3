/** @type {import("prettier").Config} */
module.exports = {
  printWidth: 80, //一行的字符数，如果超过会进行换行，默认为80
  singleQuote: true, // 字符串是否使用单引号，默认为 false，使用双引号
  semi: false, // 行尾是否使用分号，默认为true
  trailingComma: 'none', // 是否使用尾逗号
  bracketSpacing: true // 对象大括号直接是否有空格，默认为 true，效果：{ a: 1 }
}
