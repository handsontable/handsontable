# Documentation editing guidelines

This page covers guidelines for editing the [Handsontable documentation](https://handsontable.com/docs).

## Maintenance rules

When adding new documentation files, check the documentation [directory structure](./README.md#handsontable-docs-directory-structure), and follow the guidelines below.

### Filenames

* Use only lower-case characters.
* To separate words, use `-`.
* Use the `.md` file extension. The `.vue` extension is disabled.

### Frontmatter

Each Markdown file can start with the following frontmatter tags:

| Tag            | Meaning                                                    | Default value           |
|----------------|------------------------------------------------------------|-------------------------|
| `title`        | The page's header. | If not set, gets generated from the page's parent's title.      |
| `permalink`    | The page's **unique** URL. | If not set, gets generated from the Markdown file name. |
| `canonicalUrl` | A canonical URL of the page's latest version.              | None (not required)     |
| `metaTitle`    | The page's SEO meta title.                                 | None (not required)     |
| `tags`         | Tags used by the documentation search engine.              | None (not required)     |

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

### Editing the `next` documentation version

Draft files to be included in the documentation's next version are kept in the `next` directory.

The `next` version of the documentation is available only locally and on the staging server.

To display the `next` version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/next/.

### Editing a published documentation version

To edit an already-published documentation version, go to the required [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) (e.g. `9.0`).

To display a published documentation version in a browser:
1. Start a [local Handsontable documentation server](./README.md#getting-started-with-handsontable-docs).
2. In your browser, go to http://localhost:8080/docs/{semver.version}/.

If you're editing the `latest` version (a version with the largest `<semver.version>` number), remember to make the same edits to the `next` version as well.

## Editing the API reference

The `next` version's API reference is generated automatically from the source code, into the `/next/api/` directory.

To edit the `next` version's API reference:
1. Go into the source code and change the required JSDoc comments.
2. Generate the `next` version's API reference output:
    ```bash
    npm run docs:api
    ```
    
To edit a published version's API reference:
1. Go to the required version's API reference output: `/docs/<semver.version>/api` (e.g. `/docs/9.0/api`).
2. Edit the required Markdown files.

## Documentation versioning

To create a new version of the Handsontable documentation:

1. From the `handsontable/docs` directory, run:
    ```bash
    npm run docs:version
    ```
2. Confirm that you want to generate a new documentation version.
3. Enter the version number that you want to create.

To remove an existing version of the Handsontable documentation:

* Remove the required version's [directory](./README.md#handsontable-docs-directory-structure):
  ```bash
  rm -rf ./<semver.version>
  ```

## Markdown links

When linking to other documentation pages, avoid using absolute links or relative URLs.

To link to another page in the same documentation version, use the following syntax:

```markdown
[link_text](@/relative_file_path_from_this_version's_root/file_name.md#some-anchor)
\```

For example, to link to a file called `core.md`, from anywhere in the same documentation version:

```markdown
[Core](@/api/core.md)
\```

Follow these rules:
* After the `@` character, provide the target's relative file path (from the current version's root directory).<br>
  For example: `[Clipboard][@/guides/cell-features/clipboard.md]`.
* After the target file's name, add the `.md` [extension](#filenames)<br>
  For example: `[Autofill](@/api/autofill.md)`.
* To link to a specific section, use anchors.<br>
  For example: `[Core](@/api/core.md#some-anchor)`.

Also, the following rules apply:
* The target file needs to have the `permalink` [frontmatter](#frontmatter) tag defined.
* If generating a final URL link fails, the initial value gets output as a relative link.<br>
  The documentation's [link checker](./README.md#documentation-npm-scripts) catches such failed links.

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
| `::: source-code-link <URL>` | Adds a source code link to the API ref header. |

### Adding code examples

Using the `example` Markdown container, you can add code snippets that show the code's result:

```md
::: example #exampleId .class :react-redux --html 1 --js 2 --css 3  --no-edit --tab preview
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

| Option         | Required | Example         | Possible values                                            | Usage                                                                                                                     |
|----------------|----------|-----------------|------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `#exampleId`   | No       | `#example1`     | String                                                     | Container's unique ID.                                                                                                    |
| `.class`       | No       | `.new-class`    | String                                                     | Container's custom class.                                                                                                 |
| `:preset`      | No       | `:hot`          | `:hot` \| `:hot-lang` \| `:react` \| `:react-languages` \| `:react-numbro` \| `:react-redux` \| `:angular` \| `:angular-languages` \| `:angular-numbro` \| `:vue` \| `:vue-numbro` \| `:vue-languages` \| `:vue-vuex`  | Sets code dependencies. |
| `--js <pos>`   | No       | `--js 1`        | Positive integer<br>(default `1`)                          | Sets the JS code snippet's position<br>in the markdown container.                                                         |
| `--html <pos>` | No       | `--html 2`      | Positive integer<br>(default `0`)                          | Sets the HTML code snippet's position<br>in the markdown container.<br><br>`0` disables the HTML tab.                     |
| `--css <pos>`  | No       | `--css 2`       | Positive integer<br>(default `0`)                          | Sets the CSS code snippet's position<br>in the markdown container.<br><br>`0` disables the CSS tab.                       |
| `--no-edit`    | No       | `--no-edit`     | `--no-edit`                                                | Removes the **Edit** button.                                                                                              |
| `--tab <tab>`  | No       | `--tab preview` | `code` \| `html` \| `css` \| `preview` | Sets a tab as open by default.  |
