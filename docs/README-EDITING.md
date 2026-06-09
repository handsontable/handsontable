# Documentation editing guidelines

This page covers guidelines for editing the [Handsontable documentation](https://handsontable.com/docs).

## Maintenance rules

When adding new documentation files, check the documentation [directory structure](./README.md#handsontable-documentation-directory-structure), and follow the guidelines below.

### Filenames

* Use only lower-case characters.
* To separate words, use `-`.
* Use the `.md` file extension.

### Frontmatter

Each Markdown file can start with the following frontmatter tags:

| Tag              | Meaning                                              | Default value                                              |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `id`             | The page's unique ID.                                  | Required. Used for redirecting between different versions (e.g., 12.1 to 11.0) of the same documentation page (https://github.com/handsontable/handsontable/pull/10163). Don't change the IDs of existing pages. To add an ID for a new page, generate 8 random alphanumeric characters (https://www.random.org/strings/?num=20&len=8&digits=on&loweralpha=on&unique=on&format=html&rnd=new). |
| `title`          | The page's header.                                   | If not set, gets generated from the page's parent's title. |
| `permalink`      | The page's **unique** URL.                           | If not set, gets generated from the Markdown file name.    |
| `canonicalUrl`   | A canonical URL of the page's latest version.        | None (not required)                                        |
| `metaTitle`      | The page's SEO meta title.                           | None (not required)                                        |
| `description`    | The page's SEO meta description.                     | None (not required)                                        |
| `tags`           | Search tags used by the documentation search engine. | None (not required)                                 |
| `react`          | Holds an alternative set of frontmatter tags (applied only to the React version of the page) | None (not required)                                             |
| `angular`        | Holds an alternative set of frontmatter tags (applied only to the Angular version of the page) | None (not required)                                             |
| `searchCategory` | Search category used by the search engine to categorize the search results. | If not set, the search result will be listed under the default "Guides" section. |
| `menuTag`        | A tag displayed next to the page title in the sidebar menu. | None (not required) |
| `category`       | The content category for organizing pages. | None (not required) |

You can set different frontmatter tags for different framework versions of the page. For example, you can set `metaTitle` to say either `JS data grid` or `React data table`, depending on the framework:

\```yaml
// applies to the JS version of the page
metaTitle: JS data grid

// applies to the React version of the page
react:
  metaTitle: React data table

// applies to the Angular version of the page
angular:
  metaTitle: Angular data table
\```

You can use the following framework keys:
- `react`
- `angular`

Frontmatter example:

```yaml
---
id: 1ezrscdc
title: Introduction
metaTitle: Installation - Guide - Handsontable Documentation for Javascript
description: Easily install the data grid using your preferred package manager or import Handsontable assets directly from the CDN.
permalink: /api/
canonicalUrl: /api/
react:
  id: xyr8fg2e # The page id should be different for different for other framework variations
  metaTitle: Installation - Guide - Handsontable Documentation for React
  description: Install the wrapper for React via npm, import stylesheets, and use it to get up and running your application.
  customValue: Custom # Custom value that can be used within template and will be available only for React framework
angular:
  id: abc12345
  metaTitle: Installation - Guide - Handsontable Documentation for Angular
  description: Install the wrapper for Angular via npm, import stylesheets, and use it to get up and running your application.
tags:
  - api
  - api ref
searchCategory: API Reference
---
```

## Editing the documentation

When editing the documentation content, follow the guidelines below.

> **Note:** Content `.md` files and the example source files they embed hot reload automatically in `npm run dev`. The custom content loader (`src/plugins/framework-loader.mjs`) watches `content/` and re-syncs the affected pages on each change. If content ever looks stale, restart the dev server with `npm run dev -- --force` to rebuild Astro's data store from scratch.

### Editing the `next` documentation version

Draft files to be included in the documentation's next version are kept in the `content` directory.

The `next` version of the documentation is available only locally and on the staging server.

To display the `next` version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-documentation).
2. In your browser, go to http://localhost:4321/docs/.

### Editing a published documentation version

To edit an already-published documentation version, go to the [`prod-docs/<MAJOR.MINOR>` branch](./README.md#handsontable-docs-branches-structure) (e.g. `prod-docs/9.0`).

To display a published documentation version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-documentation).
2. In your browser, go to http://localhost:4321/docs/.

If you're editing the `latest` version (a version with the largest `<MAJOR.MINOR>` number), remember to make the same edits to the `next` version as well.

### Editing the API reference

The `next` version's API reference is generated automatically from the source code, into the `/content/api/` directory.

To edit the `next` version's API reference:
1. Go into the source code and change the required JSDoc comments.
2. Generate the `next` version's API reference output:
    ```bash
    npm run docs:api
    ```

To edit a published version's API reference:
1. Go to the required version's API reference output: `/docs/<MAJOR.MINOR>/api` (e.g. `/docs/9.0/api`).
2. Edit the required Markdown files.

## Reviewing the documentation

When reviewing someone else's changes, you can see the documentation output in a few different ways:
- Switch to the reviewed branch, pull the latest changes, and [start a local documentation server](./README.md#getting-started-with-handsontable-documentation).
- [Deploy the documentation to the staging environment](./README-DEPLOYMENT.md#manually-deploying-the-documentation-to-the-staging-environment) (https://dev.handsontable.com/docs).

## Documentation versioning

New documentation is created automatically after the Handsontable is released. The `stable-publish` job in `.github/workflows/publish.yml` creates or updates the documentation production branch, generates API content from source code, commits, and pushes - which then triggers the Netlify deployment.

## Markdown links

When linking to other documentation pages, **avoid using absolute links or relative URLs**.

To link to another page in the same documentation version, use the following syntax:

```markdown
[link_text](@/relative_file_path_from_this_version's_root/file_name.md#some-anchor)
```

For example, to link to a file called `core.md`, from anywhere in the same documentation version:

```markdown
[Core](@/api/core.md#updatesettings)
```

To link to another page but for other framework (and still for the same documentation version), use the following syntax:

```markdown
[link_text](@/{FRAMEWORK}/relative_file_path_from_this_version's_root/file_name.md#some-anchor)
```

For example, to link to a file called `./content/guides/getting-started/react-methods.md` that should be accessible only for React framework, use:

```markdown
[React methods](@/react/guides/getting-started/react-methods/react-methods.md)
```

When there is no framework defined in the link URL, the generated link will be pointed to the currently viewed framework. For example, link `[Core](@/api/core.md)` for Javascript will point to `/docs/javascript-data-grid/api/core` and for chosen React framework to `/docs/react-data-grid/api/core`.

List of available frameworks: `javascript`, `react`, `angular`.

Follow these rules:
* After the `@` character, provide the target's relative file path (from the current version's root directory).
  For example: `[Clipboard][@/guides/cell-features/clipboard/clipboard.md]`.
* After the target file's name, add the `.md` [extension](#filenames).
  For example: `[Autofill](@/api/autofill.md)`.
* To link to a specific section, use anchors.
  For example: `[Core](@/api/core.md#some-anchor)`.

Also, the following rules apply:
* The target file needs to have the `permalink` [frontmatter](#frontmatter) tag defined.
* If generating a final URL link fails, the initial value gets output as a relative link.

## Markdown containers

To render content in different ways, the documentation uses Markdown containers, for example:

```markdown
::: example #exampleId .class :preset --html 1 --js 2

// code example

:::
```

We use the following Markdown containers:

| Container                    | Usage                                             |
| -----------------------------|-------------------------------------------------- |
| `::: tip [title]`            | Adds a blue tip note.                             |
| `::: warning [title]`        | Adds a yellow warning note.                       |
| `::: danger [title]`         | Adds a red danger note.                           |
| `::: details [title]`        | Adds an accordion with expandable content.        |
| `::: source-code-link <URL>` | Adds a source code link to the API ref header.    |
| `::: example [options]`      | Renders a code example as specified in [options]. |

These containers are processed by the `vuepress-preprocessor.mjs` plugin in `src/plugins/`, which converts the VuePress-style syntax into Astro/Starlight-compatible output.

For `tip` / `warning` / `danger` / `note` callouts, the body is not full CommonMark. The preprocessor turns inline `` `code` ``, `**bold**`, and `[label](url)` into HTML (see `aside-inline-markdown.mjs`).

### Adding code examples

Using the `example` Markdown container, you can add code snippets that show the code's result:

```md
::: example #exampleId .class :react-redux --html 1 --js 2 --css 3 --no-edit --tab preview
    ```html
    <div id="exampleId"></div>
    ```
    ```js
    // code here
    ```
    ```css
    /* custom css here */
    ```
:::
```

The `example` Markdown container offers the following options:

| Option         | Required | Example         | Possible values                                                                                                                                                                                                                                             | Usage                                                                                                 |
| -------------- | -------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `#exampleId`   | No       | `#example1`     | String                                                                                                                                                                                                                                                      | Container's unique ID.                                                                                |
| `.class`       | No       | `.new-class`    | String                                                                                                                                                                                                                                                      | Container's custom class.                                                                             |
| `:preset`      | No       | `:hot`          | `:hot` \| `:hot-lang` \| `:hot-numbro` \| `:react` \| `:react-languages` \| `:react-numbro` \| `:react-redux` \| `:react-advanced` \| `:angular` \| `:angular-languages` \| `:angular-numbro` \| `:vue3` \| `:vue3-numbro` \| `:vue3-languages` \| `:vue3-vuex` | Sets code dependencies.                                                                               |
| `--js <pos>`   | No       | `--js 1`        | Positive integer<br>(default `1`)                                                                                                                                                                                                                           | Sets the JS code snippet's position<br>in the markdown container.                                     |
| `--html <pos>` | No       | `--html 2`      | Positive integer<br>(default `0`)                                                                                                                                                                                                                           | Sets the HTML code snippet's position<br>in the markdown container.<br><br>`0` disables the HTML tab. |
| `--css <pos>`  | No       | `--css 2`       | Positive integer<br>(default `0`)                                                                                                                                                                                                                           | Sets the CSS code snippet's position<br>in the markdown container.<br><br>`0` disables the CSS tab.   |
| `--no-edit`    | No       | `--no-edit`     | `--no-edit`                                                                                                                                                                                                                                                 | Removes the **Edit** button.                                                                          |
| `--tab <tab>`  | No       | `--tab preview` | `code` \| `html` \| `css` \| `preview`                                                                                                                                                                                                                      | Sets a tab as open by default.                                                                        |

### Non-editable examples
You can also embed an example without the tabbed container.
To display just the result of the code you want to present, use the `<HandsontablePreview>` component. The code wrapped in this component and a markdown code block will be rendered with the context of the current Handsontable version.
```js
<HandsontablePreview>
```js
  // enter the Handsontable-related code here.
  const containerElement = document.querySelector('#hot');

  new Handsontable(containerElement, {});
```
</HandsontablePreview>
```

**Note: Remember to place all the needed HTML and `<style>` elements in the markdown file as well.**

## React style guide

When you edit React examples and code samples, follow the guidelines below.

For matters not covered here, follow the conventions of https://beta.reactjs.org/learn.

- Don't gather multiple props in a single `settings={}` prop. Instead, specify individual props.
  ```jsx
  <HotTable
    data={data}
    height="auto"
  />
  ```
- In JSX, use double quotes (`""`). If a prop's value is a string, use double quotes without curly braces.
  ```jsx
  licenseKey="00000-00000-00000-00000-00000"
  ```
- In JS inside of JSX, use single quotes (`''`). For example, if a React prop contains a JS object:
  ```jsx
  <HotTable
    licenseKey="00000-00000-00000-00000-00000"
    nestedHeaders={[
      ['A', { label: 'B', colspan: 8 }, 'C']
    ]}
  />
  ```
- Get rid of elements that are not necessary (e.g., a `<Fragment>` with a single child).
- Use named imports:
  ```js
  import { useRef } from 'react';
  useRef(...);
  ```
- If a constant's value is a reference to the Handsontable component instance, add `Ref` to that constant's name.
  ```js
  const hotRef = useRef(null);
  const hotTableComponentRef = useRef(null);
  ```
- In functional React components, use `useRef` instead of `React.createRef`.
- For the React Fragments, use the `<>` shorthand instead of the explicit syntax (`<React.Fragment>`).
  ```jsx
    <>
      <HotTable/>
      <div className="controls">
      // (...)
      </div>
    </>
  ```
- Always define `data` as a const, outside of JSX.
  ```jsx
  const data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
  ];

  return <HotTable data={data} />
  ```
