---
title: Batch operations
metaTitle: Batch operations - Guide - Handsontable Documentation
permalink: /next/batch-operations
canonicalUrl: /batch-operations
tags:
  - suspend rendering
---

# Batch operations

[[toc]]

<style>
.handsontable .green-bg {
  color: #fff;
  background-color: #37BC6C;
}

.handsontable .red-bg {
  color: #fff;
  background-color: #FF5A12;
}

#logOutput {
  max-height: 150px;
  overflow-y: auto;
  line-height: 2;
}

#logOutput div:first-child {
  font-weight: bold;
}

</style>

## Overview

Within Handsontable, every CRUD operation ends with a `render`. In most cases, this is considered expected behaviour. The table has to reflect the requested changes at some point. However, sometimes you may find this mechanism slightly excessive.

For example, if you wrote a custom function that uses several CRUD operations, those CRUD operations will call a `render` for each API method. You only need one render at the end, which is sufficient to reflect all the changes. You can treat those combined operations as a single action and let the render wait for them to complete. To do this, use **suspend the render** to batch the operations.

This can improve the overall performance of the application. Batching several operations can decrease the number of renders, so any API call that ends with a render will benefit from this improvement. It results in less layout trashing, fewer freezes, and a more responsive feel.

There are several API methods you can use for suspending, but `batch` is the most universal method. It is a callback function where the `render` is executed after all operations provided inside of the body are completed. It is best practice to use this method as it's safer and easier to use. You just need to place all operations that you want to batch inside a closure. Handsontable takes care of the suspending and performs a single `render` at the end.

The following snippet shows a simple example of a few operations batched. Three API operations are called one after another. Without placing them inside the batch callback, every single operation would end with a `render`. Thanks to the batching feature, you can skip two renders and end the whole action with one render at the end. This is more optimal, and the gain increases with the number of operations placed inside the `batch`.

```js
// call the batch method on an instance
hot.batch(() => {
  // run the operations as needed
  hot.alter('insert_row', 5, 45);
  hot.setDataAtCell(1, 1, 'x');
  hot.selectCell(0, 0);
  // the render is executed right after all of the operations are completed
});
```

Suspending the render results in better performance, which is especially noticeable when numerous operations are batched. The diagram shows a comparison where the same operations were performed **with** (deep blue columns) **and without the batch** (light blue columns). The gain in speed of execution time increases with the number of operations batched.

![batch_operations_comparison](/docs/next/img/batch_operations_comparison.png)

:::tip Note that other methods can be used to batch operations, but they are slightly more advanced and should be used with caution. Flickering, glitches or other visual distortion may happen when you forget to `resume` render after suspending it several times. Mixing methods of a render type with those focused on operations can also result in some unexpected behavior. Above all, `batch` should be sufficient in most use cases, and it is safe to work with.
:::

## API methods

The following **API methods** allow suspending:

- `batch`
- `batchRender`
- `batchExecution`
- `suspendRender` and `resumeRender`
- `suspendExecution` and `resumeExecution`

By using these methods, you can suspend:

- rendering
- execution
- both rendering and the execution.

The term "rendering" refers directly to DOM rendering, and the term "execution" refers to all operations that are different from DOM rendering. Currently, only the indexing recalculation allows you to postpone the process.

Method names that are prefixed with **batch\***, i.e., `batch`, `batchRender`, and `batchExecution` are recommended to be used as the first choice if **you don't need to batch async operations**.
Methods names that are prefixed with **suspend\***, i.e., `suspendRender` and `suspendExecution`, are the second choice. These are useful when you need to batch async operations. Essentially they work the same way as **batch\*** methods, but the **render has to be resumed manually**.

### batch* methods

#### batch

This method supsends both rendering and other operations. It is universal and especially useful if you want to batch multiple API calls within the application.

```js
hot.batch(() => {
  hot.alter('insert_row', 5, 45);
  hot.setDataAtCell(1, 1, 'x');

  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated, and table render will be called once after executing the callback
});
```

#### batchRender

The `batchRender` method is a callback function. Excessive renders can be skipped by placing the API calls inside it. The table will be rendered after executing the callback. It is less prone to errors as you don't have to remember to resume the render. The only drawback to this method is that it doesn't support async operations.

```js
hot.batchRender(() => {
  hot.alter('insert_row', 5, 45);
  hot.setDataAtCell(1, 1, 'x');
  // The table will be rendered once after executing the callback
});
```

#### batchExecution

The `batchExecution` is a callback function. Excessive renders can be skipped by placing the API calls inside of it. The table will be rendered after executing the callback. It is less prone to errors as you don't have to remember to resume the operations. The only drawback to this method is that it doesn't support async operations.

```js
hot.batchExecution(() => {
  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated once after executing the callback
});
```

### suspend* and resume* methods

#### suspendRender and resumeRender

To suspend the rendering process, you can call the `suspendRender` method just before the actions you want to batch. This is a manual approach. After suspending, you must remember to resume the process with the `resumeRender` method.

```js
hot.suspendRender(); // suspend rendering
hot.alter('insert_row', 5, 45);
hot.setDataAtCell(1, 1, 'x');
hot.resumeRender(); // remember to resume rendering
```

#### suspendExecution and resumeExecution

To suspend the rendering process, you can call the `suspendExecution` method just before the actions you want to batch. This is a manual approach. After suspending, you must remember to resume the process with the `resumeExecution` method.

```js
hot.suspendExecution();
const filters = hot.getPlugin('filters');

filters.addCondition(2, 'contains', ['3']);
filters.filter();
hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
hot.resumeExecution(); // It updates the cache internally
```

## Live demo of the suspend feature

The following examples show how much the `batch` method can decrease the render time. Both of the examples share the same dataset and operations. The first one shows how much time lapsed when the `batch` method was used. Run the second example to check how much time it takes to render without the `batch` method.

::: example #example1 --html 1 --js 2
```html
<div id="example1"></div>
<p>
  <button id="buttonWithout" class="button button--primary">Run without batch method</button>&nbsp;
  <button id="buttonWith" class="button button--primary">Run with batch method</button>
</p>
<div id="logOutput"></div>
```
```js
const container = document.querySelector('#example1');

const data1 = [
  [1, 'Gary Nash', 'Speckled trousers', 'S', 1, 'yes'],
  [2, 'Gloria Brown', '100% Stainless sweater', 'M', 2, 'no'],
  [3, 'Ronald Carver', 'Sunny T-shirt', 'S', 1, 'no'],
  [4, 'Samuel Watkins', 'Floppy socks', 'S', 3, 'no'],
  [5, 'Stephanie Huddart', 'Bushy-bush cap', 'XXL', 1, 'no'],
  [6, 'Madeline McGillivray', 'Long skirt', 'L', 1, 'no'],
  [7, 'Jai Moor', 'Happy dress', 'XS', 1, 'no'],
  [8, 'Ben Lower', 'Speckled trousers', 'M', 1, 'no'],
  [9, 'Ali Tunbridge', 'Speckled trousers', 'M', 2, 'no'],
  [10, 'Archie Galvin', 'Regular shades', 'uni', 10, 'no']
];

const data2 = [
  [11, 'Gavin Elle', 'Floppy socks', 'XS', 3, 'yes'],
];

const data3 = [
  [12, 'Gary Erre', 'Happy dress', 'M', 1, 'no'],
  [13, 'Anna Moon', 'Unicorn shades', 'uni', 200, 'no'],
  [14, 'Elise Eli', 'Regular shades', 'uni', 1, 'no']
];

const hot = new Handsontable(container, {
  data: data1,
  width: 'auto',
  height: 'auto',
  colHeaders: ['ID', 'Customer name', 'Product name', 'Size', 'qty', 'Return'],
  licenseKey: 'non-commercial-and-evaluation'
});

const alterTable = () => {
  hot.alter('insert_row', 10, 10);
  hot.alter('insert_col', 6, 1);
  hot.populateFromArray(10, 0, data2);
  hot.populateFromArray(11, 0, data3);
  hot.setCellMeta(2, 2, 'className', 'green-bg');
  hot.setCellMeta(4, 2, 'className', 'green-bg');
  hot.setCellMeta(5, 2, 'className', 'green-bg');
  hot.setCellMeta(6, 2, 'className', 'green-bg');
  hot.setCellMeta(8, 2, 'className', 'green-bg');
  hot.setCellMeta(9, 2, 'className', 'green-bg');
  hot.setCellMeta(10, 2, 'className', 'green-bg');
  hot.alter('remove_col', 6, 1);
  hot.alter('remove_row', 10, 10);
  hot.setCellMeta(0, 5, 'className', 'red-bg');
  hot.setCellMeta(10, 5, 'className', 'red-bg');
  hot.render(); // Render is needed here to populate the new "className"s
}

const logOutput = msg => {
  const logDiv = document.querySelector('#logOutput');
  const div = document.createElement('div');
  const now = new Date();

  div.innerText = '[' + now.toTimeString().slice(0, 8) + '] ' + msg;
  logDiv.insertBefore(div, logDiv.firstChild);
}

Handsontable.dom.addEvent(buttonWithout, 'click', () => {
  const t1 = performance.now();
  alterTable();
  const t2 = performance.now();

  logOutput('Time without batch ' + (t2 - t1).toFixed(2) + 'ms');
});

Handsontable.dom.addEvent(buttonWith, 'click', () => {
  const t1 = performance.now();
  hot.batch(alterTable);
  const t2 = performance.now();

  logOutput('Time with batch ' + (t2 - t1).toFixed(2) + 'ms');
});
```
:::
