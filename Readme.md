# The Page.evaluate()?
 **The page.evaluate() methods** lets one run Javascript inside the browser context, as if you were typing code directly in the DevTools console.

> Think of  it like this:
- .'Everything outside  'evaluate' runs in  Node.js'

- .'Everything inside  'evaluate(()=> { ...}) runs in the browser - like    you're inside a webpage.'


## syntax
 <pre> ```
 const result = await page.evaluate(() => {
  // browser context
  return document.title;
});

    ```</pre>

### Example 1: Get the Page Title
