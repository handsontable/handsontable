---
id: A unique, 8-character ID (e.g., 45dody2p) for the JS version of this page (use https://www.random.org/strings/?num=20&len=8&digits=on&loweralpha=on&unique=on&format=html&rnd=new)
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
  id: A unique, 8-character ID (e.g., f8xulniq) for the React version of this page
  metaTitle: Feature name - React Data Grid | Handsontable
searchCategory: Guides
---

# Feature name

**Introduction paragraph. Can be the same as the SEO description. Max 160 characters. Start with an action verb.**

[[toc]]

Description of the demo's UI. Explain how the end-user uses the feature.

::: only-for javascript

::: example #example1
```js
Javascript demo. Data as an array of objects.
```
:::

:::

::: only-for react

::: example #example1 :react
```jsx
React demo. Data as an array of objects.
```
:::

:::

## Enable [feature name]

Explain how to enable the feature.

::: only-for javascript

<code-group>
  <code-block title="Entire grid">
  
  ```js
  const configurationOptions = {
    // enable [feature name] for the entire grid
    ...
  }
  ```
  
  </code-block>
  <code-block title="Columns">
  
  ```js
  const configurationOptions = {
    columns: [
      // enable [feature name] for column 1
      {
        ...
      },
      // enable [feature name] for the column 2
      {
        ...
      },
    ],
  }
  ```
  
  </code-block>
  <code-block title="Rows">
  
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
  
  </code-block>
  <code-block title="Cells">
  
  ```js
  const configurationOptions = {
    cell: [
      {
        ...
      },
    ],
  }
  ```
  
  </code-block>
</code-group>
:::

::: only-for react

<code-group>
  <code-block title="Entire grid">
  
  ```jsx
  <HotTable
  // enable [feature name] for the entire grid
    ...
  />
  ```
  
  </code-block>
  <code-block title="Columns">
  
  ```jsx
  <HotTable>
    <HotColumn ... />
    <HotColumn ... />
    <HotColumn ... />
  </HotTable>
  ```
  
  </code-block>

  <code-block title="Rows">
  
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
  
  </code-block>
  <code-block title="Cells">
  
  ```jsx
  <HotTable
    cell={[
      { 
        ...
      },
    ]}
  />
  ```
  
  </code-block>
</code-group>

:::

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

## [Configuration]

Add multiple [Configuration] sections. In each, explain how to use the feature's built-in options and APIs.

For example, for "Rows sorting", we'd have the following [Configuration] sections:
- Sort different types of data
- Sort by multiple columns
- Set the initial sorting order
- Add a custom comparator
- Add a custom sorting icon

Start each section title with an action verb.

For each section, add a demo (with data as an array of objects).

::: only-for javascript

::: example #example2
```js
Javascript demo. Data as an array of objects.
```
:::

:::

::: only-for react

::: example #example2 :react
```jsx
React demo. Data as an array of objects.
```
:::

:::

## Control [feature name] programmatically

Explain how to use the feature's API methods. Add code samples. Add links to related API reference sections.

### Disable [feature name]

Explain how to disable and re-enable the feature at runtime (by using `updateSettings()`).

::: only-for javascript

<code-group>
  <code-block title="Entire grid">
  
  ```js
  // disable [featur name] for the entire grid
  handsontableInstance.updateSettings({
    ...
  });

  // re-enable [feature name] for the entire grid
  handsontableInstance.updateSettings({
    ...
  });
  ```
  
  </code-block>
  <code-block title="Columns">
  
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
  
  </code-block>
  <code-block title="Rows">
  
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
  
  </code-block>
  <code-block title="Cells">
  
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
  
  </code-block>
</code-group>

:::

::: only-for react

<code-group>
  <code-block title="Entire grid">
  
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
  
  </code-block>
  <code-block title="Columns">
  
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
  
  </code-block>

  <code-block title="Rows">
  
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
  
  </code-block>
  <code-block title="Cells">
  
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
  
  </code-block>
</code-group>

:::

## More examples
    
List links to CodeSandbox examples, taken from:
- https://handsontable.com/docs/12.0/examples
- https://examples.handsontable.com

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