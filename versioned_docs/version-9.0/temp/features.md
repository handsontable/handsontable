---
id: features
title: Features Showcase
sidebar_label: Features Showcase
slug: /temp/features
---

# Header 1

## Header 2

### Header 3

#### Header 4

##### Header 5

###### Header 6 + example paragrams

Available keyboard shortcuts:

*   CTRL/CMD + V - paste the content into the last selected cell range

Available options in the browser's toolbar:

*   `Edit > Paste` - paste the content into the last selected cell range

[Due to security reason, modern browsers disallow to read from the system clipboard.](https://www.w3.org/TR/clipboard-apis/#privacy)

### Code snippet

```js title="index.js" hot-preview=example1,hot1
var
  container = document.getElementById('example1'),
  hot1;

hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(2, 2),
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  className: "htCenter",
});
```

### Image

![image from handsontable.com](https://handsontable.com/static/images/template/ModFrontpage/main-page-illustration.svg)

### Table

-------------------------
| header1 | header2 | 3 |
|---------|---------|---|
| A1      | A2      | A3 |
| B1      | B2      | B3 |
| C1      | C2      | C3 |
| D1      | D2      | D3 |

### List

#### Numbers

1. point 1
2. point 2
3. point 3 (numbers)
   1. point 3.1
   2. point 3.2
   1. point 3.3
   2. point 3.4
4. point 4 (stars)
   * point 4.1
   * point 4.2
5. point 5 (minus)
   - point 5.1
   - point 5.2

#### Stars

* point 1
* point 2
* point 3 (numbers)
   1. point 3.1
   2. point 3.2
   1. point 3.3
   2. point 3.4
* point 4 (stars)
   * point 4.1
   * point 4.2
* point 5 (minus)
   * point 5.1
   * point 5.2

#### Multilevel

1. 1
   1. 1.1
      1. 1.1.1
         1. 1.1.1.1
            1. 1.1.1.1
            1. 1.1.1.2

* 1
   * 1.1
      * 1.1.1
         * 1.1.1.1
            * 1.1.1.1
            * 1.1.1.2

### Inline HTML

<center>center</center>
<table><tr><td>a1</td><td>a2</td></tr></table>

### Admonitions

:::note
The content and title *can* include markdown.
:::

:::tip You can specify an optional title
Heads up! Here's a pro-tip.
:::

:::info
Useful information.
:::

:::caution
Warning! You better pay attention!
:::

:::danger
Danger danger, mayday!
:::
