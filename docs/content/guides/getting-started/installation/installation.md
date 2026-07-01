---
type: how-to
title: Installation
metaTitle: Installation - JavaScript Data Grid | Handsontable
description: Install Handsontable through your preferred package manager, or import Handsontable's assets directly from a CDN.
permalink: /installation
canonicalUrl: /installation
tags:
  - quick start
react:
  metaTitle: Installation - React Data Grid | Handsontable
angular:
  metaTitle: Installation - Angular Data Grid | Handsontable
vue:
  metaTitle: Installation - Vue Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---
::: only-for angular

Install Handsontable through your preferred package manager, and control your grid through the `HotTableComponent` props.

:::

::: only-for javascript

Install Handsontable through your preferred package manager, or import Handsontable's assets directly from a CDN.

:::

::: only-for react

Install Handsontable through your preferred package manager, and control your grid through the `HotTable` component's props.

:::

::: only-for vue

Install Handsontable through your preferred package manager, and control your grid through the `HotTable` component's props.

:::

[[toc]]

<div class="instalationPage">

::: only-for angular

## Prerequisites

- [Node.js](https://nodejs.org/) version 18 or newer
- Angular CLI version 16 or newer: `npm install -g @angular/cli`

## Install Handsontable

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">

```bash
npm install handsontable @handsontable/angular-wrapper
```

  </code-block>
  <code-block title="Yarn">

```bash
yarn add handsontable @handsontable/angular-wrapper
```

  </code-block>
  <code-block title="pnpm">

```bash
pnpm add handsontable @handsontable/angular-wrapper
```

  </code-block>
</code-group>

## Install Skills for Claude Code

Skills for Claude Code give Claude AI deep knowledge of Handsontable's APIs, so it can build, configure, and debug your grid accurately. We recommend installing them alongside Handsontable.

In Claude Code, run:

```bash
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
```

For more details, see [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md).

## Configure `app.config.ts`

In `app.config.ts`, register Handsontable's modules and set global configuration values via the `HOT_GLOBAL_CONFIG` token. You can modify these values at any time using `HotGlobalConfigService`, or override them per table. All properties of `HotGlobalConfig` are optional.

```ts
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import {
  HOT_GLOBAL_CONFIG,
  HotGlobalConfig,
  NON_COMMERCIAL_LICENSE,
} from "@handsontable/angular-wrapper";
import { registerAllModules } from "handsontable/registry";
import { registerLanguageDictionary, enUS } from "handsontable/i18n";

registerAllModules();
registerLanguageDictionary(enUS);

const globalHotConfig: HotGlobalConfig = {
  license: NON_COMMERCIAL_LICENSE,
  layoutDirection: "ltr",
  language: enUS.languageCode,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};
```

To reduce the size of your JavaScript bundle, [import only the modules that you need](@/guides/tools-and-building/modules/modules.md) instead of calling `registerAllModules()`.

## Use the `HotTable` Component

The main Handsontable component is called `HotTableComponent`. Import `HotTableModule` in your component and pass configuration via a `GridSettings` object:

```ts
import { Component } from "@angular/core";
import {
  GridSettings,
  HotTableModule,
} from "@handsontable/angular-wrapper";

@Component({
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class HotTableWrapperComponent {
  readonly data = [
    ["", "Tesla", "Volvo", "Toyota", "Ford"],
    ["2019", 10, 11, 12, 13],
    ["2020", 20, 11, 14, 13],
    ["2021", 30, 15, 12, 13],
    ["2022", 25, 20, 11, 14],
  ];
  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    height: "auto",
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
```

### Preview the result

::: example :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/installation/angular/example1.ts)
@[code](@/content/guides/getting-started/installation/angular/example1.html)

:::

## Supported versions of Angular

`@handsontable/angular-wrapper` requires at least Angular 16. If you use a lower version of Angular, you can use the `@handsontable/angular` package instead.

For more information on `@handsontable/angular`, see the [15.3 documentation](https://handsontable.com/docs/15.3/javascript-data-grid/angular-installation/).

| Angular version | Handsontable wrapper                              |
| ---------------- | ------------------------------------------------ |
| Older than 16   | [@handsontable/angular](https://www.npmjs.com/package/@handsontable/angular) (deprecated)   |
| 16 and newer    | [@handsontable/angular-wrapper](https://www.npmjs.com/package/@handsontable/angular-wrapper)        |

### Troubleshooting

If you're using Angular 21 or newer, please note that older versions of `@handsontable/angular-wrapper` are incompatible due to recent breaking changes in Angular. To ensure smooth integration, upgrade to `@handsontable/angular-wrapper@16.2` or later.

## Server Side Rendering (SSR)

Currently, `HotTable` cannot be rendered on the server-side. If your application uses SSR, render it only in the browser using the `@if` control flow block.

```ts
import { isPlatformBrowser } from "@angular/common";
import { Component, inject, PLATFORM_ID } from "@angular/core";
import { GridSettings, HotTableModule } from "@handsontable/angular-wrapper";

@Component({
  standalone: true,
  selector: "app-root",
  imports: [HotTableModule],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  private platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly data = [
    ["", "Tesla", "Volvo", "Toyota", "Ford"],
    ["2019", 10, 11, 12, 13],
    ["2020", 20, 11, 14, 13],
    ["2021", 30, 15, 12, 13],
    ["2022", 25, 20, 11, 14],
  ];
  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    height: "auto",
    autoWrapRow: true,
    autoWrapCol: true,
    manualRowResize: true,
    manualColumnResize: true,
  };
}
```

```html
<div>
  @if (isBrowser) {
    <hot-table [data]="data" [settings]="gridSettings" />
  }
</div>
```

## Result

Handsontable is installed and running in your Angular application. You can now [configure options](@/guides/getting-started/configuration-options/configuration-options.md) or [import only the modules you need](@/guides/tools-and-building/modules/modules.md) to reduce your bundle size.

:::

::: only-for javascript

## Overview

To start using Handsontable, follow these steps:

## Install Handsontable

Get Handsontable's files in your preferred way.

### Using a package manager

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add handsontable
  ```

  </code-block>
  <code-block title="pnpm">

  ```bash
  pnpm add handsontable
  ```

  </code-block>
</code-group>

### Install Skills for Claude Code

Skills for Claude Code give Claude AI deep knowledge of Handsontable's APIs, so it can build, configure, and debug your grid accurately. We recommend installing them alongside Handsontable.

In Claude Code, run:

```bash
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
```

For more details, see [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md).

### Using a CDN

To get Handsontable's files from a CDN, use the following locations:

- [https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js](https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js)

## Import Handsontable's JavaScript

Import Handsontable's JavaScript into your application.

::: tip
For a more optimized build, import individual parts of Handsontable's JavaScript, using [modules](@/guides/tools-and-building/modules/modules.md).
:::

### Using CommonJS or a package manager

If you're using Handsontable as a CommonJS package, or as an ECMAScript module (using a package manager), import the full distribution of Handsontable as a JavaScript file.

Use your bundler's preferred method of importing files. For example:

```js
import Handsontable from 'handsontable';
```

### Using the `script` tag

If you're using Handsontable as a traditional UMD package, import the full distribution of Handsontable as a minified JavaScript file.

Use the `script` tag. For example, if you're loading Handsontable's JavaScript from a CDN:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
```

## Create a container

In your HTML, add an empty `div`, which serves as a container for your Handsontable instance.

```html
<div id="example"></div>
```

## Initialize your grid

Now turn your container into a data grid with sample data.

```js
const container = document.querySelector('#example');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
  ],
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
});
```

### Preview the result

::: example #example --js 1 --ts 2

@[code](@/content/guides/getting-started/installation/javascript/example.js)
@[code](@/content/guides/getting-started/installation/javascript/example.ts)

:::

:::

::: only-for react

## Install Handsontable

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable @handsontable/react-wrapper
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add handsontable @handsontable/react-wrapper
  ```

  </code-block>
  <code-block title="pnpm">

  ```bash
  pnpm add handsontable @handsontable/react-wrapper
  ```

  </code-block>
</code-group>

## Install Skills for Claude Code

Skills for Claude Code give Claude AI deep knowledge of Handsontable's APIs, so it can build, configure, and debug your grid accurately. We recommend installing them alongside Handsontable.

In Claude Code, run:

```bash
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
```

For more details, see [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md).

## Register Handsontable's modules

Import and register all of Handsontable's modules with a single function call:

```jsx
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

Or, to reduce the size of your JavaScript bundle, [import only the modules that you need](@/guides/tools-and-building/modules/modules.md).

## Use the `HotTable` component

The main Handsontable component is called `HotTable`.

```jsx
import { HotTable } from '@handsontable/react-wrapper';
```

To set Handsontable's [configuration options](@/guides/getting-started/configuration-options/configuration-options.md), use `HotTable`'s props. For example:

```jsx
<HotTable
  data={[
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
  ]}
  rowHeaders={true}
  colHeaders={true}
  height="auto"
  autoWrapRow={true}
  autoWrapCol={true}
  licenseKey="non-commercial-and-evaluation" // for non-commercial use only
/>
```

::: tip

`@handsontable/react-wrapper` requires at least React@18 and is built with functional editors and renderers components in mind.

:::

### Preview the result

::: example #example :react --js 1 --ts 2

@[code](@/content/guides/getting-started/installation/react/example.jsx)
@[code](@/content/guides/getting-started/installation/react/example.tsx)

:::

:::

::: only-for vue

## Install Handsontable

To install Handsontable locally using a package manager, run one of these commands:

<code-group>
  <code-block title="npm">

  ```bash
  npm install handsontable @handsontable/vue3
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add handsontable @handsontable/vue3
  ```

  </code-block>
  <code-block title="pnpm">

  ```bash
  pnpm add handsontable @handsontable/vue3
  ```

  </code-block>
</code-group>

## Install Skills for Claude Code

Skills for Claude Code give Claude AI deep knowledge of Handsontable's APIs, so it can build, configure, and debug your grid accurately. We recommend installing them alongside Handsontable.

In Claude Code, run:

```bash
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
```

For more details, see [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md).

## Register Handsontable's modules

Import and register all of Handsontable's modules with a single function call:

```js
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

Or, to reduce the size of your JavaScript bundle, [import only the modules that you need](@/guides/tools-and-building/modules/modules.md).

## Use the `HotTable` component

The main Handsontable component is called `HotTable`.

```js
import { HotTable } from '@handsontable/vue3';
```

To set Handsontable's [configuration options](@/guides/getting-started/configuration-options/configuration-options.md), use `HotTable`'s props. For example:

```html
<HotTable
  :data="data"
  :row-headers="true"
  :col-headers="true"
  height="auto"
  :auto-wrap-row="true"
  :auto-wrap-col="true"
  license-key="non-commercial-and-evaluation"
/>
```

### Preview the result

::: example #example1 :vue3

@[code](@/content/guides/getting-started/installation/vue/example1.vue)

:::

## Supported versions of Vue

`@handsontable/vue3` requires Vue 3. Vue 2 is not supported -- use [Handsontable 16.2.0](https://handsontable.com/docs/16.2/javascript-data-grid/vue-installation/) if you need Vue 2.

| Handsontable version | Vue 3 version      |
| -------------------- | ------------------ |
| `11.0.0` and lower   | No Vue 3 support   |
| `11.1.0` and higher  | `3.2.0` and higher |

:::

</div>

## Result

Handsontable is installed and ready to use in your project. Import it and create your first grid instance.

## Related articles

**Related guides**

<div class="boxes-list">

- [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md)
- [Modules](@/guides/tools-and-building/modules/modules.md)

</div>

**Configuration options**

<div class="boxes-list">

- [maxCols](@/api/options.md#maxcols)
- [maxRows](@/api/options.md#maxrows)
- [minCols](@/api/options.md#mincols)
- [minRows](@/api/options.md#minrows)
- [minSpareCols](@/api/options.md#minsparecols)
- [minSpareRows](@/api/options.md#minsparerows)
- [startCols](@/api/options.md#startcols)
- [startRows](@/api/options.md#startrows)

</div>

**Hooks**

<div class="boxes-list">

- [afterInit](@/api/hooks.md#afterinit)
- [beforeInit](@/api/hooks.md#beforeinit)
- [beforeInitWalkontable](@/api/hooks.md#beforeinitwalkontable)
- [construct](@/api/hooks.md#construct)

</div>
