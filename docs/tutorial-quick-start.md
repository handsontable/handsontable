---
id: tutorial-quick-start
title: Quick start
sidebar_label: Quick start
slug: /tutorial-quick-start
---

Follow these steps to install Handsontable:

1.  [Install](#page-install)
2.  [Create](#page-create)
3.  [Initialize](#page-bind)
4.  [Alternative installation](#page-alternative)

### Step 1: Install

[There are many ways](//handsontable.com/download) to install Handsontable, but we suggest using [npm](https://www.npmjs.com/package/handsontable). Just type in the following command:

    npm install handsontable

After the installation process is finished, embed this code inside your HTML file:

    <script src="node_modules/handsontable/dist/handsontable.full.min.js"></script>
    <link href="node_modules/handsontable/dist/handsontable.full.min.css" rel="stylesheet" media="screen">

Alternatively, use a CDN:

    <script src="https://cdn.jsdelivr.net/npm/handsontable@8.2.0/dist/handsontable.full.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/handsontable@8.2.0/dist/handsontable.full.min.css" rel="stylesheet" media="screen">

### Step 2: Create

Add an empty `<div>` element that will be turned into a spreadsheet. Let's give this element an "example" ID.

`<div id="example"></div>`

### Step 3: Initialize

In the next step, pass a reference to that `<div id="example">` element and fill it with sample data:

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

### Step 4: The result

That's it, now your Handsontable is up and ready to use:

var data = \[ \['', 'Ford', 'Tesla', 'Toyota', 'Honda'\], \['2017', 10, 11, 12, 13\], \['2018', 20, 11, 14, 13\], \['2019', 30, 15, 12, 13\] \]; var container = document.getElementById('example'); var hot = new Handsontable(container, { data: data, rowHeaders: true, colHeaders: true, filters: true, dropdownMenu: true });

You are probably wondering how to not only bind the data source but also save the changes made in Handsontable? Head to [Binding data](/docs/8.2.0/tutorial-data-binding.html) page to learn more about it.

### Alternative installation

Find all the available installation options on the [Download Handsontable](//handsontable.com/download) page.

### Next steps

*   [How to connect the data source?](/docs/8.2.0/tutorial-data-sources.html)
*   [How to load and save data?](/docs/8.2.0/tutorial-load-and-save.html)
*   [How to create a custom HTML inside a cell or header?](/docs/8.2.0/demo-custom-renderers.html)
*   [How to validate data?](/docs/8.2.0/demo-data-validation.html)

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/quick-start.html)
