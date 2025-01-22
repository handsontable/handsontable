---
id: kgegbmgz
title: Batch operations
metaTitle: Batch operations - JavaScript Data Grid | Handsontable
description: Batch CRUD operations, to avoid unnecessary rendering cycles and boost your grid's performance.
permalink: /batch-operations
canonicalUrl: /batch-operations
tags:
  - suspend rendering
  - batching
  - performance
react:
  id: 3xqdvk3u
  metaTitle: Batch operations - React Data Grid | Handsontable
searchCategory: Guides
category: Optimization
---

# Batch operations

Batch CRUD operations, to avoid unnecessary rendering cycles and boost your grid's performance.

[[toc]]

<style>
.handsontable .green-bg {
  color: #fff;
  background-color: #37BC6C !important;
}

.handsontable .red-bg {
  color: #fff;
  background-color: #FF5A12 !important;
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

Within Handsontable, every CRUD operation ends with a [`render()`](@/api/core.md#render). In most cases, this is considered expected behaviour. The table has to reflect the requested changes at some point. However, sometimes you may find this mechanism slightly excessive.

For example, if you wrote a custom function that uses several CRUD operations, those CRUD operations will call a [`render()`](@/api/core.md#render) for each API method. You only need one render at the end, which is sufficient to reflect all the changes. You can treat those combined operations as a single action and let the render wait for them to complete. To do this, use suspend the render to batch the operations.

This can improve the overall performance of the application. Batching several operations can decrease the number of renders, so any API call that ends with a render will benefit from this improvement. It results in less layout trashing, fewer freezes, and a more responsive feel.

There are several API methods you can use for suspending, but [`batch()`](@/api/core.md#batch) is the most universal method. It is a callback function where the [`render()`](@/api/core.md#render) is executed after all operations provided inside of the body are completed. It is best practice to use this method as it's safer and easier to use. You just need to place all operations that you want to batch inside a closure. Handsontable takes care of the suspending and performs a single [`render()`](@/api/core.md#render) at the end.

The following snippet shows a simple example of a few operations batched. Three API operations are called one after another. Without placing them inside the batch callback, every single operation would end with a [`render()`](@/api/core.md#render). Thanks to the batching feature, you can skip two renders and end the whole action with one render at the end. This is more optimal, and the gain increases with the number of operations placed inside the [`batch()`](@/api/core.md#batch).

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

```js
// call the batch method on an instance
hot.batch(() => {
  // run the operations as needed
  hot.alter('insert_row_above', 5, 45);
  hot.setDataAtCell(1, 1, 'x');
  hot.selectCell(0, 0);
  // the render is executed right after all of the operations are completed
});
```

Suspending the render results in better performance, which is especially noticeable when numerous operations are batched. The diagram shows a comparison where the same operations were performed with (deep blue columns) and without the batch (light blue columns). The gain in speed of execution time increases with the number of operations batched.

<span class="img-invert">

![batch_operations_comparison]({{$basePath}}/img/batch_operations_comparison.png)

</span>

::: tip

Note that other methods can be used to batch operations, but they are slightly more advanced and should be used with caution. Flickering, glitches or other visual distortion may happen when you forget to `resume` render after suspending it several times. Mixing methods of a render type with those focused on operations can also result in some unexpected behavior. Above all, [`batch()`](@/api/core.md#batch) should be sufficient in most use cases, and it is safe to work with.

:::

## API methods

The following API methods allow suspending:

- [`batch()`](@/api/core.md#batch)
- [`batchRender()`](@/api/core.md#batchrender)
- [`batchExecution()`](@/api/core.md#batchexecution)
- [`suspendRender()`](@/api/core.md#suspendrender) and [`resumeRender()`](@/api/core.md#resumerender)
- [`suspendExecution()`](@/api/core.md#suspendexecution) and [`resumeExecution()`](@/api/core.md#resumeexecution)

By using these methods, you can suspend:

- rendering
- execution
- both rendering and the execution.

The term "rendering" refers directly to DOM rendering, and the term "execution" refers to all operations that are different from DOM rendering. Currently, only the indexing recalculation allows you to postpone the process.

Method names that are prefixed with `batch\*`, i.e., [`batch()`](@/api/core.md#batch), [`batchRender()`](@/api/core.md#batchrender), and [`batchExecution()`](@/api/core.md#batchexecution) are recommended to be used as the first choice if you don't need to batch async operations.
Methods names that are prefixed with `suspend\*`, i.e., [`suspendRender()`](@/api/core.md#suspendrender) and [`suspendExecution()`](@/api/core.md#suspendexecution), are the second choice. These are useful when you need to batch async operations. Essentially they work the same way as `batch\*` methods, but the render has to be resumed manually.

### batch* methods

#### batch

This method supsends both rendering and other operations. It is universal and especially useful if you want to batch multiple API calls within the application.

```js
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.setDataAtCell(1, 1, 'x');

  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated, and table render will be called once after executing the callback
});
```

#### batchRender

The [`batchRender()`](@/api/core.md#batchrender) method is a callback function. Excessive renders can be skipped by placing the API calls inside it. The table will be rendered after executing the callback. It is less prone to errors as you don't have to remember to resume the render. The only drawback to this method is that it doesn't support async operations.

```js
hot.batchRender(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.setDataAtCell(1, 1, 'x');
  // The table will be rendered once after executing the callback
});
```

#### batchExecution

The [`batchExecution()`](@/api/core.md#batchexecution) is a callback function. Excessive renders can be skipped by placing the API calls inside of it. The table will be rendered after executing the callback. It is less prone to errors as you don't have to remember to resume the operations. The only drawback to this method is that it doesn't support async operations.

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

#### [`suspendRender()`](@/api/core.md#suspendrender) and [`resumeRender()`](@/api/core.md#resumerender)

To suspend the rendering process, call the [`suspendRender()`](@/api/core.md#suspendrender) method just before the actions you want to batch. This is a manual approach.

After suspending, resume the process with the [`resumeRender()`](@/api/core.md#resumerender) method. Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call. For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.

```js
hot.suspendRender(); // suspend rendering
hot.alter('insert_row_above', 5, 45);
hot.setDataAtCell(1, 1, 'x');
hot.resumeRender(); // remember to resume rendering
```

#### suspendExecution and resumeExecution

To suspend the rendering process, you can call the [`suspendExecution()`](@/api/core.md#suspendexecution) method just before the actions you want to batch. This is a manual approach. After suspending, you must remember to resume the process with the [`resumeExecution()`](@/api/core.md#resumeexecution) method.

```js
hot.suspendExecution();
const filters = hot.getPlugin('filters');

filters.addCondition(2, 'contains', ['3']);
filters.filter();
hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
hot.resumeExecution(); // It updates the cache internally
```

## Live demo of the suspend feature

The following examples show how much the [`batch()`](@/api/core.md#batch) method can decrease the render time. Both of the examples share the same dataset and operations. The first one shows how much time lapsed when the [`batch()`](@/api/core.md#batch) method was used. Run the second example to check how much time it takes to render without the [`batch()`](@/api/core.md#batch) method.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/optimization/batch-operations/javascript/example1.html)
@[code](@/content/guides/optimization/batch-operations/javascript/example1.js)
@[code](@/content/guides/optimization/batch-operations/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/optimization/batch-operations/react/example1.jsx)
@[code](@/content/guides/optimization/batch-operations/react/example1.tsx)

:::

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Performance](@/guides/optimization/performance/performance.md)

</div>

### Related blog articles

<div class="boxes-list">

- [Handsontable 8.3.0 has been released](https://handsontable.com/blog/handsontable-8.3.0-has-been-released)

</div>

### Related API reference

- Configuration options:
  - [`maxCols`](@/api/options.md#maxcols)
  - [`maxRows`](@/api/options.md#maxrows)
  - [`observeDOMVisibility`](@/api/options.md#observedomvisibility)
  - [`renderAllColumns`](@/api/options.md#renderallcolumns)
  - [`renderAllRows`](@/api/options.md#renderallrows)
- Core methods:
  - [`batch()`](@/api/core.md#batch)
  - [`batchExecution()`](@/api/core.md#batchexecution)
  - [`batchRender()`](@/api/core.md#batchrender)
  - [`isExecutionSuspended()`](@/api/core.md#isexecutionsuspended)
  - [`suspendExecution()`](@/api/core.md#suspendexecution)
  - [`isRenderSuspended()`](@/api/core.md#isrendersuspended)
  - [`render()`](@/api/core.md#render)
  - [`resumeExecution()`](@/api/core.md#resumeexecution)
  - [`resumeRender()`](@/api/core.md#render)
  - [`suspendRender()`](@/api/core.md#suspendrender)
- Hooks:
  - [`afterRender`](@/api/hooks.md#afterrender)
  - [`afterViewRender`](@/api/hooks.md#afterviewrender)
  - [`beforeChangeRender`](@/api/hooks.md#beforechangerender)
  - [`beforeRender`](@/api/hooks.md#beforerender)
  - [`beforeViewRender`](@/api/hooks.md#beforeviewrender)
