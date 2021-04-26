# Handsontable Documentation

For each project, the documentation is a significant place where the customers derive knowledge about how to use that tool. 
That explains why it is worth to care about the experience of using the documentation.

This is nicer looking documentation with a great search engine. 
It uses Markdown, which makes easy documentation maintenance for non-technical personnel.
Here we have a versioning tooling and automated deployment. 
Thanks to all of that, creating and testing documentation becomes less time-consuming, and for our clients, it removes difficulties in using and searching the documentation.

**Additional guidelines:**

* [Editing guideline: see README-EDITING.md](./README-EDITING.md) 
* [Deployment guideline: see README-DEPLOYMENT.md](./README-DEPLOYMENT.md)

## Getting started

```shell script
# Install dependencies (npm version > 7.5)
npm install

# Run localhost
npm run docs:start 

# The website is running at http://localhost:8080/docs/
```

## npm scripts:

* `npm run docs:start` - Start dev local server
* `npm run docs:start:no-cache` - Start dev local server without cache
* `npm run docs:build` - Build app into `./vuepress/dist`
* `npm run docs:docker:build:staging` - Run docker build for staging environment.
* `npm run docs:docker:build:production` - Run docker build for production environment.
* `npm run docs:version <semver.version>` - Rollup a next version into `/<semver.version>/`.
* `npm run docs:api` - Generates API References into `/next/api`.

## Directory structure

```
- /next                         # The next version of documentation, unavailable on production build.
    + /api                      # Automatically generated files from JsDoc. Do not edit!
    *.md                        # The content of documentation
+ /SEMVER.NUMBER                # Version of documentation, for instance 8.4, 8.5
- /.vuepress                    # Vuepress files and configuration
    - /containers               # Markdown containers `:::`
        + /examples             # Container for running code snippets `::: example #exampleId .class :preset --html 1 --js 2`
        sourceCodeLink.js       # Add link "Source Code" on the right, `::: source-code-link [URL]`
    + /handsontable-manager     # This module provides api to run any example in any handsontable version with selected preset.
    + /public                   # Public assets
    + /theme                    # Theme overwrites and customizations
    - /tools            
        + /jsdoc-convert        # Tool used for converting jsdoc to markdown
        + /version              # Tool used for rollup a new version
        check-links.js          # Tool which check all links in the documentation
        utils.js                # Utilities for tools
    config.js                   # Configuration file
    helpers.js                  # Common helpers to get sidebars and list of versions
    highlight.js                # Code highlight configuration
```

