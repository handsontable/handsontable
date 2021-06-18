# Docs editing guidelines

This page covers guidelines for editing the [Handsontable docs](https://handsontable.com/docs).

## Maintenance rules

Before adding new docs files, check the docs [directory structure](./README.md#handsontable-docs-directory-structure), and read the guidelines below.

### Filenames

* Use only lower-case characters.
* To separate words, use `-`.
* Use the `.md` extension. The `.vue` extension is disabled.

### Subdirectories

* If possible, avoid adding new subdirectories.
* When adding a new subdirectory, you have to update the sidebars logic.

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

#### Sitemap headers

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
 
### Editing the `next` docs version

Files to be included in the docs' next version live in the `next` directory.

The `next` version of the docs is available only locally and on the staging server.

To display the `next` version in a browser:
1. Start a [local Handsontable docs server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/next/.

### Editing the `latest` docs version

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number is the `latest` version of the docs.

To display the latest docs version in a browser:
1. Start a [local Handsontable docs server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs.

### Editing an archived docs version

To edit an archived docs version, go to the required [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure).

To display the latest docs version in a browser:
1. Start a [local Handsontable docs server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/{semver.version}/.

## Editing the API reference

The API reference is generated automatically from the source code.

The API reference output lives in the `/next/api/` directory. **Don't edit it (we know where you live).**

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

## Adding code examples
Inside the Markdown files, you can add code snippets that will show the code's result:

```js
    ::: example #example1
    // `#example1` is the example's ID, for creating a Handsontable container

    ```js
        // code here
    ```

    :::
```