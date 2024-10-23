---
id: vjcvrdeh
title: Bundle size
metaTitle: Bundle size - JavaScript Data Grid | Handsontable
description: Reduce the size of your JavaScript bundle by getting rid of redundant Handsontable modules and Moment.js locales.
permalink: /bundle-size
canonicalUrl: /bundle-size
tags:
  - size
react:
  id: c8onyes4
  metaTitle: Bundle size - React Data Grid | Handsontable
searchCategory: Guides
category: Optimization
---

# Bundle size

Reduce the size of your JavaScript bundle by getting rid of redundant Handsontable modules and Moment.js locales.

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

## Optimize Moment.js

By default, [Moment.js](https://momentjs.com/) (Handsontable's dependency) comes with all possible locales, which increases the bundle size.

To [optimize Moment.js locales](https://github.com/jmblog/how-to-optimize-momentjs-with-webpack), use [webpack's `IgnorePlugin`](https://webpack.js.org/plugins/ignore-plugin/):

```js
const webpack = require('webpack');

module.exports = {
  //...
  plugins: [
    // ignore all Moment.js locale files
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
};
```

And then explicitly load Moment.js, importing just those locales that you need:

::: only-for javascript

```js
import Handsontable from 'handsontable/base';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';

// explicitly import Moment.js
import moment from 'moment';
// explicitly import a Moment.js locale of your choice
import 'moment/locale/ja';

// register the Moment.js locale of your choice
moment.locale('ja');
registerCellType(DateCellType);

new Handsontable(container, {
  type: 'date',
});
```

:::

::: only-for react
```js
import Handsontable from 'handsontable/base';
import { HotTable } from '@handsontable/react-wrapper';
import { registerCellType, DateCellType } from 'handsontable/cellTypes';

// explicitly import Moment.js
import moment from 'moment';
// explicitly import a Moment.js locale of your choice
import 'moment/locale/ja';

// register the Moment.js locale of your choice
moment.locale('ja');
registerCellType(DateCellType);

const App = () => {
  return (
    <HotTable
      type="date"
    />
  );
};
```

:::

## Related guides

- [Modules](@/guides/tools-and-building/modules/modules.md)
