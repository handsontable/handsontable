---
type: how-to
title: Installation
metaTitle: Install HyperFormula - JavaScript Data Grid | Handsontable
description: Install HyperFormula as a separate dependency, license it, and import it to power the Formulas plugin in Handsontable 18.0 and later.
permalink: /formulas-installation
canonicalUrl: /formulas-installation
tags:
  - formulas
  - hyperformula
  - installation
  - license
react:
  metaTitle: Install HyperFormula - React Data Grid | Handsontable
angular:
  metaTitle: Install HyperFormula - Angular Data Grid | Handsontable
vue:
  metaTitle: Install HyperFormula - Vue Data Grid | Handsontable
searchCategory: Guides
category: Formulas
menuTag: new
---

The [`Formulas`](@/api/formulas.md) plugin runs on [HyperFormula](https://hyperformula.handsontable.com/),
a calculation engine that you install separately. This guide shows how to install, license, and
import HyperFormula so you can enable the plugin.

Starting with Handsontable 18.0, HyperFormula is not bundled with Handsontable. You add it to your
project yourself. In earlier versions, HyperFormula shipped as a Handsontable dependency and
required no separate installation.

[[toc]]

## Prerequisites

- Handsontable is installed in your project. See [Installation](@/guides/getting-started/installation/installation.md).

## Install HyperFormula

Install HyperFormula with your package manager:

<code-group>
  <code-block title="npm">

  ```bash
  npm install hyperformula
  ```

  </code-block>
  <code-block title="Yarn">

  ```bash
  yarn add hyperformula
  ```

  </code-block>
  <code-block title="pnpm">

  ```bash
  pnpm add hyperformula
  ```

  </code-block>
</code-group>

Install the HyperFormula version that matches your Handsontable version. For the compatible
versions, see [HyperFormula version support](@/guides/formulas/formula-calculation/formula-calculation.md#hyperformula-version-support).

To load HyperFormula from a CDN or as a UMD bundle instead, see the
[HyperFormula installation docs](https://handsontable.github.io/hyperformula/guide/client-side-installation.html).

## Import HyperFormula

Import the `HyperFormula` class into the file where you configure the grid:

```js
import { HyperFormula } from 'hyperformula';
```

## License HyperFormula

HyperFormula requires a license key. When HyperFormula runs inside Handsontable, use the
`'internal-use-in-handsontable'` key. This key is free and covers any HyperFormula instance that is
connected to a Handsontable instance.

How you apply the key depends on how you create the engine:

- If you pass the `HyperFormula` class to the `formulas.engine` option, Handsontable builds the
  engine and applies the `'internal-use-in-handsontable'` key for you.
- If you build the engine yourself with `HyperFormula.buildEmpty()`, set the key in the
  configuration:

```js
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});
```

To run HyperFormula on its own, outside a Handsontable instance (for example, on a server), you
need a dedicated [HyperFormula license key](https://hyperformula.handsontable.com/guide/license-key.html).
For details, [contact our Sales Team](https://handsontable.com/get-a-quote).

## Enable the Formulas plugin

Pass the `HyperFormula` class to the `formulas.engine` option. Handsontable builds the engine and
applies the license key for you.

```js
import Handsontable from 'handsontable';
import { HyperFormula } from 'hyperformula';

const container = document.querySelector('#example');

const hot = new Handsontable(container, {
  data: [
    ['Product', 'Price', 'Quantity', 'Total'],
    ['Wireless mouse', 25, 4, '=B2*C2'],
    ['Mechanical keyboard', 89, 2, '=B3*C3'],
    ['USB-C hub', 45, 3, '=B4*C4'],
  ],
  colHeaders: true,
  rowHeaders: true,
  formulas: {
    engine: HyperFormula,
  },
  licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
});
```

This example passes the `HyperFormula` class, which is one of several ways to connect the engine.

## Ways to pass HyperFormula

You can connect HyperFormula to Handsontable in more than one way. The `formulas.engine` option
accepts the `HyperFormula` class, a pre-built HyperFormula instance, or an engine configuration
object. Choose the approach that fits your setup.

### Pass the `HyperFormula` class
This is the shortest path, shown above. You import the class and
pass it to `formulas.engine`. Handsontable builds the engine, applies the
`'internal-use-in-handsontable'` license key, and manages the engine's lifecycle for you. Use this
for a single grid, or for grids that each work on their own data.

```js
import { HyperFormula } from 'hyperformula';

const hot = new Handsontable(container, {
  formulas: {
    engine: HyperFormula,
  },
  licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
});
```

### Build a `HyperFormula` instance first, then pass it
Create the engine yourself with
`HyperFormula.buildEmpty()`, set the license key, and pass the instance to `formulas.engine`. This
gives you direct access to the engine's API. It also lets several Handsontable instances share one
engine, so formulas can reference cells across grids with cross-sheet references.

```js
import { HyperFormula } from 'hyperformula';

const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

const hot = new Handsontable(container, {
  formulas: {
    engine: hyperformulaInstance,
  },
  licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
});
```

### Pass an engine configuration object
Instead of the bare class, pass an object with a
`hyperformula` field (the class or an instance) alongside HyperFormula configuration options, such
as `leapYear1900`. Use this to customize how the engine behaves.

```js
import { HyperFormula } from 'hyperformula';

const hot = new Handsontable(container, {
  formulas: {
    engine: {
      hyperformula: HyperFormula, // or a pre-built HyperFormula instance
      leapYear1900: false,
    },
  },
  licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
});
```

For complete, framework-specific examples of each approach - including shared and external engines
across multiple grids - see [Initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods).

## Result

HyperFormula is installed, licensed, and connected to Handsontable. The `Formulas` plugin evaluates
any cell whose value starts with `=`, and it recalculates dependent cells as your data changes.

## Related

- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md) - use formulas, named expressions, custom functions, and cross-sheet references
- [Installation](@/guides/getting-started/installation/installation.md) - install Handsontable
- [`Formulas` plugin API](@/api/formulas.md)
- [`formulas` option](@/api/options.md#formulas)
