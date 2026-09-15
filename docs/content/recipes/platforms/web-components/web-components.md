---
type: tutorial
title: Wrap Handsontable in a web component
metaTitle: Web Components Tutorial - JavaScript Data Grid | Handsontable
description: Wrap Handsontable in a custom element with its own shadow root. Load the stylesheets on both sides of the boundary, expose data and settings as properties, and emit cell edits as DOM events.
permalink: /recipes/platforms/web-components
canonicalUrl: /recipes/platforms/web-components
framework: javascript
tags:
  - web components
  - custom elements
  - shadow dom
  - encapsulation
searchCategory: Recipes
category: Platforms and embedding
menuTag: new
---

In this tutorial, you will wrap Handsontable in a custom element that owns its own shadow root. It covers only the glue between the grid and the element: getting the stylesheets to both sides of the shadow boundary, passing data and settings in through methods, emitting cell edits out as DOM events, and destroying the instance when the element leaves the page. It assumes you already write custom elements.

## Overview

**Difficulty:** Intermediate<br>
**Time:** ~20 minutes

A custom element gives the grid one tag, a few methods, and one event, and the same tag then works in a plain page or inside a framework component.

Handsontable works across a shadow boundary on its own, so clicking, the cell editors, copy and paste, and the context menu need no forwarding code from you - see the [Shadow DOM guide](@/guides/tools-and-building/shadow-dom/shadow-dom.md) for what it handles there.

## What you'll build

A `<hot-grid>` element with a small, framework-agnostic contract:

- `setData()` and `setSettings()` **methods** that update a live grid instead of recreating it, with `getData()`, `getSettings()`, and `getInstance()` reading straight from it.
- A `cell-change` event that carries each edit to the host page.
- Stylesheets on both sides of the shadow boundary: a constructed sheet inside the root, a plain import for the menus outside it.

## Before you begin

Scaffold a vanilla project and add the grid:

```shell
npm create vite@latest hot-grid-element -- --template vanilla-ts
cd hot-grid-element
npm install handsontable
```

## Step 1: Define the element and its styles

The grid needs a container inside the shadow root, and a `:host` display so the element has a box to render into. `index.html` puts the tag on the page, so every later step has something live to change:

<code-group>
  <code-block title="src/main.ts">

```ts
import baseStyles from 'handsontable/styles/handsontable.min.css?inline';
import themeStyles from 'handsontable/styles/ht-theme-main.min.css?inline';

// The menus mount in a portal on document.body, outside the shadow root.
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

const gridStyles = new CSSStyleSheet();

gridStyles.replaceSync(`
  ${baseStyles}
  ${themeStyles}
  :host { display: block; }
`);

class HotGridElement extends HTMLElement {
  #container: HTMLDivElement;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets = [gridStyles];

    this.#container = document.createElement('div');

    shadowRoot.append(this.#container);
  }
}

customElements.define('hot-grid', HotGridElement);

declare global {
  interface HTMLElementTagNameMap {
    'hot-grid': HotGridElement;
  }
}
```

  </code-block>
  <code-block title="index.html">

```html
<hot-grid></hot-grid>
<script type="module" src="/src/main.ts"></script>
```

  </code-block>
</code-group>

The `?inline` imports give the constructed sheet its text: `handsontable.min.css` for structure, the theme stylesheet for the visible design. Without the plain pair in the document, every menu opens unstyled.

The page stays blank for now: the element upgrades and its shadow root is styled, but no grid exists until Step 2 creates one.

## Step 2: Create the grid and emit its edits

Create the instance in `connectedCallback()`, and translate the one hook the host page cares about into a DOM event:

```ts ins={1,17-25,27,41-76,85-88} collapse={2-16,28-40,77-84} title="src/main.ts"
import Handsontable from 'handsontable';
import baseStyles from 'handsontable/styles/handsontable.min.css?inline';
import themeStyles from 'handsontable/styles/ht-theme-main.min.css?inline';

// The menus mount in a portal on document.body, outside the shadow root.
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

const gridStyles = new CSSStyleSheet();

gridStyles.replaceSync(`
  ${baseStyles}
  ${themeStyles}
  :host { display: block; }
`);

interface HotGridCellChange {
  row: number;
  physicalRow: number;
  prop: Handsontable.CellChange[1];
  oldValue: Handsontable.CellValue;
  newValue: Handsontable.CellValue;
  source?: Handsontable.ChangeSource;
}

class HotGridElement extends HTMLElement {
  #instance: Handsontable | null = null;
  #container: HTMLDivElement;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets = [gridStyles];

    this.#container = document.createElement('div');

    shadowRoot.append(this.#container);
  }

  #createGrid(): void {
    const instance = new Handsontable(this.#container, {
      themeName: 'ht-theme-main',
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      afterChange: (changes, source) => {
        if (!changes || source === 'loadData') {
          return;
        }

        changes.forEach(([row, prop, oldValue, newValue]) => {
          this.dispatchEvent(new CustomEvent<HotGridCellChange>('cell-change', {
            detail: {
              row,
              physicalRow: instance.toPhysicalRow(row),
              prop,
              oldValue,
              newValue,
              source,
            },
            bubbles: true,
            composed: true,
          }));
        });
      },
    });

    this.#instance = instance;
  }

  connectedCallback(): void {
    if (!this.#instance) {
      this.#createGrid();
    }
  }
}

customElements.define('hot-grid', HotGridElement);

declare global {
  interface HTMLElementTagNameMap {
    'hot-grid': HotGridElement;
  }

  interface HTMLElementEventMap {
    'cell-change': CustomEvent<HotGridCellChange>;
  }
}
```

`composed: true` is what lets the event leave the shadow root - without it a listener on the host page never fires. Skipping the `loadData` source keeps the first data load from reporting every cell as an edit.

`cell-change` carries both indexes, because `row` is visual and moves when the user sorts - index your store with `physicalRow`. See [Understanding data and indexes](@/guides/getting-started/understanding-data-and-indexes/understanding-data-and-indexes.md).

Replace `licenseKey` with your commercial key before production use. See [License key](@/guides/getting-started/license-key/license-key.md).

## Step 3: Expose the grid through methods

The host reads and writes through methods that go straight to the instance, so the element stores no copy of the data:

```ts ins={17-18,26-37,91-110} collapse={1-16,19-25,38-90,111-123} title="src/main.ts"
import Handsontable from 'handsontable';
import baseStyles from 'handsontable/styles/handsontable.min.css?inline';
import themeStyles from 'handsontable/styles/ht-theme-main.min.css?inline';

// The menus mount in a portal on document.body, outside the shadow root.
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

const gridStyles = new CSSStyleSheet();

gridStyles.replaceSync(`
  ${baseStyles}
  ${themeStyles}
  :host { display: block; }
`);

type HotGridRow = Handsontable.RowObject | Handsontable.CellValue[];

interface HotGridCellChange {
  row: number;
  physicalRow: number;
  prop: Handsontable.CellChange[1];
  oldValue: Handsontable.CellValue;
  newValue: Handsontable.CellValue;
  source?: Handsontable.ChangeSource;
}

function cloneRows(rows: HotGridRow[]): HotGridRow[] {
  try {
    return structuredClone(rows);
  } catch (error) {
    throw new Error(
      'hot-grid: data must be structured-cloneable. Reactive proxies, cyclic ' +
      'references, functions, and BigInt are not.',
      { cause: error },
    );
  }
}

class HotGridElement extends HTMLElement {
  #instance: Handsontable | null = null;
  #container: HTMLDivElement;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets = [gridStyles];

    this.#container = document.createElement('div');

    shadowRoot.append(this.#container);
  }

  #createGrid(): void {
    const instance = new Handsontable(this.#container, {
      themeName: 'ht-theme-main',
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      afterChange: (changes, source) => {
        if (!changes || source === 'loadData') {
          return;
        }

        changes.forEach(([row, prop, oldValue, newValue]) => {
          this.dispatchEvent(new CustomEvent<HotGridCellChange>('cell-change', {
            detail: {
              row,
              physicalRow: instance.toPhysicalRow(row),
              prop,
              oldValue,
              newValue,
              source,
            },
            bubbles: true,
            composed: true,
          }));
        });
      },
    });

    this.#instance = instance;
  }

  connectedCallback(): void {
    if (!this.#instance) {
      this.#createGrid();
    }
  }

  getData(): ReturnType<Handsontable['getSourceData']> {
    return this.#instance?.getSourceData() ?? [];
  }

  setData(rows: HotGridRow[]): void {
    this.#instance?.updateSettings({ data: cloneRows(rows) });
  }

  getSettings(): Handsontable.GridSettings {
    return this.#instance?.getSettings() ?? {};
  }

  setSettings(settings: Handsontable.GridSettings): void {
    this.#instance?.updateSettings(settings);
  }

  getInstance(): Handsontable | null {
    return this.#instance;
  }
}

customElements.define('hot-grid', HotGridElement);

declare global {
  interface HTMLElementTagNameMap {
    'hot-grid': HotGridElement;
  }

  interface HTMLElementEventMap {
    'cell-change': CustomEvent<HotGridCellChange>;
  }
}
```

Handsontable writes edits into the array it is given, so `setData()` clones what the host passes in rather than letting the grid edit the host's own state.

## Step 4: Clean up on disconnect

A grid that is never destroyed keeps its listeners and its resize observer alive, which leaks on any page that swaps views without a reload:

```ts ins={7-17} title="src/main.ts"
  connectedCallback(): void {
    if (!this.#instance) {
      this.#createGrid();
    }
  }

  disconnectedCallback(): void {
    queueMicrotask(() => {
      if (this.isConnected) {
        return;
      }

      this.#instance?.destroy();
      this.#instance = null;
    });
  }

  getData(): ReturnType<Handsontable['getSourceData']> {
    return this.#instance?.getSourceData() ?? [];
  }

  setData(rows: HotGridRow[]): void {
    this.#instance?.updateSettings({ data: cloneRows(rows) });
  }
```

Handsontable reads the container's root node once, when the instance is created, and that single check drives the `ht-shadow-dom` class and the shadow-root clipboard listeners. Moving a live grid into or out of a shadow root leaves those bound to the wrong tree, so destroy and recreate rather than reparenting.

The microtask is what makes an ordinary DOM move survivable. `insertBefore` and `append` on an already-connected element fire `disconnectedCallback` and then `connectedCallback`, so destroying synchronously throws away the instance - and with it the selection and any edit the grid has not written back - on a plain reorder. Deferring one microtask lets the reconnect cancel the teardown.

## Step 5: Use the element

The tag has been on the page since Step 1. Fill it at the end of `src/main.ts`, below the class:

```ts ins={12-37} title="src/main.ts"
customElements.define('hot-grid', HotGridElement);

declare global {
  interface HTMLElementTagNameMap {
    'hot-grid': HotGridElement;
  }

  interface HTMLElementEventMap {
    'cell-change': CustomEvent<HotGridCellChange>;
  }
}

const grid = document.querySelector('hot-grid');

grid?.setData([
  { sku: 'SKU-4821', product: 'Thermal camera', quantity: 142, supplier: 'Harbor Goods' },
  { sku: 'SKU-0093', product: 'Cable tester', quantity: 67, supplier: 'Alpine Supply Co.' },
  { sku: 'SKU-1147', product: 'Torque wrench', quantity: 0, supplier: 'Harbor Goods' },
  { sku: 'SKU-2250', product: 'Label printer', quantity: 38, supplier: 'Vertex Industries' },
  { sku: 'SKU-3390', product: 'Impact driver', quantity: 91, supplier: 'Alpine Supply Co.' },
]);

grid?.setSettings({
  colHeaders: ['SKU', 'Product', 'Quantity', 'Supplier'],
  columns: [
    { data: 'sku' },
    { data: 'product' },
    { data: 'quantity', type: 'numeric' },
    { data: 'supplier' },
  ],
});

grid?.addEventListener('cell-change', (event) => {
  const { physicalRow, prop, newValue } = event.detail;

  console.log(physicalRow, prop, newValue);
});
```

## Related

<div class="boxes-list">

- [Shadow DOM](@/guides/tools-and-building/shadow-dom/shadow-dom.md)
- [Themes](@/guides/styling/themes/themes.md)
- [Installation](@/guides/getting-started/installation/installation.md)

</div>

## What you learned

- The shadow root adopts the grid's stylesheets as a constructed sheet, and the document still needs them for the menus.
- Data and settings go in through methods, forwarded to `updateSettings()` so a live grid is not recreated.

## Next steps

- Explore [Run Handsontable in a Salesforce Lightning Web Component](@/recipes/platforms/salesforce-lwc/salesforce-lwc.md) for the same pattern on a platform that owns the component lifecycle.
