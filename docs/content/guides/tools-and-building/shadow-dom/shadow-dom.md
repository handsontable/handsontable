---
type: how-to
title: Shadow DOM
metaTitle: Shadow DOM - JavaScript Data Grid | Handsontable
description: Run Handsontable inside a Shadow DOM tree, in web components, and on sandboxed platforms such as Salesforce Lightning Web Components.
permalink: /shadow-dom
canonicalUrl: /shadow-dom
tags:
  - shadow dom
  - web components
  - custom elements
  - salesforce
  - lightning web components
  - lwc
react:
  metaTitle: Shadow DOM - React Data Grid | Handsontable
angular:
  metaTitle: Shadow DOM - Angular Data Grid | Handsontable
vue:
  metaTitle: Shadow DOM - Vue Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
menuTag: new
---

Handsontable works inside a Shadow DOM tree. You can render the grid in a web component, a custom element, or a sandboxed component platform such as Salesforce Lightning Web Components.

[[toc]]

## Overview

When you attach the grid's container to a shadow root, Handsontable detects the boundary and adjusts its behavior:

- Mouse, focus, and clipboard events are resolved through the shadow boundary, so cell selection, the cell editors, and copy and paste work the same way as in the regular DOM.
- Handsontable adds the `ht-shadow-dom` CSS class to its root wrapper element. The class creates an isolated stacking context (`isolation: isolate`), which keeps the grid's internal z-index values from competing with the host page UI.

## Load the styles inside the shadow root

Styles don't cross the shadow boundary. Load both the base stylesheet and a theme stylesheet inside the shadow root that hosts the grid, and create the grid after the stylesheets finish loading. The web component below shows the full setup:

```js
class DataGridElement extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'open' });

    const loadStylesheet = (href) => new Promise((resolve) => {
      const link = document.createElement('link');

      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      shadowRoot.appendChild(link);
    });

    const container = document.createElement('div');

    shadowRoot.appendChild(container);

    Promise.all([
      loadStylesheet('styles/handsontable.min.css'),
      loadStylesheet('styles/ht-theme-main.min.css'),
    ]).then(() => {
      this.hot = new Handsontable(container, {
        themeName: 'ht-theme-main',
        licenseKey: 'non-commercial-and-evaluation',
        // your configuration
      });
    });
  }

  disconnectedCallback() {
    this.hot?.destroy();
  }
}

customElements.define('data-grid-element', DataGridElement);
```

If you skip the base stylesheet, the grid renders but interactive elements such as the cell editor appear in wrong positions. If you create the grid before the stylesheets finish loading, Handsontable warns that the theme stylesheets are missing and measures cell sizes against unstyled elements.

Handsontable also injects its core styles into the document head (the [`injectCoreCss`](@/api/options.md#injectcorecss) option). Keep that default when the grid renders in a shadow root: the stylesheets inside the shadow root style the grid, and the document-head copy styles the elements that Handsontable renders outside the shadow root - the context menu and other dropdowns. Setting `injectCoreCss: false` removes the head copy only until the first menu opens, because the menus restore it for their own rendering.

## The `ht-shadow-dom` class

Handsontable checks the container's root node once, when the instance is created. If the container sits inside a shadow root, the root wrapper element receives the `ht-shadow-dom` class. You can use the class in your own stylesheets to target grids that render inside a Shadow DOM tree.

The class also applies `isolation: isolate` to the wrapper. Without it, the grid's internal z-index values (up to 200) would compete with the host page's UI - for example, frozen headers of a scrolled grid could paint above the host application's navigation. Grids that render in the regular DOM keep their previous stacking behavior.

## Sandboxed platforms

Some platforms wrap the DOM APIs in a security sandbox. Salesforce Lightning Web Security (LWS) filters `Event#composedPath()` and limits `document.activeElement` resolution for the sandboxed code. Handsontable falls back to signals that stay reliable in such environments: per-listener event targets and focus tracking within its own DOM tree. Cell editing, selection, keyboard handling, and copy and paste work under LWS without wrapper-side workarounds.

Salesforce Lightning Experience renders Lightning Web Components with its synthetic Shadow DOM polyfill by default. Handsontable works in that default mode. It also works with the native opt-in (`static shadowSupportMode = 'native'`), with one requirement: Salesforce's `loadStyle` injects CSS into the document head, which a native shadow root ignores. Inject both Handsontable stylesheets into the component's shadow tree instead - for example, append the `<link>` elements inside the `lwc:dom="manual"` container and wait for their `load` events before you create the grid.

## Known limitations

- Handsontable checks the container's root node only when the instance is created. That check controls three things: the `ht-shadow-dom` class, the shadow-root clipboard listeners that copy and paste rely on in sandboxed hosts, and the shadow-root mouse listeners the comment tooltip uses to react to hovering. If you move a live grid into or out of a shadow root, destroy the instance and create it again.
- The cell editor doesn't leave the grid's stacking context. In a tight layout, an editor that overflows the grid's wrapper can paint under the host page content that creates its own stacking context.

## Related guides

<div class="boxes-list">

- [Custom builds](@/guides/tools-and-building/custom-builds/custom-builds.md)
- [Themes](@/guides/styling/themes/themes.md)

</div>
