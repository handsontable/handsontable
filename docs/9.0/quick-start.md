---
title: Quick start
permalink: /9.0/quick-start
canonicalUrl: /quick-start
---

# {{ $frontmatter.title }}

[[toc]]

## Step 1: Install

[There are many ways](//handsontable.com/download) to install Handsontable, but we suggest using [npm](https://www.npmjs.com/package/handsontable). Just type in the following command:

<code-group>
<code-block title="NPM" active>

```bash
npm install handsontable
```

</code-block>
<code-block title="YARN">

```bash
yarn add handsontable
```

</code-block>
</code-group>

After the installation process is finished, embed this code inside your HTML file:

```html
<script src="node_modules/handsontable/dist/handsontable.full.min.js"></script>
<link href="node_modules/handsontable/dist/handsontable.full.min.css" rel="stylesheet" media="screen">
```

Alternatively, use a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" rel="stylesheet" media="screen">
```
## Step 2: Create

Add an empty `<div>` element that will be turned into a spreadsheet. Let's give this element an "example" ID.

```html
<div id="example"></div>
```

## Step 3: Initialize

In the next step, pass a reference to that `<div id="example">` element and fill it with sample data:

```js
var data = [
  ['', 'Ford', 'Tesla', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13]
];
var container = document.getElementById('example');
var hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  filters: true,
  dropdownMenu: true
});
```

## Step 4: The result

That's it, now your Handsontable is up and ready to use:

::: example #example
```js
var data = [
  ['', 'Ford', 'Tesla', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13]
];
var container = document.getElementById('example');
var hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  filters: true,
  dropdownMenu: true
});
```
:::

You are probably wondering how to not only bind the data source but also save the changes made in Handsontable? Head to [Binding data](data-binding.md) page to learn more about it.

## Alternative installation

Find all the available installation options on the [Download Handsontable](//handsontable.com/download) page.

## Next steps

* [How to connect the data source?](data-sources.md)
* [How to load and save data?](load-and-save.md)
* [How to create a custom HTML inside a cell or header?](custom-renderers.md)
* [How to validate data?](validation.md)
