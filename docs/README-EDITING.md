# Docs editing guidelines

## Best practices for content

Applied to `/next` and `/*.*/`.

### Mutating API Reference content

API Reference for the next version is generated automatically, so any changes in `/next/api` will be overwritten. Please avoid changing it.

### JS Doc links

Since we want to support case-insensitive URLs, all links in JsDoc should:

* Before `#`: use `-` to separate words, lower case.
* After `#`: lower case.

**For instance:**

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

### Filenames

Using small chars only with `-` as a word separator is recommended.

### Headers

Each markdown file with a content starts by Frontmatter:

```markdown
---
title: Introduction
permalink: /next/api/
canonicalUrl: /api/
---

# Introduction
```

* **title**: A header on a page.
* **permalink**: Url to this page, **should be unique**.
* **canonicalUrl**: Canonical url to the latest version of this page.

#### Sitemap headers

The `vuepress-plugin-sitemap` give us additional headers to customise it behaviour:

```
---
sitemap:
  exclude: false
  changefreq: hourly
---
```

### Subdirectories

I recommend to keep files flat without subdirectories. 
If subdirectory being to add, it is required to update sidebars creating logic.

### Prefer .md, avoiding .vue

The `*.vue` allows us to use vue pages and components. It is undesirable because it introduces additional complexity. 
For that purposes `.vue` suffix is disabled.

Keeping all content as just `.md` file makes them more manageable.

## Editing documentation content

### Live demo:
It is able to run code snippets to show result of the code:

```
    ::: example #example1

    ```js
        // code here
    ```

    :::
```

`#example1` is id for creating handsontable container.
 
### Editing the `Next` version

*The next version is only available on the `localhost` and on the staging server.*

Files included in next versions live in dir `/next/`.
To display it in a browser, please go into URL: `/docs/next`.

### Editing the `latest` version

The latest version is the largest semver valid directory inside the root directory. 
It is in `/[number]/`.

To display the latest docs version in a browser, please go into: `/docs/`.

### Editing an archival version

Directory: `/[number]/`.

In a browser please go into: `/docs/[number]`.

## Editing API Reference

To edit API Reference goes into source code and change jsdocs comments. Then, to generate API Reference pages:

```shell script
npm run docs:api
```

## Versioning

**Release a version**

```shell script
npm run docs:version <semver_number>
# for instance 
# npm run docs:version 9.0
```

**Remove a version**

It is enough to remove version directory.

```shell script
rm -rf ./[NUMBER]
```
