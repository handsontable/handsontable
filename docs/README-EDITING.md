# Documentation editing guidelines

This page covers guidelines for editing the [Handsontable documentation](https://handsontable.com/docs).

## Maintenance rules

When adding new documentation files, check the documentation [directory structure](./README.md#handsontable-docs-directory-structure), and follow the guidelines below.

### Filenames

* Use only lower-case characters.
* To separate words, use `-`.
* Use the `.md` file extension. The `.vue` extension is disabled.

### Frontmatter

Each Markdown file starts with the following frontmatter tags:

| Tag            | Meaning                                                    | Required |
|----------------|------------------------------------------------------------|----------|
| `title`        | The page's header.                                         | Yes      |
| `permalink`    | The page's **unique** URL.                                 | Yes      |
| `canonicalUrl` | A canonical URL of the page's latest version.              | Yes      |
| `metaTitle`    | The page's SEO meta title.                                 | No       |
| `tags`         | Tags used by the documentation search engine.                       | No       |

Frontmatter example:

```
---
title: Introduction
permalink: /next/api/
canonicalUrl: /api/
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

Files to be included in the documentation's next version are kept in the `next` directory.

The `next` version of the documentation is available only locally and on the staging server.

To display the `next` version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/next/.

### Editing the `latest` documentation version

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number gets tagged as the `latest` version of the documentation.

If you're editing the `latest` version, remember to make the same edits to the `next` version as well.

To display the latest documentation version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs.

### Editing an archived documentation version

To edit an archived documentation version, go to the required [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure).

To display an archived documentation version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/{semver.version}/.

## Editing the API reference

The API reference is generated automatically from the source code, into the `/next/api/` directory.

To edit the API reference, go into the source code and change the JSDoc comments.

To generate the API reference output, run the following command from the `/docs/` directory:

```bash
npm run docs:api
```

### JSDoc links

As we want to support case-insensitive URLs, follow these guidelines when editing the JSDoc links:

* Use lower case characters.
* To separate words before `#`, use `-`.

```js
// Wrong:
/** {@link Options#autoColumnSize}. */

// OK: 
/** {@link options#autocolumnsize Options#autoColumnSize}. */


// Wrong:
/** {@link HiddenRows} */

// OK:
/** {@link hidden-rows HiddenRows} */
```

## Documentation versioning

To create a new version of the Handsontable documentation:

* From the `handsontable/docs` directory, run:
```bash
npm run docs:version <semver.version>
# for example:
# npm run docs:version 9.0
```

To remove an existing version of the Handsontable documentation:

* Remove the required version's [directory](./README.md#handsontable-docs-directory-structure):
```bash
rm -rf ./<semver.version>
```

## Markdown containers

To render content in different ways, the documentation uses custom Markdown containers, for example:

```markdown
::: example #exampleId .class :preset --html 1 --js 2

// code example

:::
```

We use the following Markdown containers:

| Container                    | Usage                                                      |
|------------------------------|------------------------------------------------------------|
| `::: tip`                    | A note.                                                    |
| `::: example [options]`      | Renders a code example as specified in [options].          |
| `::: source-code-link [URL]` | Adds a source code link to the right of an API ref header. |

### Adding code examples
Using the `example` Markdown container, you can add code snippets that show the code's result:

```js
::: example #exampleId .class :preset --html 1 --js 2 --css 3  --no-edit --tab preview
// `#example1` is the example's ID, for creating a Handsontable container
    ```html
    <div id="example1"></div>
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

| Option         | Required | Example         | Possible values                                            | Usage                                                                                              |
|----------------|----------|-----------------|------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `#exampleId`   | Yes      | `#data-grid-1`  | String                                                     | Container's unique ID.                                                                             |
| `.class`       | No       | `.new-class`    | String                                                     | Container's custom class.                                                                          |
| `:preset`      | No       | `:react`        | [`preset`](.vuepress/handsontable-manager/dependencies.js) | Sets code dependencies.                                                                            |
| `--js <pos>`   | No       | `--js 1`        | Positive integer (default `1`)                             | Sets the JS code snippet's position in the markdown container.                                     |
| `--html <pos>` | No       | `--html 2`      | Positive integer (default `0`)                             | Sets the HTML code snippet's position in the markdown container.<br><br>`0` disables the HTML tab. |
| `--css <pos>`  | No       | `--css 2`       | Positive integer (default `0`)                             | Sets the CSS code snippet's position in the markdown container.<br><br>`0` disables the CSS tab.   |
| `--no-edit`    | No       | `--no-edit`     | `--no-edit`                                                | Removes the **Edit** button.                                                                       |
| `--tab`        | No       | `--tab preview` | [`codeOption`](.vuepress/highlight.js) \| `preview`        | Sets a tab as open by default.                                                                     |
