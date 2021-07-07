---
title: Language change example
metaTitle: Language change example - Guide - Handsontable Documentation
permalink: /9.0/react-language-change-example
canonicalUrl: /react-language-change-example
---

# Language change example

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
import Handsontable from 'handsontable';

const hotSettings = {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
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
    setLanguageList(Handsontable.languages.getLanguagesDictionaries());
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
