---
id: deqvum60
title: Comments
metaTitle: Comments - JavaScript Data Grid | Handsontable
description: Add a comment (a note) to a cell, using the context menu, just like in Excel. Edit and delete comments. Make comments read-only.
permalink: /comments
canonicalUrl: /comments
tags:
  - notes
react:
  id: lxw2632u
  metaTitle: Comments - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Comments

Add a comment (a note) to a cell, using the context menu, just like in Excel. Edit and delete comments. Make comments read-only.

[[toc]]

## Enable the plugin

Set the [`comments`](@/api/options.md#comments) configuration option to `true` to enable the feature and add all the needed context menu items. For example:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
  ],
  comments: true,
  autoWrapRow: true,
  autoWrapCol: true
});
```

:::

::: only-for react

```jsx
<HotTable
  data={[
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
  ]}
  comments={true}
/>
```

:::

## Add comments via the context menu

After you've enabled the plugin, the [Context Menu](@/guides/accessories-and-menus/context-menu/context-menu.md) gains a few new items:

- Add/Edit comment
- Delete comment
- Read-only comment

## Set up pre-set comments

You can also pre-define comments for your table. Comments are stored in the table's/column's/cell's metadata object and you can declare as any value of the respective type. For example:

::: only-for javascript

```js
cell: [
  { row: 1, col: 1, comment: { value: 'Hello world!' } }
]
```

:::

::: only-for react

```jsx
cell={[
  { row: 1, col: 1, comment: { value: 'Hello world!' } }
]}
```

:::

In this example, the comment "Hello world!" is added to the cell at `(1,1)`.

## Basic example

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/javascript/example1.js)
@[code](@/content/guides/cell-features/comments/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/react/example1.jsx)
@[code](@/content/guides/cell-features/comments/react/example1.tsx)

:::

:::

## Make a comment read-only

By default, all comments are editable. To change this, set the [`readOnly`](@/api/options.md#readonly) configuration option to `true` when adding a comment. This example makes the "Tesla" comment attached to a cell read-only, whereas the "Honda" comment attached to another cell is editable.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/javascript/example2.js)
@[code](@/content/guides/cell-features/comments/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/react/example2.jsx)
@[code](@/content/guides/cell-features/comments/react/example2.tsx)

:::

:::

## Set a comment box's size

To set the width and height of a comment box, use the [`style`](@/api/options.md#comments) parameter.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/javascript/example3.js)
@[code](@/content/guides/cell-features/comments/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/react/example3.jsx)
@[code](@/content/guides/cell-features/comments/react/example3.tsx)

:::

:::

## Set a delay for displaying comments

To display comments after a pre-configured time delay, use the [`displayDelay`](@/api/options.md#comments) parameter.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/javascript/example4.js)
@[code](@/content/guides/cell-features/comments/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/comments/react/example4.jsx)
@[code](@/content/guides/cell-features/comments/react/example4.tsx)

:::

:::

## Related keyboard shortcuts

| Windows                                                 | macOS                                                      | Action                                  |  Excel  | Sheets  |
| ------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Alt**</kbd>+<kbd>**M**</kbd> | <kbd>**Ctrl**</kbd>+<kbd>**Option**</kbd>+<kbd>**M**</kbd> | Add or edit a comment                   | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                    | Save and exit the current comment       | &cross; | &check; |
| <kbd>**Escape**</kbd>                                   | <kbd>**Escape**</kbd>                                      | Exit the current comment without saving | &cross; | &cross; |

## Related API reference

- Configuration options:
  - [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
  - [`comments`](@/api/options.md#comments)
