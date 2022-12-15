---
title: Feature name
metaTitle: Feature name - JavaScript Data Grid | Handsontable
description: SEO description. Max 160 characters. Start with an action verb.
permalink: /feature-name
canonicalUrl: /feature-name
tags:
  - additional
  - search
  - tags
react:
  metaTitle: Feature name - React Data Grid | Handsontable
searchCategory: Guides
---

# Feature name

Introduction paragraph. Can be the same as the SEO description. Max 160 characters. Start with an action verb.

[[toc]]

Description of the demo's UI. Explain how the end-user uses the feature.

::: only-for javascript
::: example #example1
```js
Javascript demo.
```
:::

::: only-for react
::: example #example1 :react
```jsx
React demo.
```
:::

## Enable [feature name]

Explain how to enable the feature for the entire grid. Max 1 sentence.

::: only-for javascript
```js
const configurationOptions = {
  ...
}
```
:::

::: only-for react
```jsx
<HotTable
  ...
/>
```
:::

Explain how to enable the feature for selected columns. Max 1 sentence.

::: only-for javascript
```js
const configurationOptions = {
  columns: [
    {
      ...
    },
    {
      ...
    },
  ],
}
```
:::

::: only-for react
```jsx
<HotTable>
  <HotColumn ... />
  <HotColumn ... />
  <HotColumn ... />
</HotTable>
```
:::

Explain how to enable the feature for selected rows. Max 1 sentence.

::: only-for javascript
```js
const configurationOptions = {
  cells(row, col, prop) {
    if (row === 1 || row === 4) {
      return {
        ...
      };
    }
  }
}
```
:::

::: only-for react
```jsx
<HotTable
  cells={(row, col, prop) => {
    if (row === 1 || row === 4) {
      return {
        ...
      };
    }
  }}
/>
```
:::

Explain how to enable the feature for selected cells. Max 1 sentence.

::: only-for javascript
```js
const configurationOptions = {
  cell: [
    {
      ...
    },
  ],
}
```
:::

::: only-for react
```jsx
<HotTable
  cell={[
    { 
      ...
    },
  ]}
/>
```
:::

## Disable [feature name]

Explain how to disable and re-enable the feature at runtime (by using `updateSettings()`) - for the entire grid.

::: only-for javascript
```js
// disable the feature
handsontableInstance.updateSettings({
   ...
});

// re-enable the feature
handsontableInstance.updateSettings({
   ...
});
```
:::

::: only-for react
```jsx
const hotTableComponentRef = useRef(null);

// disable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
   ...
});

// re-enable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
   ...
});
```
:::

Explain how to disable and re-enable the feature at runtime (by using `updateSettings()`) - for selected columns.

::: only-for javascript
```js
// disable the feature
handsontableInstance.updateSettings({
  columns: [
    {
      ...
    },
    {
      ...
    },
  ],
});

// re-enable the feature
handsontableInstance.updateSettings({
  columns: [
    {
      ...
    },
    {
      ...
    },
  ],
});
```
:::

::: only-for react
```jsx
const hotTableComponentRef = useRef(null);

// disable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
  columns: [
    {
      ...
    },
    {
      ...
    },
  ],
});

// re-enable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
  columns: [
    {
      ...
    },
    {
      ...
    },
  ],
});
```
:::

Explain how to disable and re-enable the feature at runtime (by using `updateSettings()`) - for selected rows.

::: only-for javascript
```js
// disable the feature
handsontableInstance.updateSettings({
  cells(row, col, prop) {
    if (row === 1 || row === 4) {
      return {
        ...
      };
    }
  }
});

// re-enable the feature
handsontableInstance.updateSettings({
  cells(row, col, prop) {
    if (row === 1 || row === 4) {
      return {
        ...
      };
    }
  }
});
```
:::

::: only-for react
```jsx
const hotTableComponentRef = useRef(null);

// disable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
  cells(row, col, prop) {
    if (row === 1 || row === 4) {
      return {
        ...
      };
    }
  }
});

// re-enable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
  cells(row, col, prop) {
    if (row === 1 || row === 4) {
      return {
        ...
      };
    }
  }
});
```
:::

Explain how to disable and re-enable the feature at runtime (by using `updateSettings()`) - for selected cells.

::: only-for javascript
```js
// disable the feature
handsontableInstance.updateSettings({
  cell: [
    {
      ...
    },
  ],
});

// re-enable the feature
handsontableInstance.updateSettings({
  cell: [
    {
      ...
    },
  ],
});
```
:::

::: only-for react
```jsx
const hotTableComponentRef = useRef(null);

// disable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
  cell: [
    {
      ...
    },
  ],
});

// re-enable the feature
hotTableComponentRef.current.handsontableInstance.updateSettings({
  cell: [
    {
      ...
    },
  ],
});
```
:::

## [Configuration]

Add multiple [Configuration] sections. In each, explain how to use the feature's built-in options and APIs.

For example, for "Rows sorting", we'd have the following [Configuration] sections:
- Sort different types of data
- Sort by multiple columns
- Set the initial sorting order
- Add a custom comparator
- Add a custom sorting icon

Start each section title with an action verb.

For each section, add a demo.

::: only-for javascript
::: example #example2
```js
Javascript demo.
```
:::

::: only-for react
::: example #example2 :react
```jsx
React demo.
```
:::

## Control [feature name] programmatically

Explain how to use the feature's API methods. Add code samples. Add links to related API reference sections.

## Examples
    
List links to CodeSandbox examples, taken from:
- https://handsontable.com/docs/12.0/examples
- https://examples.handsontable.com

## Configuration options

In a single code sample, list all of the feature's configuration options, with their default settings.

::: only-for javascript
```js
mainOption: {
  option1: defaultSetting,
  option2: defaultSetting,
  ...
}
```
:::

::: only-for react
```jsx
<HotTable
  mainOption={{
    option1: defaultSetting,
    option2: defaultSetting,
    ...
  }}
/>
```
:::

## Keyboard shortcuts

List all keyboard shortcuts related to the feature.

| Windows                                | macOS                                 | Action                                       |  Excel  | Sheets  |
| -------------------------------------- | ------------------------------------- | -------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**↑**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**↑**</kbd> | Move to the first cell of the current column | &check; | &check; |

## Known limitations

List known issues related to the feature:
- 
- 
- 

## Troubleshooting

Didn't find what you need? Try this:

- [View GitHub issues related to [feature name]](https://github.com/handsontable/handsontable/labels/[feature-label])
- [Report a new GitHub issue](https://github.com/handsontable/handsontable/issues/new/choose)
- [Ask a question on Stack Overflow](https://stackoverflow.com/questions/tagged/handsontable)
- [Ask a question on Handsontable's forum](https://forum.handsontable.com/) (if possible, link to a specific section)
- [Contact Handsontable's technical support](https://handsontable.com/contact?category=technical_support)


## Related content

Guides:
- [`Guide`](@/guides/guide)
Blog:
- [`Blog article`](https://handsontable.com/blog/articles/blog-article)

### API reference

Plugins:
- [`PluginName`](@/api/PluginName.md)
Configuration options:
- [`optionName`](@/api/options.md#optionName)
Handsontable hooks:
- [`hookName`](@/api/hooks.md#hookName)