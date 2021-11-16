---
title: Hello world
metaTitle: Hello world - Guide - Handsontable Documentation
permalink: /11.0/hello-world
canonicalUrl: /hello-world
tags:
  - demo
---

# Hello world

Before you dive deep into Handsontable, check out our demo app.

Rather than display "Hello, World!", the demo contains 100 rows and 13 columns packed with features:

- [Column groups &#8594;](@/guides/columns/column-groups.md)
- [Column menu &#8594;](@/guides/columns/column-menu.md)
- [Column filter &#8594;](@/guides/columns/column-filter.md)
- [Row sorting &#8594;](@/guides/rows/row-sorting.md)
- And way more than that!

Want to play with the code yourself? Select the button in the frame's bottom right corner.

<HelloWorld :demos="[
  {
    name: 'JavaScript',
    title: 'Handsontable JavaScript Data Grid - Hello World App',
    codeSandboxId: 'github/handsontable/handsontable/tree/develop/examples/11.0.0/docs/js/hello-world',
    selectedFile: '/src/index.js',
  },
  {
    name: 'TypeScript',
    title: 'Handsontable TypeScript Data Grid - Hello World App',
    codeSandboxId: 'github/handsontable/handsontable/tree/develop/examples/11.0.0/docs/ts/hello-world',
    selectedFile: '/src/index.ts',
  },
  {
    name: 'React',
    title: 'Handsontable React Data Grid - Hello World App',
    codeSandboxId: 'github/handsontable/handsontable/tree/develop/examples/11.0.0/docs/react/hello-world',
    selectedFile: '/src/index.tsx',
  },
  {
    name: 'Angular',
    title: 'Handsontable Angular Data Grid - Hello World App',
    codeSandboxId: 'github/handsontable/handsontable/tree/develop/examples/11.0.0/docs/angular/hello-world',
    selectedFile: '/src/data-grid/data-grid.component.ts',
  },
  {
    name: 'Vue 2',
    title: 'Handsontable Vue Data Grid - Hello World App',
    codeSandboxId: 'github/handsontable/handsontable/tree/develop/examples/11.0.0/docs/vue/hello-world',
    selectedFile: '/src/components/DataGrid.vue',
  },
]"></HelloWorld>
