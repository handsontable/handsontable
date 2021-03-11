# Handsontable Documentation

## Getting started

```shell script
# Install dependencies (npm version > 7.5)
npm install

# Run localhost
npm run docs:start 

# The website is running at http://localhost:8080/docs/
```

## Directory structure

```
- /next                 # The next version of documentation, unavailable on production build.
    + /api              # Automatically generated files from JsDoc. Do not edit!
    *.md                # The content of documentation
+ /src                  # Place where the our customizations exists
+ /static               # A directory with static files
- /versioned_docs       # Content (with API Ref) of released versions
    + /version-*        # Previous versions
    + /version-[TheLatestVersionNumber] # The latest documentation content
- /versioned_sidebars                   # Archived sidebars for released versions
    - version-[TheLatestVersionNumber]-sidebars.json    # Sidebars for the latest documentation
    - version-*-sidebars.json   # Sidebars for previous documentations
- docusaurus.config.js          # Configuration file
- _sidebars.js                   # Sidebars configuration for the Next version
- versions.json                 # List of released versions
...

```

## Best practices for content

Applied to `/next` and `/versioned_docs/`.

### Mutating API Reference content

API Reference is generated automatically, so any changes in `/next/api` will be overwritten. Please avoid changing it.

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

*We have build-in `404` detector, so during the build, it will be caught.*

### Filenames

File names have meaning only for copywriters to makes manage files easier. So any convention isn't defined yet.

### Headers

Each markdown file with a content starts by Admonitions:

```markdown
---
id: api-introduction
title: Introduction
sidebar_label: Introduction
permalink: /next/api/
---
```

* **id**: To avoid many problems please **keep it immutable**.
* **title**: A header on a page.
* **sidebar_label**: Displayed label in a menu.
* **slug**: part of URL append to the current version, **should be unique** in the scope of version.
* Many others described in https://v2.docusaurus.io/docs/markdown-features/#markdown-headers

### Subdirectories

Any rule for subdirectories isn't defined.
Please keep in mind, that the subdirectory is also a prefix for page id.

**For instance:**

```markdown
---
id: example
---
```

Saved as `/next/some-folder/example-file.md` has id: `some-folder/example`.

### Prefer .md, avoid .mdx

The `*.mdx` allows us to use react components. It is undesirable because it introduces additional complexity.
Keeping all content as just `.md` file makes them more manageable.

*If any extra behaviour needed, should be done as a remark or rehype plugin.*

## Editing documentation content

### ESLint for markdown

ESLint is a tool which helps us keep our content in agreed with best rules.

```shell script
npm run docs:lint:docs # feedback with error list

npm run docs:lint:docs:fix # attempt to fix errors
```

ESLint runs in GH Action on each commit pushed into the repo.

### Live demo:

It is able to run code snippets to show result of the code:

```
    ```js hot-preview=container_id,instance_var
```

* **container_id** id target into div for putting handsontable. The `div#container_id` is created automatically
* **instance_var** (optional) target into variable name with HOT instance to destroy on component unmount (Docusaurus is a SPA, it is needed to  destroy it on changed page event).

Example: https://github.com/handsontable/docs-md/blob/12b309b/versioned_docs/version-9.0/temp/introduction.mdx

### Editing the `Next` version

*The next version is only available on the `localhost` and `dev.handsontable.com/docs/next`*

Files included in next versions live in dir `/next/`.
To display it in a browser, please go into URL: `/docs/next`.

### Editing the `latest` version

The latest version is the first item from `/vesions.json`. It is in `/versioned_docs/version-[number]/`.

To display the latest docs version in a browser, please go into: `/docs/`.

### Editing an archival version

Directory: `/versioned_docs/version-[number]/`.

In a browser please go into: `/docs/[number]`.

## Editing API Reference

To edit API Reference goes into source code and change jsdocs comments. Then, to generate API Reference pages:

```shell script
npm run docs:jsdoc
```

## Versioning

**Release a version**

```shell script
npm run docs:version number
```

**Remove a version**

1. First, open `versions.json`  in a text editor, then remove desirable version number and save.
2. Secondly, if want you remove all version content, remove versioned docs and sidebars:

```shell script
rm -rf versioned_docs/version-NUMBER
rm versioned_sidebars/version-NUMBER-sidebars.json
```

**Edit a version**

Described in section: [Editing documentation content](#editing-documentation-content)

**For more information** goes into https://v2.docusaurus.io/docs/versioning/

## Deployment

[See DEPLOYMENT.md](./DEPLOYMENT.md)
