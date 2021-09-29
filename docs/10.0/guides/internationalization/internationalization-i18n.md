---
title: Internationalization (i18n)
metaTitle: Internationalization (i18n) - Guide - Handsontable Documentation
permalink: /10.0/internationalization-i18n
canonicalUrl: /internationalization-i18n
---

# Internationalization (i18n)

[[toc]]

## Overview

Internationalization allows Handsontable to easily change the text of the UI for the purpose of translating it to specific languages. We provide the developer with predefined languages, which can be applied by loading the language set and changing just one setting, and an ability to use their own language sets, created using templates of existing language files.

## Loading the prepared language files

To properly use the internationalization feature, you'll need to load the language sets. It's important that they're included after the Handsontable files. You can do it by getting the necessary files created with the [UMD standard](https://github.com/umdjs/umd):

1. **ES modules (ESM)**
  ```js
  import Handsontable from 'handsontable/base';
  import { registerLanguageDictionary, deDE } from 'handsontable/i18n';

  registerLanguageDictionary(deDE);

  const hot = new Handsontable(container, {
    language: deDE.languageCode,
  });
  ```

2. **CommonJS (CJS)**
  ```js
  const Handsontable = require('handsontable/base').default;
  const { registerLanguageDictionary, deDE } = require('handsontable/i18n');

  registerLanguageDictionary(deDE);

  const hot = new Handsontable(container, {
    language: deDE.languageCode,
  });
  ```

3. **Universal Module Definition (UMD)**

  Languages included this way are ready to use immediately after loading the file. Each file contains a UMD loader that looks for `Handsontable` in a global/externals context. If `Handsontable` is available then it registers itself in the proper context.
  ```html
  <script type="text/javascript" src="dist/handsontable.full.js"></script>
  <script type="text/javascript" src="dist/languages/de-DE.js"></script>
  <script>
    const hot = new Handsontable(container, {
      language: 'de-DE',
    });
  </script>
  ```

## Demo

Please right click on a cell to see the translated context menu. Language files were loaded after loading Handsontable.

::: example #example1 :hot-lang
```js
const container = document.querySelector('#example1');

const data = [
  ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
  ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
  ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
  ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
  ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5]
];

const hot = new Handsontable(container, {
  data,
  contextMenu: true,
  height: 'auto',
  language: 'de-DE',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Internationalization for features

Below you'll find a list of features which can be translated with the internationalization feature.

* Dropdown menu
* Filtering
* Hiding columns
* Hiding rows
* Nesting rows
* Comments
* Context menu
* Custom borders
* Freezing
* Merge cells
* Read-only

## List of available languages

By default, Handsontable uses the **English - United States** language-country set (`en-US` code) for creating the text of UI elements. However, it can be used like every extra, "non-standard" language file, thus the `en-US.js` file can be found in `/dist/languages`, `/languages` and `/src/languages` folders. Currently, we also distribute extra language-country files:

* `de-DE.js` for **German - Germany** (`de-DE` code).
* `de-CH.js` for **German - Switzerland** (`de-CH` code).
* `es-MX.js` for **Spanish - Mexico** (`es-MX` code).
* `fr-FR.js` for **French - France** (`fr-FR` code).
* `it-IT.js` for **Italian - Italy** (`it-IT` code).
* `ja-JP.js` for **Japanese - Japan** (`ja-JP` code).
* `ko-KR.js` for **Korean - Korea** (`ko-KR` code).
* `lv-LV.js` for **Latvian - Latvia** (`lv-LV` code).
* `nb-NO.js` for **Norwegian (Bokmål) - Norway** (`nb-NO` code).
* `nl-NL.js` for **Dutch - Netherlands** (`nl-NL` code).
* `pl-PL.js` for **Polish - Poland** (`pl-PL` code).
* `pt-BR.js` for **Portuguese - Brazil** (`pt-BR` code).
* `ru-RU.js` for **Russian - Russia** (`ru-RU` code).
* `zh-CN.js` for **Chinese - China** (`zh-CN` code).
* `zh-TW.js` for **Chinese - Taiwan** (`zh-TW` code).

## Creating custom languages

You can create custom language sets for your implementations, or share them, as they're easily appliable to any Handsontable implementation.

### Language file

It's really important for us, that the community is a important part of the growth of our library. We encourage you to create and share your translations!

Additional languages files should be placed in the `src/i18n/languages` folder of the [Handsontable](https://github.com/handsontable/handsontable) repository with name corresponding to the chosen language code (described below, for example: `es-VE.js`). You can incorporate your translations to the Handsontable library by sending us a [pull request](@/guides/building-and-testing/building.md). It's important, that your changes are not made to the `/languages` and `/dist/languages` directories! Our release master will generate files which will be placed there in the building process. After that, you will be able to use the languages in `Handsontable`.

You can see a full template of a sample language at the bottom of this paragraph. We're basing it on our [default language pack](https://github.com/handsontable/handsontable/tree/master/src/i18n/languages/en-US.js). Parts of the file creation process are described below.

1. The file should start with a comment containing the translation **authors** (separated by commas, for example: _Authors: Chris Wick, John Kyle_), **"last updated" date** (in format: _mmm dd, yyyy_, for example: _Last updated: Jan 01, 2017_) and a **description.**

    ```js
    /**
    * @preserve
    * Authors: Chris Wick, John Kyle
    * Last updated: Nov 15, 2017
    *
    * Description: Definition file for Spanish - Venezuela language-country.
    */
    ```

2. After that, you'll need to import the dictionary keys to be used in the translation.

    ```js
    import * as C from '../constants';
    ```

3. The language dictionary object should contain a `languageCode` key (in format: two lowercase letters, hyphen, two uppercase letters, for example: _languageCode: 'es-PY'_) which will determine the language code to be used in the language property in the `Handsontable` settings and dictionaries keys with their corresponding translations.

    ```js
    const dictionary = {
      languageCode: 'es-VE',
      [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Insertar fila arriba',
      ...
    }
    ```

4.  Lastly, place a default export of the created dictionary.

    ```js
    export default dictionary;
    ```

5.  A simple, sample language dictionary can look like the snippet below. The `/languages` and `/dist/languages` folders will be generated by the build process. Files from those localizations can be included as shown in [this section](#loading-language-files). After loading them, you will be able to use the language. You can do it by changing the language setting of `Handsontable` to `es-VE`.

    ```js
    /**
    * @preserve
    * Authors: Chris Wick, John Kyle
    * Last updated: Nov 15, 2017
    *
    * Description: Definition file for Spanish - Venezuela language-country.
    */
    import * as C from '../constants';

    const dictionary = {
      languageCode: 'es-VE',
      [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Insertar fila arriba',
    };

    export default dictionary;
    ```

6.  Import already created file inside the `src/i18n/languages/index.js` file and export it like it's shown in the snippet below (keys in a alphabetical order).

    ```js {4,11}
    import deCH from './de-CH';
    import deDE from './de-DE';
    import enUS from './en-US';
    import esVE from './es-VE';
    import plPL from './pl-PL';

    export {
      deCH,
      deDE,
      enUS,
      esVE,
      plPL
    };
    ```

7.  Voilà! You've created a language which can be used just by you or shared with others. We wait for at least 5 positive feedback from users to accept a created [pull request](@/guides/building-and-testing/building.md).

### Local language

You can register a language dictionary which is not a part of the `Handsontable` package. To do so, use the static `Handsontable.languages.registerLanguageDictionary` method and the static constant `Handsontable.languages.dictionaryKeys` which are described briefly in the next section.

```js
const C = Handsontable.languages.dictionaryKeys;

Handsontable.languages.registerLanguageDictionary({
  languageCode: 'morse',
  // Your translation in the Morse code
  [C.FILTERS_BUTTONS_OK]: '--- -•-'
});
```

## Using custom keys in the translation

You can register a language dictionary containing custom keys. These entries can be used like any other keys, so you're not limited to using our pre-defined constants (the ones that are present within `src/i18n/constants.js` file and may be accessed by `Handsontable.languages.dictionaryKeys` alias).

```js
const enUSDictionary = Handsontable.languages.getLanguageDictionary('en-US');

enUSDictionary.customKey = 'Hello world';

Handsontable.languages.registerLanguageDictionary(enUSDictionary); // re-registration
Handsontable.languages.getTranslatedPhrase('en-US', 'customKey'); // 'Hello world'
```

## Static Handsontable methods and properties

Handsontable has a few static methods and properties connected with languages. They are stored in the `languages` key of the global `Handsontable` variable. All of them are described below.

### Get language dictionary for specific language code

Handsontable.languages.getLanguageDictionary(languageCode: `String`)

Returns: `Object`

### Get the registered language dictionaries

Handsontable.languages.getLanguagesDictionaries()

Returns: `Array`

### Get the phrase for specified dictionary key

Handsontable.languages.getTranslatedPhrase(languageCode: `String`, dictionaryKey: `String`, extraArguments: `Mixed`)

Returns: `Object`

### Register a language dictionary for a specific language code

Handsontable.languages.registerLanguageDictionary(languageCodeOrDictionary: `Mixed`, dictionary: `Object`)

Returns: `Object`

### Dictionary constants

Handsontable.languages.dictionaryKeys

Contains: `Object`
