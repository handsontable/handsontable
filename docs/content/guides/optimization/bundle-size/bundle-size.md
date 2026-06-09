---
type: how-to
title: Bundle size
metaTitle: Bundle size - JavaScript Data Grid | Handsontable
description: Reduce the size of your JavaScript bundle by getting rid of redundant Handsontable modules.
permalink: /bundle-size
canonicalUrl: /bundle-size
tags:
  - size
react:
  metaTitle: Bundle size - React Data Grid | Handsontable
angular:
  metaTitle: Bundle size - Angular Data Grid | Handsontable
vue:
  metaTitle: Bundle size - Vue Data Grid | Handsontable
searchCategory: Guides
category: Optimization
---
Reduce the size of your JavaScript bundle by getting rid of redundant Handsontable modules.

[[toc]]

## Use modules

To reduce the bundle size and JavaScript parsing time, import only those of Handsontable's [modules](@/guides/tools-and-building/modules/modules.md) that you actually use, instead of importing the complete package.

The following example shows how to import and register the [`ContextMenu`](@/api/contextMenu.md) plugin on top of the base module of Handsontable, without importing anything else.

::: only-for javascript

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

registerPlugin(ContextMenu);

new Handsontable(container, {
  contextMenu: true,
});
```

:::

::: only-for react

```js
import Handsontable from 'handsontable/base';
import { HotTable } from '@handsontable/react-wrapper';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

registerPlugin(ContextMenu);

const App = () => {
  return (
    <HotTable
      contextMenu={true}
    />
  );
};
```

:::

::: only-for angular

```ts
import { Component } from "@angular/core";
import { GridSettings, HotTableModule } from "@handsontable/angular-wrapper";

registerPlugin(ContextMenu);

@Component({
  selector: "app-example",
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [settings]="gridSettings" />
  </div>`,
})
export class ExampleComponent {
  readonly gridSettings = <GridSettings>{
    contextMenu: true,
  };
}
```

:::

## Related guides

<div class="boxes-list">

- [Modules](@/guides/tools-and-building/modules/modules.md)

</div>
