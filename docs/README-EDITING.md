# Documentation editing guidelines

This page covers guidelines for editing the [Handsontable documentation](https://handsontable.com/docs).

## Maintenance rules

When adding new documentation files, check the documentation [directory structure](./README.md#handsontable-documentation-directory-structure), and follow the guidelines below.

### Filenames

* Use only lower-case characters.
* To separate words, use `-`.
* Use the `.md` file extension. The `.vue` extension is disabled.

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
| `searchCategory` | Search category used by the search engine to categorize the search results. | If not set, the search result will be listed under the default "Guides" section. |

You can set different frontmatter tags for different framework versions of the page. For example, you can set `metaTitle` to say either `JS data grid` or `React data table`, depending on the framework:

\```yaml
// applies to the JS version of the page
metaTitle: JS data grid

// applies to the React version of the page
react:
  metaTitle: React data table
\```

You can use the following framework keys:
- `react`

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
tags:
  - api
  - api ref
searchCategory: API Reference # The list of categories can be found here ./docs/.vuepress/config.js#L258
---
```

### Sitemap frontmatter

The [`vuepress-plugin-sitemap`](https://www.npmjs.com/package/vuepress-plugin-sitemap) lets us use additional tags to customize the documentation site map:

```
---
sitemap:
  exclude: false
  changefreq: hourly
---
```

## Editing the documentation

When editing the documentation content, follow the guidelines below.

### Editing the `next` documentation version

Draft files to be included in the documentation's next version are kept in the `content` directory.

The `next` version of the documentation is available only locally and on the staging server.

To display the `next` version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-documentation).
2. In your browser, go to http://localhost:8080/docs/.

### Editing a published documentation version

To edit an already-published documentation version, go to the [`prod-docs/<MAJOR.MINOR>` branch](./README.md#handsontable-docs-branches-structure) (e.g. `prod-docs/9.0`).

To display a published documentation version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-documentation).
2. In your browser, go to http://localhost:8080/docs/{MAJOR.MINOR}/.

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
- Switch to the reviewed branch, pull the latest changes, and [start a local documentation server](./README.md#getting-started-with-handsontable-documentation) ([link redirects](./docker/redirects.conf) won't work, though).
- [Deploy the documentation to the staging environment](./README-DEPLOYMENT.md#manually-deploying-the-documentation-to-the-staging-environment) (https://dev.handsontable.com/docs).
- [Deploy the documentation locally at a specific commit](#deploying-the-documentation-locally-at-a-specific-commit).

### Deploying the documentation locally at a specific commit

To deploy the documentation locally at a `[COMMIT_HASH]` commit:
1. If you don't have [Docker Desktop](https://www.docker.com/products/docker-desktop), install it.
2. From the `docs` directory, run the following command:
   ```bash
   npm run docs:review [COMMIT_HASH]
   ```
3. In your browser, go to: http://localhost:8000/docs/.

## Documentation versioning

New documentation is created automatically after the Handsontable is released. The `./scripts/release.mjs`
takes care to create a Documentation production branch, generate API content from source code, commit, and deploy the Docs image to the production.

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

List of available frameworks: `javascript`, `react`.

Follow these rules:
* After the `@` character, provide the target's relative file path (from the current version's root directory).<br>
  For example: `[Clipboard][@/guides/cell-features/clipboard/clipboard.md]`.
* After the target file's name, add the `.md` [extension](#filenames)<br>
  For example: `[Autofill](@/api/autofill.md)`.
* To link to a specific section, use anchors.<br>
  For example: `[Core](@/api/core.md#some-anchor)`.

Also, the following rules apply:
* The target file needs to have the `permalink` [frontmatter](#frontmatter) tag defined.
* If generating a final URL link fails, the initial value gets output as a relative link.<br>
  The documentation's [link checker](./README.md#documentation-npm-scripts) catches such failed links.

### Checking for broken links

To check for broken links:

1. Generate the Handsontable API reference. From the `docs` directory, run:
    ```bash
    npm run docs:api
    ```
2. Build the documentation output. From the `docs` directory, run:
    ```bash
    npm run docs:build
    ```
3. Check for broken links. From the `docs` directory, run:
   ```bash
   npm run docs:check-links
   ```
4. Open the broken links report: `/docs/report-check-links.xlsx`.


## Markdown variables

It is possible to include metadata from VuePress or frontmatter in the content using the `$page` object and the following syntax:

```
Welcome the users of {{ $page.frameworkName }}!
```

The above code prints the following text in the React variant of the docs:

> Welcome the users of React!

The full list of available variables is available at:

- https://vuepress.vuejs.org/guide/frontmatter.html (official)
- https://github.com/handsontable/handsontable/blob/develop/docs/.vuepress/plugins/extend-page-data/index.js#L76-L82 (our modifications)

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

For more information, see the [VuePress documentation](https://v1.vuepress.vuejs.org/guide/markdown.html#custom-containers).

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
| `:preset`      | No       | `:hot`          | `:hot` \| `:hot-lang` \| `:hot-numbro` \| `:react` \| `:react-languages` \| `:react-numbro` \| `:react-redux` \| `:react-advanced` \| `:angular` \| `:angular-languages` \| `:angular-numbro` \| `:vue` \| `:vue-numbro` \| `:vue-languages` \| `:vue-vuex` | Sets code dependencies.                                                                               |
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

### Finding the broken examples

The `example-checker` script checks if:
- Every example container's code initializes at least one Handsontable instance.
- The number of Handsontable instances implemented in the example containers corresponds to the number of Handsontable instance DOM containers being rendered on the page.

To use the `example-checker` script: (all the commands need to be run from the `docs` directory)
1. Build the documentation.
  ```bash
  npm run docs:build
  ```
2. Run the script:
  ```bash
  npm run docs:test:example-checker
  ```

The script is also automatically executed by the `Docs Staging Deployment` Github Actions workflow.

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
