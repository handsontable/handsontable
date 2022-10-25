---
title: Introduction
metaTitle: JavaScript Data Grid - Documentation | Handsontable
description: An overview of Handsontable's developer documentation. Handsontable is a client-side, spreadsheet-like data grid for editing data in web applications.
permalink: /
canonicalUrl: /
react:
  metaTitle: React Data Grid - Documentation | Handsontable
searchCategory: Guides
---

# Handsontable documentation

[[toc]]

::: only-for javascript
::: tip
<svg xmlns="http://www.w3.org/2000/svg" class="tip-icon" width="55" height="49.042" viewBox="0 0 55 49.042"><defs><style>.a{fill:#61dafb;stroke:rgba(0,0,0,0);stroke-miterlimit:10;}</style></defs><g transform="translate(0.5 0.5)"><path class="a" d="M28.559,43.5c-.525-.459-1.006-.9-1.458-1.334-.416.4-.785.741-1.126,1.039-3.508,3.064-7.125,4.821-9.925,4.821a5.1,5.1,0,0,1-2.578-.634C10.709,45.792,9.754,41.2,10.91,35.1c.131-.671.275-1.321.427-1.928-.494-.141-.983-.3-1.463-.459C3.785,30.634,0,27.285,0,23.976c0-3.188,3.5-6.313,9.368-8.355.617-.218,1.274-.422,2-.63-.138-.553-.272-1.137-.4-1.787-1.218-6.24-.3-10.92,2.463-12.519a4.993,4.993,0,0,1,2.538-.63c2.82,0,6.522,1.854,10.163,5.086.292.258.594.533.891.825.456-.439.912-.855,1.348-1.234C31.875,1.68,35.284,0,37.976,0a4.87,4.87,0,0,1,2.469.614c2.873,1.653,3.821,6.722,2.484,13.227-.061.292-.157.734-.269,1.183.577.164,1.164.352,1.738.55,6.014,2.065,9.6,5.207,9.6,8.4,0,3.316-3.916,6.672-10.219,8.757-.318.107-.644.211-1,.315.114.459.225.945.322,1.442,1.255,6.313.251,11.265-2.614,12.925a4.963,4.963,0,0,1-2.521.627C35.311,48.042,31.972,46.426,28.559,43.5Zm4.675-8.737a53.994,53.994,0,0,1-4.53,5.75c.443.422.9.838,1.359,1.237,2.91,2.5,5.856,3.993,7.889,3.993a2.748,2.748,0,0,0,1.381-.322c.824-.479,1.45-1.67,1.77-3.353a19.515,19.515,0,0,0-.266-7.125c-.076-.409-.177-.848-.291-1.308A53.473,53.473,0,0,1,33.233,34.758Zm-20.057.771c-.921,4.865-.341,8.828,1.446,9.86a2.839,2.839,0,0,0,1.428.325,7.243,7.243,0,0,0,2.36-.466,19.44,19.44,0,0,0,6.042-3.785c.378-.332.718-.644,1.033-.949a56.335,56.335,0,0,1-4.638-5.723,55.259,55.259,0,0,1-7.278-1.056C13.425,34.326,13.295,34.929,13.176,35.529ZM27.09,38.855a48.187,48.187,0,0,0,3.168-3.9c-1.066.05-2.165.074-3.258.074-1.066,0-2.129-.02-3.162-.06C24.907,36.374,26,37.682,27.09,38.855ZM17.17,24.033c.708,1.465,1.479,2.93,2.3,4.349.844,1.455,1.733,2.863,2.641,4.188,1.6.1,3.242.154,4.889.154s3.323-.06,4.941-.174c.9-1.348,1.774-2.756,2.592-4.181s1.6-2.89,2.32-4.369c-.71-1.438-1.494-2.9-2.326-4.332s-1.7-2.823-2.6-4.154c-1.607-.124-3.266-.188-4.925-.188-1.636,0-3.29.06-4.912.184-.912,1.331-1.8,2.736-2.626,4.171v0C18.631,21.126,17.86,22.591,17.17,24.033Zm-2.977,7.48c1.542.332,3.219.6,4.979.8-.6-.935-1.175-1.871-1.7-2.773-.514-.885-1.029-1.824-1.532-2.793C15.266,28.358,14.676,29.96,14.193,31.513Zm22.346-1.992c-.533.919-1.09,1.841-1.663,2.749a50.035,50.035,0,0,0,5.036-.858A48.61,48.61,0,0,0,38.1,26.661C37.622,27.583,37.1,28.546,36.539,29.521ZM10.13,17.8c-4.677,1.633-7.819,4.114-7.819,6.179,0,.955.713,2.1,2.014,3.209a19.513,19.513,0,0,0,6.3,3.346c.47.161.905.3,1.331.419a57.307,57.307,0,0,1,2.666-6.917,55.5,55.5,0,0,1-2.631-6.82C11.373,17.387,10.763,17.579,10.13,17.8Zm29.285,6.193a53.961,53.961,0,0,1,2.733,6.84c.309-.09.606-.188.912-.285,5.08-1.683,8.629-4.385,8.629-6.568,0-2.065-3.231-4.567-8.039-6.223-.489-.168-1.017-.335-1.609-.506A54.221,54.221,0,0,1,39.415,23.989Zm-2.889-5.478c.533.922,1.055,1.867,1.551,2.81A47.641,47.641,0,0,0,39.8,16.67c-1.564-.355-3.221-.647-4.922-.862C35.462,16.72,36.016,17.629,36.526,18.511Zm-22.3-1.864c.469,1.516,1.045,3.088,1.714,4.67.471-.925.974-1.837,1.526-2.789.519-.905,1.075-1.821,1.652-2.722C17.4,16.02,15.755,16.3,14.229,16.647ZM29.883,6.471c-.429.375-.849.758-1.244,1.136a53.555,53.555,0,0,1,4.567,5.7,54.991,54.991,0,0,1,7.219,1.14c.093-.376.174-.751.244-1.073,1.083-5.247.516-9.673-1.375-10.766A2.615,2.615,0,0,0,37.967,2.3C35.905,2.3,32.885,3.859,29.883,6.471ZM14.589,2.679C12.8,3.715,12.255,7.765,13.23,12.757c.111.557.234,1.1.373,1.666a56.217,56.217,0,0,1,7.205-1.12,55.333,55.333,0,0,1,4.6-5.693c-.3-.292-.552-.523-.807-.748-3.179-2.823-6.4-4.51-8.617-4.51A2.728,2.728,0,0,0,14.589,2.679ZM30.206,13.1A48.658,48.658,0,0,0,27.023,9.26c-1.055,1.14-2.135,2.431-3.2,3.832,1.063-.05,2.12-.074,3.139-.074C28.033,13.019,29.122,13.046,30.206,13.1Zm-8.027,10.88A4.821,4.821,0,1,1,27,28.8,4.823,4.823,0,0,1,22.179,23.976Z" transform="translate(0 0)"/></g></svg>
Are you using React? [Explore the React version](@/react/guides/getting-started/introduction.md) of this documentation.
:::
:::

## What is Handsontable?

Handsontable (pronounced "hands-on-table") is a JavaScript data grid component that brings the well-known look and feel of spreadsheets to your application.

Thousands of business apps depend on Handsontable for entering, editing, validating, and cleansing data that comes from remote sources such as databases and APIs, or from HTML documents, Excel files, Google Sheets, and manual input.

<!-- Depending on the theme, one of these two images is displayed -->
<div class="handsontable-drawing">

  ![A drawing of Handsontable data grid on the light background]({{$basePath}}/img/pages/introduction/introduction-drawing-light-min.png)
  
  ![A drawing of Handsontable data grid on the dark background]({{$basePath}}/img/pages/introduction/introduction-drawing-dark-min.png)
    
</div>

## Get started with Handsontable
::: only-for javascript
To jump straight into the sample code, open the demo app at CodeSandbox: 

- [JavaScript demo](https://codesandbox.io/s/handsontable-javascript-data-grid-hello-world-app-forked-zee1jw)
- [React demo](https://codesandbox.io/s/handsontable-react-data-grid-hello-world-app-forked-16c9gw)
- [Angular demo](https://codesandbox.io/s/handsontable-angular-data-grid-hello-world-app-forked-fz9zrz)
- [Vue 2 demo](https://codesandbox.io/s/handsontable-vue-data-grid-hello-world-app-forked-6z4395)
- [TypeScript demo](https://codesandbox.io/s/handsontable-typescript-data-grid-hello-world-app-forked-xd6xek)
:::

::: only-for react
To jump straight into the sample code, [open the demo app at CodeSandbox](https://codesandbox.io/s/handsontable-react-data-grid-hello-world-app-forked-16c9gw). 
:::

Then, move on to [connecting](@/guides/getting-started/binding-to-data.md) your data and [configuring](@/guides/getting-started/configuration-options.md) Handsontable's built-in features. For more advanced implementations, use Handsontable's [API](@/api/introduction.md).

### Quickstart

- [Install Handsontable](@/guides/getting-started/installation.md)
- [Load data](@/guides/getting-started/binding-to-data.md)
- [Save data](@/guides/getting-started/saving-data.md)
- [Configure options](@/guides/getting-started/configuration-options.md)
- [Define the size](@/guides/getting-started/grid-size.md)

### Use popular features

- [Cell types](@/guides/cell-types/cell-type.md)
- [Formula calculations](@/guides/formulas/formula-calculation.md)
- [Column filter](@/guides/columns/column-filter.md)
- [Column groups](@/guides/columns/column-groups.md)
- [Column summary](@/guides/columns/column-summary.md)
- [Row parent-child](@/guides/rows/row-parent-child.md)
- [Context menu](@/guides/accessories-and-menus/context-menu.md)

### Customize the grid

- [Create a custom renderer](@/guides/cell-functions/cell-renderer.md)
- [Create a custom editor](@/guides/cell-functions/cell-editor.md)
- [Create a custom validator](@/guides/cell-functions/cell-validator.md)
- [Create a custom plugin](@/guides/tools-and-building/custom-plugins.md)
- [Translate the UI](@/guides/internationalization/language.md)

::: only-for javascript
## Supported frameworks

Handsontable supports popular JavaScript frameworks through wrappers. It also features a TypeScript declaration file that standardizes the API [methods](@/api/core.md), [hooks](@/api/hooks.md), and [options](@/api/options.md).

Explore Handsontable's documentation for [React](@/react/guides/getting-started/introduction.md), [Angular](@/guides/integrate-with-angular/angular-installation.md), [Vue 2](@/guides/integrate-with-vue/vue-installation.md), and [Vue 3](@/guides/integrate-with-vue3/vue3-installation.md).
:::

## What can I use Handsontable for?

Think of Handsontable as an extensible framework that lets you quickly build tabular, data-oriented user interfaces. Handsontable helps developers solve real-life problems. A few examples:

- In an internal financial application, an editable, Handsontable-based grid simplifies the process of importing hand-picked data from Excel and Google Sheets.
- In a construction company's software, an interactive data table built with Handsontable helps users modify codes and standards tables.
- At a hospital, Handsontable helps with tracking and managing supplies.
- A mobile game company uses Handsontable to streamline certain aspects of the development.
- In project management software, Handsontable allows managers to collect weekly feedback from the team and customers.

### Types of software

Handsontable's built-in features and customizability keep it present across different industries and types of software, for example:

- Data modeling applications
- Resource planning software
- ERP software
- Construction digital platforms
- Commission automation tools
- Knowledge management systems
- Reporting platforms for citizens
- Data management systems

## Technical support

Implementing Handsontable requires a certain level of front-end development skills. In case you need help, and can't find a solution in the documentation, reach out to us. If you have a commercial Handsontable license, and your support plan is active, contact our [Technical Support Team](https://handsontable.com/contact?category=technical_support).

## Feedback

Contribute to the development of Handsontable:

- [Report a GitHub issue](https://github.com/handsontable/handsontable/issues/new/choose)
- [Ask a question on Stack Overflow](https://stackoverflow.com/questions/tagged/handsontable)
- [Make a GitHub pull request](https://github.com/handsontable/handsontable/pulls)
- [Report a documentation issue](https://github.com/handsontable/handsontable/issues/new?assignees=&labels=Docs%3A+Content&template=02-documentation.md&title=Docs%3A+)

## Stay in the loop

- [Changelog](@/guides/upgrade-and-migration/release-notes.md)
- [Roadmap](https://github.com/handsontable/handsontable/milestones)
- [Blog](https://handsontable.com/blog)
- [Twitter](https://twitter.com/handsontable)
