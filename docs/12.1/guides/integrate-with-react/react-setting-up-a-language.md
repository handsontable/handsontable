---
title: 'Setting up a translation in React'
metaTitle: 'Setting up a translation in React - Guide - Handsontable Documentation'
permalink: /12.1/react-setting-up-a-language
canonicalUrl: /react-setting-up-a-language
---

# Setting up a translation in React

[[toc]]

## Overview

The following example shows a Handsontable instance with translations set up in React.

## Example

::: example #example1 :react-numbro
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

import 'handsontable/dist/handsontable.min.css';

// register Handsontable's modules
registerAllModules();

import numbro from 'numbro';
import languages from 'numbro/dist/languages.min.js';

// register the languages you need
numbro.registerLanguage(languages['ja-JP']);
numbro.registerLanguage(languages['tr-TR']);

// define formats
const formatJP = {
  pattern: '0,0.00 $',
  culture: 'ja-JP'
};

const formatTR = {
  pattern: '0,0.00 $',
  culture: 'tr-TR'
};

const hotSettings = {
  data: [
    {
      productName: 'Product A',
      JP_price: 1.32,
      TR_price: 100.56
    },
    {
      productName: 'Product B',
      JP_price: 2.22,
      TR_price: 453.5
    },
    {
      productName: 'Product C',
      JP_price: 3.1,
      TR_price: 678.1
    }
  ],
  autoRowSize: false,
  autoColumnSize: false,
  colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
}

const App = () => {
  return (
    <HotTable settings={hotSettings}>
      <HotColumn data="productName" type="text" width="120" />
      <HotColumn
        data="JP_price"
        type="numeric"
        numericFormat={formatJP}
        width="120"
      />
      <HotColumn
        data="TR_price"
        type="numeric"
        numericFormat={formatTR}
        width="120"
      />
    </HotTable>
  )
}

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::

## Related articles

### Related guides

- [Language](@/guides/internationalization/language.md)
- [Layout direction](@/guides/internationalization/layout-direction.md)
- [Locale](@/guides/internationalization/locale.md)

### Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
- Core methods:
  - [`getDirectionFactor()`](@/api/core.md#getdirectionfactor)
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
  - [`isLtr()`](@/api/core.md#isltr)
  - [`isRtl()`](@/api/core.md#isrtl)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)