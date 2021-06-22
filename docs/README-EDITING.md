# Docs editing guidelines

This page covers guidelines for editing the [Handsontable docs](https://handsontable.com/docs).

## Maintenance rules

When adding new docs files, check the docs [directory structure](./README.md#handsontable-docs-directory-structure), and follow the guidelines below.

### Filenames

* Use only lower-case characters.
* To separate words, use `-`.
* Use the `.md` file extension. The `.vue` extension is disabled.

### Front matter

Each Markdown file starts with the following front matter tags:

| Tag            | Meaning                                                    | Required |
|----------------|------------------------------------------------------------|----------|
| `title`        | The page's header.                                         | Yes      |
| `permalink`    | The page's **unique** URL.                                 | Yes      |
| `canonicalUrl` | A canonical URL of the page's latest version.              | Yes      |
| `metaTitle`    | The page's SEO meta title.                                 | No       |
| `tags`         | Tags used by the docs search engine.                       | No       |

Front matter example:

```
---
title: Introduction
permalink: /next/api/
canonicalUrl: /api/
---
```

### Sitemap front matter

The [`vuepress-plugin-sitemap`](https://www.npmjs.com/package/vuepress-plugin-sitemap) lets us use additional tags to customize the docs site map:

```
---
sitemap:
  exclude: false
  changefreq: hourly
---
```

## Editing the docs

When editing the docs content, follow the guidelines below.

Files to be included in the docs' next version live in the `next` directory.

The `next` version of the docs is available only locally and on the staging server.

To display the `next` version in a browser:
1. Start a [local Handsontable docs server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/next/.

### Editing the `latest` docs version

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number gets tagged as the `latest` version of the docs.

If you're editing the `latest` version, remember to make the same edits to the `next` version as well.

To display the latest docs version in a browser:
1. Start a [local Handsontable docs server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs.

### Editing an archived docs version

To edit an archived docs version, go to the required [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure).

To display an archived docs version in a browser:
1. Start a [local Handsontable docs server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/{semver.version}/.

## Editing the API reference

The API reference is generated automatically from the source code.

The API reference output lives in the `/next/api/` directory.

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

## Docs versioning

To create a new version of the Handsontable docs:

* From the `handsontable/docs` directory, run:
```bash
npm run docs:version <semver.version>
# for example:
# npm run docs:version 9.0
```

To remove an existing version of the Handsontable docs:

* Remove the required version's [directory](./README.md#handsontable-docs-directory-structure):
```bash
rm -rf ./<semver.version>
```

## Markdown containers

To render content in different ways, the docs use custom Markdown containers, for example:

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
Using the `example` Markdown container, you can add code snippets that will show the code's result:

```js
::: example #exampleId .class :preset --html 1 --js 2 --css 3  --no-edit --tab preview
// `#example1` is the example's ID, for creating a Handsontable container

    ```js
    // code here
    ```
:::
```

The `example` Markdown container offers the following options:

| Option           | Required | Example           | Possible values                                            | Usage                          |
|------------------|----------|-------------------|------------------------------------------------------------|--------------------------------|
| `#exampleId`     | Yes      | `#data-grid-1`    | String                                                     | Container's unique ID.         |
| `.class`         | No       | `.new-class`      | String                                                     | Container's custom class.      |
| `:preset`        | No       | `:react`          | [`preset`](.vuepress/handsontable-manager/dependencies.js) | Sets code dependencies.        |
| `--codeOption 1` | Yes      | `--html 1 --js 2` | [`codeOption`](.vuepress/highlight.js) + Number            | Sets code snippets' positions. |
| `--no-edit`      | No       | `--no-edit`       | `--no-edit`                                                | Removes the **Edit** button.   |
| `--tab`          | No       | `--tab preview`   | [`codeOption`](.vuepress/highlight.js) \| `preview`        | Sets a tab as open by default. |