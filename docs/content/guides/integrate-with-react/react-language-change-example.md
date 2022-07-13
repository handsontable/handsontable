---
title: 'Language change in React'
metaTitle: 'Language change in React - Guide - Handsontable Documentation'
permalink: /react-language-change-example
canonicalUrl: /react-language-change-example
---

# Language change in React

[[toc]]

## Overview

The following example implements the `@handsontable/react` component with the option to change the Context Menu language configured. Select a language from the selector above the table and open the Context Menu to see the result.

:::tip
Note that the `language` property is bound to the component separately using `language={this.language}"`, but it could be included in the `settings` property just as well.
:::

## Example

::: example #example1 :react-languages
```jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { getLanguagesDictionaries } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const hotSettings = {
  data: createSpreadsheetData(5, 10),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
};

const App = () => {
  const [language, setLanguage] = useState('en-US');
  const [languageList, setLanguageList] = useState([]);

  useEffect(() => {
    setLanguageList(getLanguagesDictionaries());
  }, []);

  const updateHotLanguage = event => {
    setLanguage(event.target.value);
  };

  return (
    <div>
      <label htmlFor="languages">Select language:
        {' '}
        <select value={language} onChange={updateHotLanguage} id="languages">
          {languageList.map(({ languageCode }) => (
            <option key={languageCode} value={languageCode}>
              {languageCode}
            </option>
          ))}
        </select>
      </label>

      <br/>
      <br/>

      <HotTable language={language} settings={hotSettings}/>
    </div>
  );
}

ReactDOM.render(<App/>, document.getElementById('example1'));
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
