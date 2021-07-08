---
title: Setting up a locale
metaTitle: Setting up a locale - Guide - Handsontable Documentation
permalink: /9.0/react-setting-up-a-locale
canonicalUrl: /react-setting-up-a-locale
---

# Setting up a locale

## Overview

The following example shows a Handsontable instance with locales set up in React.

## Example

::: example #example1 :react-numbro
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Handsontable from 'handsontable';
import { HotTable, HotColumn } from '@handsontable/react';
import 'handsontable/dist/handsontable.min.css';

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
