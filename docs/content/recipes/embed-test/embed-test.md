---
title: Embed test
metaTitle: Embed test - JavaScript Data Grid | Handsontable
description: Test page for the self-hosted demo embed. Placeholder content - not for production.
permalink: /recipes/embed-test
canonicalUrl: /recipes/embed-test
tags:
  - recipes
  - embed
  - test
react:
  metaTitle: Embed test - React Data Grid | Handsontable
angular:
  metaTitle: Embed test - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Themes
type: how-to
---

This is a placeholder page used to test embedding a demo from the self-hosted
demo host (`demos.handsontable.com`), which replaces the previous CodeSandbox and
StackBlitz embeds. It is not intended to be merged into production.

<iframe src="https://demos.handsontable.com/embed/2pw5i2e2i6"
  style="width:100%; height: 500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Handsontable self-hosted demo embed test"
  allow="clipboard-read; clipboard-write"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

## What this tests

- The self-hosted embed renders inside the documentation layout.
- The Cloudflare Pages content security policy allows framing
  `demos.handsontable.com`.
- The iframe sizing and styling match the existing embed recipes.
