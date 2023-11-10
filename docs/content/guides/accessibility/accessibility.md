---
id: o4qhm1bg
title: Accessibility
metaTitle: Accessibility - JavaScript Data Grid | Handsontable
description: Learn about Handsontable's accessibility features.
permalink: /accessibility
canonicalUrl: /accessibility
tags:
  - accessibility
  - a11y
  - aria
  - jaws
  - nvda
  - voiceover
  - wcag
  - section 508
  - ada
  - compliance
  - vpat
  - acr
react:
  id: x82phf34
  metaTitle: Accessibility - React Data Grid | Handsontable
searchCategory: Guides
---
# Accessibility

Handsontable is designed to be accessible, aligning with global standards. We prioritize inclusivity, ensuring web applications are usable by people with disabilities. 

[[toc]]

## Overview

Accessibility features of Handsontable include:

- [Keyboard navigation](@/guides/navigation/keyboard-navigation.md) that lets you access most of the features without using a mouse.
- Support for the most popular [screen readers](#screen-readers).
- Standards conforming to [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)

## Conformance with standards
Handsontable aligns with global standards and regulations. These standards, which are in accordance with the Web Content Accessibility Guidelines (WCAG), aim to make the web more inclusive for individuals with disabilities.

A list of the most known accessibility standards are:
<br> 

- **Europe / EU:**
  - [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
  - [Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102)

- **United States:**
  - [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)
  - [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)

- **Canada:**
  - [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601)

### VPAT and Accessibility Statement
Accessibility Statement and VPAT (Voluntary Product Accessibility Template) for Handsontable outline how the product meets accessibility standards.

<!-- Chris to send the documents VPAT and Accessibility statement -->

## Keyboard navigation
Handsontable mainly uses keyboard navigation. This is critical for people who rely on a keyboard or other assistive technologies. 
Importantly, depending on your needs, the navigation can be customized through the API.

Learn more in the following sections:

- [Keyboard navigation](@/guides/navigation/keyboard-navigation.md)
- [Default keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md)
- [Custom shortcuts](@/guides/navigation/custom-shortcuts.md)

### Navigation modes
Handsontable works as both a spreadsheet application and a data grid. While the differences might seem minor at first, they significantly affect how users navigate using the keyboard. The following table provides a comparison between the two nodes for clearer understanding.


|               | Data grid mode                                                                 | Spreadsheet mode (default)                                                                                           |
|----------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Configuration options            | `navigableHeaders: true` <br>  `tabMoves: false`                                  | `navigableHeaders: false` <br> `tabMoves: true`                                                                        |
| Brief description                | The <kbd>Arrow keys</kbd> are primarly used to navigate across the grid. Use simple shortcut keys such as <kbd>Enter</kbd> or <kbd>Space</kbd> to open menus or interact with headers, cells, or editors. <br>You cannot use <kbd>Tab</kbd> key to navigate across the grid.| The <kbd>Tab</kbd> key is primarily used to navigate across the grid.<br>This scenario provides an experience familiar to users of Excel or Google Sheets. To open menus users need to learn and use more complex shortcut keys. |
| Primary navigation method        | <kbd>Arrow keys</kbd>                                                                     | <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd>                                                                                                    |
| <kbd>Tab</kbd> sequence within the page     | One <kbd>Tab</kbd> stop - the grid is included in the page sequence only once.            | Multiple <kbd>Tab</kbd> stops - all the grid tabbable elements are included in the page <kbd>Tab</kbd> sequence.                            |
| Navigable headers                | Yes                                                                            | No                                                                                                                   |                                                                                              |
### Shortcut keys configuration
Hansontable includes a wide range of shortcut keys for quick navigation and offers customization options through API.

| Windows                                         | macOS                                           | Action                                      | Focus                    |
|-------------------------------------------------|-------------------------------------------------|---------------------------------------------|-----------------------------|
| <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>I</kbd>       | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>I</kbd>    | Open column menu       | Any table cell              |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                    | <kbd>Cmd</kbd> + <kbd>Enter</kbd>                       | Open column menu           | Column header               |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>                   | <kbd>Shift</kbd> + <kbd>Enter</kbd>                     | Sort data                                  |    Column header             |
| <kbd>Alt</kbd> + <kbd>A</kbd>                         | <kbd>Option</kbd> + <kbd>A</kbd>                        | Clear filters                              |      Any table cell            |
| <kbd>Ctrl</kbd> + <kbd>Space</kbd>                    | <kbd>Cmd</kbd> + <kbd>Space</kbd>                       | Select the entire column                   | Any cell in a column        |
| <kbd>Shift</kbd> + <kbd>Space</kbd>                   | <kbd>Shift</kbd> + <kbd>Space</kbd>                     | Select the entire row                      | Any cell in a row           |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd>      | <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>\\</kbd> <br> <kbd>Shift</kbd> + <kbd>F10</kbd> | Invoke context menu          |  Any table cell |

For the full reference , go to the [shortcut keys](@/guides/navigation/keyboard-shortcuts.md) page.
## Screen readers
Handsontable incorporates ARIA attributes to make its content available to screen readers and other assistive technologies. 

Handsontable is being tested with popular screen readers for compatibility. We specifically focus on testing with the following software:

* [JAWS](https://www.freedomscientific.com/products/software/jaws/) for Windows
* [VoiceOver](https://www.apple.com/voiceover/info/guide/_1121.html) for macOS
* [NVDA](https://www.nvaccess.org/) for Windows


## A demo configured for accessibility
In the demo provided, you can toggle various options to adjust the accessibility support for users with disabilities. Handsontable demo configured for accessibility may vary based on the application you create. 

::: example #example --html 1 --css 2 --js 3

```html
<div class="exampleContainer">
  <div class="checkboxContainer">
    <div class="checkboxGroup">
      <div>
        <label
          class="optionLabel"
          for="enableTabNavigation"
          id="tabNavigationLabel"
          ><input
            checked
            type="checkbox"
            id="enableTabNavigation"
            name="enableTabNavigation"
            aria-labelledby="tabNavigationLabel"
          />
          Enable navigation with the Tab key
        </label>
      </div>
      <div>
        <label
          class="optionLabel"
          for="enableHeaderNavigation"
          id="headerNavigationLabel"
        >
          <input
            checked
            type="checkbox"
            id="enableHeaderNavigation"
            name="enableHeaderNavigation"
            aria-labelledby="headerNavigationLabel"
          />
          Enable navigation across headers
        </label>
      </div>
      <div>
        <label
          class="optionLabel"
          for="enableCellVirtualization"
          id="cellVirtualizationLabel"
        >
          <input
            checked
            type="checkbox"
            id="enableCellVirtualization"
            name="enableCellVirtualization"
            aria-labelledby="cellVirtualizationLabel"
          />
          Enable cells virtualization
        </label>
      </div>
      <div>
        <label
          class="optionLabel"
          for="enableCellEnterEditing"
          id="cellEnterEditingLabel"
          ><input
            checked
            type="checkbox"
            id="enableCellEnterEditing"
            name="enableCellEnterEditing"
            aria-labelledby="cellEnterEditingLabel"
          />
          The Enter key begins cell editing
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#enterbeginsediting"
          target="_blank"
          class="externalLink"
          rel="noopener noreferrer"
          aria-label="Learn more about Enter key cell editing (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-external-link"
            aria-hidden="true"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        </a>
      </div>
    </div>
    <div class="checkboxGroup">
      <div>
        <label
          class="optionLabel"
          for="enableArrowRLFirstLastColumn"
          id="arrowRLFirstLastColumnLabel"
          ><input
            checked
            type="checkbox"
            id="enableArrowRLFirstLastColumn"
            name="enableArrowFirstLastColumn"
            aria-labelledby="arrowRLFirstLastColumnLabel"
          />
          The right/left arrow keys move the focus to the first/last column
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#autowrapcol"
          target="_blank"
          class="externalLink"
          rel="noopener noreferrer"
          aria-label="Learn more about right/left arrow key behavior (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-external-link"
            aria-hidden="true"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        </a>
      </div>
      <div>
        <label
          class="optionLabel"
          for="enableArrowTDFirstLastColumn"
          id="arrowTDFirstLastColumnLabel"
        >
          <input
            checked
            type="checkbox"
            id="enableArrowTDFirstLastColumn"
            name="enableArrowTDFirstLastColumn"
            aria-labelledby="arrowTDFirstLastColumnLabel"
          />
          The up/down arrow keys move the focus to the first/last row
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#autowraprow"
          target="_blank"
          class="externalLink"
          rel="noopener noreferrer"
          aria-label="Learn more about up/down arrow key behavior (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-external-link"
            aria-hidden="true"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        </a>
      </div>
      <div>
        <label
          class="optionLabel"
          for="enableEnterFocusEditing"
          id="enterFocusEditingLabel"
        >
          <input
            checked
            type="checkbox"
            id="enableEnterFocusEditing"
            name="enableEnterFocusEditing"
            aria-labelledby="enterFocusEditingLabel"
          />
          The Enter key moves the focus after cell edition
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#entermoves"
          target="_blank"
          class="externalLink"
          rel="noopener noreferrer"
          aria-label="Learn more about Enter key focus behavior (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-external-link"
            aria-hidden="true"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  </div>

  <input
    class="placeholderInput"
    type="text"
    placeholder="Focusable text input"
  />

  <div id="handsontable"></div>

  <input
    class="placeholderInput"
    type="text"
    placeholder="Focusable text input"
  />
</div>
```

```css
.exampleContainer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: Inter var, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
    Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
}
.exampleContainer #handsontable { 
  background: white;
}

/*
  A stylesheet customizing app (custom renderers)
*/

table.htCore td .stars {
  color: #fcb515;
}

table.htCore tr.odd td {
  background: #fafbff;
}

table.htCore td .progressBar {
  background: #37bc6c;
  height: 10px;
}

table.htCore tr.selected td {
  background: #edf3fd;
}

/*
  A stylesheet customizing Handsontable style
*/

.collapsibleIndicator {
  text-align: center;
}

.handsontable .htRight .changeType {
  margin: 3px 1px 0 13px;
}

.handsontable .green {
  background: #37bc6c;
  font-weight: bold;
}

.handsontable .orange {
  background: #fcb515;
  font-weight: bold;
}

.btn {
  padding: 20px;
  font: 1.4em sans-serif;
}

[data-color="green"] {
  background: #37bc6c;
}

[data-color="orange"] {
  background: #fcb515;
}

.checkboxContainer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.checkboxGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkboxGroup > div {
  display: flex;
}

.checkboxGroup > div > label {
  display: flex;
  gap: 0.2rem;
}

.externalLink {
  color: black;
  position: relative;
  top: 2px;
  margin-left: 0.5rem;
}

.externalLink:hover {
  color: #0000ee;
}

.placeholderInput {
  background: white;

  max-width: 20rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-color: rgb(228, 228, 231);
  border-image-outset: 0;
  border-style: solid;
  border-radius: 6px;
  border-width: 1px;
}

.optionLabel > input:focus {
  outline: none;
}

.optionLabel {
  align-items: flex-start;
}

.optionLabel:focus-within {
  outline: 5px auto Highlight;
  outline: 5px auto -webkit-focus-ring-color;
}

html.theme-dark .optionLabel {
  color: #e5ebf1 !important;
}
```

```js
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";



const data = [
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Rustic Soft Ball",
    sellDate: "23/06/2023",
    inStock: false,
    qty: 82,
    progress: 1,
    rating: 3,
    orderId: "2-7",
    country: "United Kingdom",
    __children: [
      { companyName: "Nader - Fritsch" },
      { companyName: "Rath LLC" },
      { companyName: "Renner - Prosacco" },
    ],
  },
  {
    companyName: "Lind Group",
    productName: "Small Fresh Bacon",
    sellDate: "03/10/2023",
    inStock: false,
    qty: 402,
    progress: 8,
    rating: 3,
    orderId: "18-4410298",
    country: "Croatia",
  },
  {
    companyName: "Hintz - Boehm",
    productName: "Awesome Wooden Hat",
    sellDate: "17/08/2023",
    inStock: false,
    qty: 294,
    progress: 5,
    rating: 2,
    orderId: "82-4974523",
    country: "Brazil",
  },
  {
    companyName: "Hegmann Inc",
    productName: "Awesome Wooden Hat",
    sellDate: "15/07/2023",
    inStock: true,
    qty: 457,
    progress: 3,
    rating: 3,
    orderId: "50-5193066",
    country: "Syrian Arab Republic",
  },
  {
    companyName: "Walker - Zieme",
    productName: "Small Fresh Bacon",
    sellDate: "06/11/2022",
    inStock: true,
    qty: 142,
    progress: 4,
    rating: 2,
    orderId: "70-8893751",
    country: "Senegal",
  },
  {
    companyName: "Bernier LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "19/06/2023",
    inStock: false,
    qty: 330,
    progress: 0,
    rating: 4,
    orderId: "98-8296545",
    country: "Burundi",
  },
  {
    companyName: "Doyle Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "27/04/2023",
    inStock: true,
    qty: 370,
    progress: 7,
    rating: 2,
    orderId: "43-4650584",
    country: "Liechtenstein",
  },
  {
    companyName: "Pouros - Brakus",
    productName: "Tasty Frozen Table",
    sellDate: "03/06/2023",
    inStock: true,
    qty: 343,
    progress: 5,
    rating: 4,
    orderId: "78-1001420",
    country: "Chile",
  },
  {
    companyName: "Hegmann Inc",
    productName: "Tasty Frozen Table",
    sellDate: "24/04/2023",
    inStock: false,
    qty: 439,
    progress: 1,
    rating: 1,
    orderId: "31-5623969",
    country: "Albania",
  },
  {
    companyName: "Jacobi - Kutch",
    productName: "Rustic Soft Ball",
    sellDate: "26/12/2022",
    inStock: true,
    qty: 393,
    progress: 1,
    rating: 4,
    orderId: "44-6834872",
    country: "Belarus",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Rustic Cotton Ball",
    sellDate: "01/03/2023",
    inStock: false,
    qty: 427,
    progress: 1,
    rating: 4,
    orderId: "51-1408998",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Lesch - Carter",
    productName: "Small Rubber Shoes",
    sellDate: "23/06/2023",
    inStock: true,
    qty: 293,
    progress: 4,
    rating: 4,
    orderId: "80-5224477",
    country: "Dominican Republic",
  },
  {
    companyName: "Hahn - Welch",
    productName: "Small Frozen Tuna",
    sellDate: "08/04/2023",
    inStock: false,
    qty: 391,
    progress: 8,
    rating: 3,
    orderId: "73-8083441",
    country: "United Kingdom",
  },
  {
    companyName: "Koepp and Sons",
    productName: "Rustic Soft Ball",
    sellDate: "16/03/2023",
    inStock: true,
    qty: 103,
    progress: 5,
    rating: 4,
    orderId: "86-6103606",
    country: "Congo",
  },
  {
    companyName: "Mills Group",
    productName: "Awesome Wooden Hat",
    sellDate: "22/10/2023",
    inStock: true,
    qty: 481,
    progress: 9,
    rating: 1,
    orderId: "98-2489065",
    country: "Dominican Republic",
  },
  {
    companyName: "Gutkowski Inc",
    productName: "Small Fresh Bacon",
    sellDate: "27/06/2023",
    inStock: true,
    qty: 235,
    progress: 3,
    rating: 3,
    orderId: "84-6875668",
    country: "Guinea-Bissau",
  },
  {
    companyName: "Reichel Group",
    productName: "Rustic Cotton Ball",
    sellDate: "14/02/2023",
    inStock: false,
    qty: 168,
    progress: 10,
    rating: 3,
    orderId: "23-8583301",
    country: "Norfolk Island",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Small Fresh Fish",
    sellDate: "02/07/2023",
    inStock: false,
    qty: 304,
    progress: 1,
    rating: 0,
    orderId: "59-6027645",
    country: "Isle of Man",
  },
  {
    companyName: "Gutkowski Inc",
    productName: "Small Fresh Fish",
    sellDate: "15/11/2022",
    inStock: false,
    qty: 103,
    progress: 5,
    rating: 0,
    orderId: "34-9123047",
    country: "Saint Barthelemy",
  },
  {
    companyName: "Mills Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "26/07/2023",
    inStock: false,
    qty: 303,
    progress: 8,
    rating: 3,
    orderId: "59-2245660",
    country: "Burkina Faso",
  },
  {
    companyName: "Rath LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "09/06/2023",
    inStock: false,
    qty: 289,
    progress: 3,
    rating: 2,
    orderId: "49-8877811",
    country: "Azerbaijan",
  },
  {
    companyName: "Mills Group",
    productName: "Small Frozen Tuna",
    sellDate: "03/08/2023",
    inStock: false,
    qty: 240,
    progress: 6,
    rating: 3,
    orderId: "40-8529501",
    country: "Montserrat",
  },
  {
    companyName: "Kohler LLC",
    productName: "Small Fresh Bacon",
    sellDate: "12/03/2023",
    inStock: false,
    qty: 310,
    progress: 4,
    rating: 3,
    orderId: "13-4444739",
    country: "Belarus",
  },
  {
    companyName: "Wilkinson - Dare",
    productName: "Tasty Frozen Table",
    sellDate: "12/04/2023",
    inStock: false,
    qty: 263,
    progress: 3,
    rating: 4,
    orderId: "18-2777672",
    country: "Panama",
  },
  {
    companyName: "Carroll Group",
    productName: "Small Frozen Tuna",
    sellDate: "29/05/2023",
    inStock: true,
    qty: 39,
    progress: 4,
    rating: 4,
    orderId: "20-4039291",
    country: "Burkina Faso",
  },
  {
    companyName: "Hahn - Welch",
    productName: "Sleek Wooden Bacon",
    sellDate: "04/08/2023",
    inStock: true,
    qty: 79,
    progress: 2,
    rating: 3,
    orderId: "78-9639284",
    country: "Mongolia",
  },
  {
    companyName: "Kozey Inc",
    productName: "Rustic Soft Ball",
    sellDate: "12/03/2023",
    inStock: false,
    qty: 335,
    progress: 7,
    rating: 5,
    orderId: "12-3683426",
    country: "Antigua and Barbuda",
  },
  {
    companyName: "Kub Inc",
    productName: "Awesome Wooden Hat",
    sellDate: "12/01/2023",
    inStock: false,
    qty: 325,
    progress: 3,
    rating: 1,
    orderId: "74-6398902",
    country: "Liechtenstein",
  },
  {
    companyName: "Hintz - Boehm",
    productName: "Small Rubber Shoes",
    sellDate: "28/08/2023",
    inStock: false,
    qty: 186,
    progress: 6,
    rating: 4,
    orderId: "95-5471320",
    country: "United States of America",
  },
  {
    companyName: "Lesch - Carter",
    productName: "Awesome Wooden Hat",
    sellDate: "17/10/2023",
    inStock: true,
    qty: 376,
    progress: 2,
    rating: 3,
    orderId: "87-4875315",
    country: "Antigua and Barbuda",
  },
  {
    companyName: "Jenkins LLC",
    productName: "Tasty Frozen Table",
    sellDate: "18/12/2022",
    inStock: true,
    qty: 256,
    progress: 4,
    rating: 3,
    orderId: "93-4925111",
    country: "Afghanistan",
  },
  {
    companyName: "Jenkins LLC",
    productName: "Sleek Wooden Bacon",
    sellDate: "23/05/2023",
    inStock: true,
    qty: 494,
    progress: 3,
    rating: 4,
    orderId: "63-4367248",
    country: "Pitcairn Islands",
  },
  {
    companyName: "Labadie LLC",
    productName: "Rustic Cotton Ball",
    sellDate: "27/06/2023",
    inStock: false,
    qty: 348,
    progress: 2,
    rating: 4,
    orderId: "72-1225529",
    country: "Iran",
  },
  {
    companyName: "Kreiger - Sauer",
    productName: "Small Fresh Bacon",
    sellDate: "21/12/2022",
    inStock: true,
    qty: 489,
    progress: 9,
    rating: 3,
    orderId: "90-8617194",
    country: "Estonia",
  },
  {
    companyName: "Skiles and Sons",
    productName: "Small Rubber Shoes",
    sellDate: "14/01/2023",
    inStock: false,
    qty: 173,
    progress: 6,
    rating: 0,
    orderId: "74-4960242",
    country: "Mauritius",
  },
  {
    companyName: "Hills and Sons",
    productName: "Small Frozen Tuna",
    sellDate: "26/10/2023",
    inStock: false,
    qty: 435,
    progress: 10,
    rating: 5,
    orderId: "54-2168682",
    country: "Wallis and Futuna",
  },
  {
    companyName: "Dooley and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "05/12/2022",
    inStock: true,
    qty: 428,
    progress: 2,
    rating: 4,
    orderId: "42-2348118",
    country: "Germany",
  },
  {
    companyName: "Upton - Reichert",
    productName: "Sleek Wooden Bacon",
    sellDate: "06/11/2022",
    inStock: true,
    qty: 91,
    progress: 8,
    rating: 0,
    orderId: "41-1298896",
    country: "Tajikistan",
  },
  {
    companyName: "Kreiger and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "16/11/2022",
    inStock: false,
    qty: 487,
    progress: 7,
    rating: 0,
    orderId: "71-7594251",
    country: "Namibia",
  },
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Small Frozen Tuna",
    sellDate: "17/07/2023",
    inStock: true,
    qty: 41,
    progress: 1,
    rating: 3,
    orderId: "60-1296629",
    country: "Belize",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Rustic Cotton Ball",
    sellDate: "05/11/2022",
    inStock: true,
    qty: 362,
    progress: 7,
    rating: 3,
    orderId: "83-9727916",
    country: "Cocos (Keeling) Islands",
  },
  {
    companyName: "Jenkins - Turcotte",
    productName: "Small Fresh Bacon",
    sellDate: "24/02/2023",
    inStock: true,
    qty: 369,
    progress: 4,
    rating: 1,
    orderId: "69-5317904",
    country: "Comoros",
  },
  {
    companyName: "Block - Rau",
    productName: "Rustic Soft Ball",
    sellDate: "29/07/2023",
    inStock: false,
    qty: 299,
    progress: 3,
    rating: 1,
    orderId: "50-9274487",
    country: "Trinidad and Tobago",
  },
  {
    companyName: "Kohler LLC",
    productName: "Tasty Frozen Table",
    sellDate: "01/02/2023",
    inStock: false,
    qty: 417,
    progress: 1,
    rating: 4,
    orderId: "85-9594393",
    country: "Czech Republic",
  },
  {
    companyName: "Labadie LLC",
    productName: "Small Fresh Bacon",
    sellDate: "08/04/2023",
    inStock: true,
    qty: 155,
    progress: 5,
    rating: 1,
    orderId: "42-3969646",
    country: "Ethiopia",
  },
  {
    companyName: "Reichel Group",
    productName: "Small Frozen Tuna",
    sellDate: "01/08/2023",
    inStock: false,
    qty: 319,
    progress: 3,
    rating: 4,
    orderId: "81-2745174",
    country: "Romania",
  },
  {
    companyName: "Reichel Group",
    productName: "Small Fresh Bacon",
    sellDate: "07/04/2023",
    inStock: false,
    qty: 472,
    progress: 5,
    rating: 1,
    orderId: "43-8005419",
    country: "France",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Small Frozen Tuna",
    sellDate: "10/02/2023",
    inStock: true,
    qty: 177,
    progress: 9,
    rating: 3,
    orderId: "58-8520573",
    country: "Latvia",
  },
  {
    companyName: "Block - Rau",
    productName: "Rustic Soft Ball",
    sellDate: "27/06/2023",
    inStock: true,
    qty: 88,
    progress: 9,
    rating: 4,
    orderId: "47-2260240",
    country: "Central African Republic",
  },
  {
    companyName: "Lesch Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "07/08/2023",
    inStock: false,
    qty: 101,
    progress: 9,
    rating: 5,
    orderId: "25-5247728",
    country: "Senegal",
  },
  {
    companyName: "Stehr - Lockman",
    productName: "Small Fresh Fish",
    sellDate: "13/05/2023",
    inStock: true,
    qty: 340,
    progress: 9,
    rating: 4,
    orderId: "37-8930627",
    country: "Vanuatu",
  },
  {
    companyName: "Jacobi - Kutch",
    productName: "Sleek Wooden Bacon",
    sellDate: "05/03/2023",
    inStock: false,
    qty: 370,
    progress: 4,
    rating: 0,
    orderId: "22-1693842",
    country: "Iran",
  },
  {
    companyName: "Brown LLC",
    productName: "Small Frozen Tuna",
    sellDate: "26/09/2023",
    inStock: true,
    qty: 39,
    progress: 8,
    rating: 4,
    orderId: "83-2308376",
    country: "Cocos (Keeling) Islands",
  },
  {
    companyName: "Carroll Group",
    productName: "Awesome Wooden Hat",
    sellDate: "15/11/2022",
    inStock: false,
    qty: 35,
    progress: 2,
    rating: 3,
    orderId: "10-9111264",
    country: "Romania",
  },
  {
    companyName: "Rempel - Durgan",
    productName: "Awesome Wooden Hat",
    sellDate: "22/04/2023",
    inStock: false,
    qty: 249,
    progress: 9,
    rating: 4,
    orderId: "21-2724247",
    country: "Central African Republic",
  },
  {
    companyName: "OReilly LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "16/09/2023",
    inStock: false,
    qty: 155,
    progress: 4,
    rating: 1,
    orderId: "83-7154952",
    country: "Colombia",
  },
  {
    companyName: "Pouros - Brakus",
    productName: "Sleek Wooden Bacon",
    sellDate: "23/02/2023",
    inStock: true,
    qty: 59,
    progress: 7,
    rating: 4,
    orderId: "64-4226441",
    country: "Macao",
  },
  {
    companyName: "Reichel Group",
    productName: "Tasty Frozen Table",
    sellDate: "22/11/2022",
    inStock: true,
    qty: 14,
    progress: 5,
    rating: 5,
    orderId: "97-4085110",
    country: "Mauritius",
  },
  {
    companyName: "Upton - Reichert",
    productName: "Sleek Wooden Bacon",
    sellDate: "11/04/2023",
    inStock: false,
    qty: 403,
    progress: 9,
    rating: 0,
    orderId: "20-7007523",
    country: "Mozambique",
  },
  {
    companyName: "Bernier LLC",
    productName: "Sleek Wooden Bacon",
    sellDate: "14/05/2023",
    inStock: false,
    qty: 437,
    progress: 3,
    rating: 5,
    orderId: "71-4252327",
    country: "Mauritius",
  },
  {
    companyName: "Kerluke LLC",
    productName: "Small Rubber Shoes",
    sellDate: "24/12/2022",
    inStock: true,
    qty: 468,
    progress: 9,
    rating: 4,
    orderId: "55-1387749",
    country: "Burundi",
  },
  {
    companyName: "Kohler LLC",
    productName: "Tasty Frozen Table",
    sellDate: "17/05/2023",
    inStock: false,
    qty: 87,
    progress: 6,
    rating: 1,
    orderId: "74-9565127",
    country: "Mayotte",
  },
  {
    companyName: "Mills Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "14/10/2023",
    inStock: false,
    qty: 45,
    progress: 6,
    rating: 2,
    orderId: "65-4198828",
    country: "Azerbaijan",
  },
  {
    companyName: "Carroll Group",
    productName: "Rustic Soft Ball",
    sellDate: "06/07/2023",
    inStock: true,
    qty: 60,
    progress: 2,
    rating: 4,
    orderId: "16-4488074",
    country: "Gabon",
  },
  {
    companyName: "Bogan - Daniel",
    productName: "Rustic Soft Ball",
    sellDate: "13/07/2023",
    inStock: true,
    qty: 109,
    progress: 2,
    rating: 4,
    orderId: "28-8177294",
    country: "Slovakia (Slovak Republic)",
  },
  {
    companyName: "Abernathy Inc",
    productName: "Sleek Wooden Bacon",
    sellDate: "05/01/2023",
    inStock: false,
    qty: 32,
    progress: 7,
    rating: 0,
    orderId: "75-1825877",
    country: "Burundi",
  },
  {
    companyName: "Rempel - Durgan",
    productName: "Rustic Soft Ball",
    sellDate: "04/07/2023",
    inStock: true,
    qty: 24,
    progress: 8,
    rating: 4,
    orderId: "76-7147174",
    country: "Ethiopia",
  },
  {
    companyName: "Hills and Sons",
    productName: "Small Rubber Shoes",
    sellDate: "20/07/2023",
    inStock: true,
    qty: 369,
    progress: 6,
    rating: 1,
    orderId: "19-9119205",
    country: "Angola",
  },
  {
    companyName: "Kub Inc",
    productName: "Small Frozen Tuna",
    sellDate: "06/11/2022",
    inStock: true,
    qty: 460,
    progress: 6,
    rating: 1,
    orderId: "43-3966418",
    country: "Macao",
  },
  {
    companyName: "Jenkins LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "04/07/2023",
    inStock: true,
    qty: 274,
    progress: 8,
    rating: 0,
    orderId: "88-7598878",
    country: "Latvia",
  },
  {
    companyName: "Lesch and Sons",
    productName: "Small Fresh Fish",
    sellDate: "27/10/2023",
    inStock: true,
    qty: 276,
    progress: 4,
    rating: 4,
    orderId: "46-9234807",
    country: "Switzerland",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Small Fresh Bacon",
    sellDate: "26/09/2023",
    inStock: false,
    qty: 187,
    progress: 5,
    rating: 1,
    orderId: "12-5883279",
    country: "Burkina Faso",
  },
  {
    companyName: "Kub Inc",
    productName: "Sleek Wooden Bacon",
    sellDate: "02/08/2023",
    inStock: false,
    qty: 461,
    progress: 6,
    rating: 2,
    orderId: "22-1228635",
    country: "Switzerland",
  },
  {
    companyName: "Block - Rau",
    productName: "Rustic Cotton Ball",
    sellDate: "08/07/2023",
    inStock: false,
    qty: 102,
    progress: 6,
    rating: 2,
    orderId: "67-3072928",
    country: "Benin",
  },
  {
    companyName: "Batz - Rice",
    productName: "Rustic Soft Ball",
    sellDate: "27/07/2023",
    inStock: true,
    qty: 342,
    progress: 2,
    rating: 3,
    orderId: "78-8720233",
    country: "Somalia",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Small Fresh Bacon",
    sellDate: "09/07/2023",
    inStock: true,
    qty: 332,
    progress: 1,
    rating: 3,
    orderId: "49-4953049",
    country: "Brazil",
  },
  {
    companyName: "Walker - Zieme",
    productName: "Awesome Wooden Hat",
    sellDate: "12/04/2023",
    inStock: true,
    qty: 49,
    progress: 9,
    rating: 3,
    orderId: "41-9830309",
    country: "Liechtenstein",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Small Rubber Shoes",
    sellDate: "17/10/2023",
    inStock: true,
    qty: 226,
    progress: 0,
    rating: 2,
    orderId: "53-8360597",
    country: "Ethiopia",
  },
  {
    companyName: "Koepp and Sons",
    productName: "Sleek Wooden Bacon",
    sellDate: "15/01/2023",
    inStock: false,
    qty: 350,
    progress: 10,
    rating: 5,
    orderId: "37-9185632",
    country: "Croatia",
  },
  {
    companyName: "Stracke - Wisozk",
    productName: "Small Fresh Bacon",
    sellDate: "09/05/2023",
    inStock: false,
    qty: 376,
    progress: 6,
    rating: 4,
    orderId: "83-1708007",
    country: "Croatia",
  },
  {
    companyName: "Kozey Inc",
    productName: "Tasty Frozen Table",
    sellDate: "24/02/2023",
    inStock: false,
    qty: 392,
    progress: 1,
    rating: 2,
    orderId: "24-6173681",
    country: "Sri Lanka",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Small Rubber Shoes",
    sellDate: "27/04/2023",
    inStock: false,
    qty: 472,
    progress: 2,
    rating: 1,
    orderId: "58-5627627",
    country: "United States of America",
  },
  {
    companyName: "Crona and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "23/08/2023",
    inStock: true,
    qty: 344,
    progress: 6,
    rating: 4,
    orderId: "65-9011334",
    country: "Congo",
  },
  {
    companyName: "Hills and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "21/01/2023",
    inStock: true,
    qty: 390,
    progress: 4,
    rating: 1,
    orderId: "53-7128586",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Bogan - Daniel",
    productName: "Small Fresh Fish",
    sellDate: "28/03/2023",
    inStock: false,
    qty: 265,
    progress: 10,
    rating: 1,
    orderId: "28-7372977",
    country: "Iran",
  },
  {
    companyName: "Walker - Zieme",
    productName: "Small Fresh Fish",
    sellDate: "06/11/2022",
    inStock: true,
    qty: 64,
    progress: 1,
    rating: 3,
    orderId: "92-5067253",
    country: "Latvia",
  },
  {
    companyName: "Lesch Group",
    productName: "Awesome Wooden Hat",
    sellDate: "10/02/2023",
    inStock: false,
    qty: 233,
    progress: 10,
    rating: 1,
    orderId: "13-3485394",
    country: "Benin",
  },
  {
    companyName: "Durgan - Stamm",
    productName: "Small Rubber Shoes",
    sellDate: "18/03/2023",
    inStock: true,
    qty: 99,
    progress: 10,
    rating: 2,
    orderId: "54-7725464",
    country: "Bahrain",
  },
  {
    companyName: "Ward Group",
    productName: "Tasty Frozen Table",
    sellDate: "02/04/2023",
    inStock: true,
    qty: 16,
    progress: 2,
    rating: 3,
    orderId: "46-2451576",
    country: "Croatia",
  },
  {
    companyName: "Kerluke LLC",
    productName: "Sleek Wooden Bacon",
    sellDate: "29/12/2022",
    inStock: false,
    qty: 384,
    progress: 3,
    rating: 4,
    orderId: "52-3490246",
    country: "Montserrat",
  },
  {
    companyName: "Bogan - Daniel",
    productName: "Rustic Cotton Ball",
    sellDate: "16/07/2023",
    inStock: false,
    qty: 11,
    progress: 5,
    rating: 4,
    orderId: "80-5233961",
    country: "Guinea-Bissau",
  },
  {
    companyName: "Brown LLC",
    productName: "Small Frozen Tuna",
    sellDate: "23/05/2023",
    inStock: false,
    qty: 149,
    progress: 4,
    rating: 2,
    orderId: "89-8224417",
    country: "Saint Barthelemy",
  },
  {
    companyName: "Durgan - Stamm",
    productName: "Rustic Cotton Ball",
    sellDate: "13/08/2023",
    inStock: true,
    qty: 321,
    progress: 2,
    rating: 4,
    orderId: "61-9619168",
    country: "Latvia",
  },
  {
    companyName: "Abernathy Inc",
    productName: "Small Fresh Fish",
    sellDate: "03/05/2023",
    inStock: false,
    qty: 65,
    progress: 1,
    rating: 4,
    orderId: "33-5972202",
    country: "Liechtenstein",
  },
  {
    companyName: "Kreiger - Sauer",
    productName: "Awesome Wooden Hat",
    sellDate: "02/04/2023",
    inStock: false,
    qty: 83,
    progress: 4,
    rating: 2,
    orderId: "67-4608669",
    country: "Ecuador",
  },
  {
    companyName: "Gutkowski Inc",
    productName: "Small Frozen Tuna",
    sellDate: "23/01/2023",
    inStock: true,
    qty: 60,
    progress: 8,
    rating: 1,
    orderId: "82-5198109",
    country: "Belarus",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Tasty Frozen Table",
    sellDate: "17/08/2023",
    inStock: false,
    qty: 396,
    progress: 10,
    rating: 4,
    orderId: "47-5846500",
    country: "Saint Martin",
  },
  {
    companyName: "Weber and Sons",
    productName: "Rustic Cotton Ball",
    sellDate: "27/02/2023",
    inStock: true,
    qty: 345,
    progress: 10,
    rating: 2,
    orderId: "86-1734689",
    country: "Canada",
  },
  {
    companyName: "Hintz - Boehm",
    productName: "Small Rubber Shoes",
    sellDate: "24/01/2023",
    inStock: false,
    qty: 190,
    progress: 2,
    rating: 1,
    orderId: "92-3521762",
    country: "Qatar",
  },
  {
    companyName: "Weber Inc",
    productName: "Rustic Cotton Ball",
    sellDate: "06/12/2022",
    inStock: true,
    qty: 124,
    progress: 9,
    rating: 4,
    orderId: "24-5368525",
    country: "Cocos (Keeling) Islands",
  },
  {
    companyName: "Skiles and Sons",
    productName: "Rustic Cotton Ball",
    sellDate: "25/07/2023",
    inStock: true,
    qty: 308,
    progress: 8,
    rating: 2,
    orderId: "97-6786281",
    country: "Vanuatu",
  },
  {
    companyName: "Mills Group",
    productName: "Rustic Soft Ball",
    sellDate: "26/04/2023",
    inStock: true,
    qty: 491,
    progress: 9,
    rating: 4,
    orderId: "85-5216736",
    country: "Qatar",
  },
  {
    companyName: "Walker Inc",
    productName: "Tasty Frozen Table",
    sellDate: "21/02/2023",
    inStock: false,
    qty: 377,
    progress: 9,
    rating: 3,
    orderId: "43-4365668",
    country: "Afghanistan",
  },
  {
    companyName: "Shanahan - Boyle",
    productName: "Awesome Wooden Hat",
    sellDate: "11/11/2022",
    inStock: true,
    qty: 32,
    progress: 8,
    rating: 2,
    orderId: "57-4473745",
    country: "Switzerland",
  },
  {
    companyName: "Gutkowski Inc",
    productName: "Small Frozen Tuna",
    sellDate: "15/09/2023",
    inStock: false,
    qty: 218,
    progress: 6,
    rating: 3,
    orderId: "13-4754151",
    country: "Moldova",
  },
  {
    companyName: "Hintz - Boehm",
    productName: "Small Fresh Bacon",
    sellDate: "29/07/2023",
    inStock: true,
    qty: 60,
    progress: 9,
    rating: 4,
    orderId: "60-5125368",
    country: "Norfolk Island",
  },
  {
    companyName: "Durgan - Stamm",
    productName: "Rustic Cotton Ball",
    sellDate: "18/05/2023",
    inStock: false,
    qty: 149,
    progress: 4,
    rating: 1,
    orderId: "46-1576390",
    country: "Faroe Islands",
  },
  {
    companyName: "Carroll Group",
    productName: "Small Rubber Shoes",
    sellDate: "08/03/2023",
    inStock: false,
    qty: 259,
    progress: 0,
    rating: 4,
    orderId: "25-7825975",
    country: "Norfolk Island",
  },
  {
    companyName: "Kreiger and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "05/05/2023",
    inStock: true,
    qty: 381,
    progress: 10,
    rating: 3,
    orderId: "17-6911637",
    country: "Monaco",
  },
  {
    companyName: "Brown LLC",
    productName: "Small Rubber Shoes",
    sellDate: "15/02/2023",
    inStock: true,
    qty: 68,
    progress: 7,
    rating: 3,
    orderId: "36-2806535",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Carroll Group",
    productName: "Small Frozen Tuna",
    sellDate: "21/06/2023",
    inStock: true,
    qty: 425,
    progress: 6,
    rating: 3,
    orderId: "67-4994238",
    country: "Belize",
  },
  {
    companyName: "Russel - Hintz",
    productName: "Rustic Soft Ball",
    sellDate: "31/03/2023",
    inStock: true,
    qty: 197,
    progress: 10,
    rating: 2,
    orderId: "29-1183370",
    country: "Trinidad and Tobago",
  },
  {
    companyName: "Brown LLC",
    productName: "Sleek Wooden Bacon",
    sellDate: "05/01/2023",
    inStock: false,
    qty: 394,
    progress: 1,
    rating: 1,
    orderId: "70-3679258",
    country: "Germany",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Small Fresh Fish",
    sellDate: "05/09/2023",
    inStock: true,
    qty: 450,
    progress: 0,
    rating: 1,
    orderId: "47-4613946",
    country: "Germany",
  },
  {
    companyName: "Kohler LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "16/10/2023",
    inStock: true,
    qty: 203,
    progress: 9,
    rating: 3,
    orderId: "88-7805315",
    country: "Qatar",
  },
  {
    companyName: "Lesch - Jakubowski",
    productName: "Small Frozen Tuna",
    sellDate: "07/05/2023",
    inStock: true,
    qty: 85,
    progress: 7,
    rating: 1,
    orderId: "37-3684940",
    country: "Romania",
  },
  {
    companyName: "Abernathy Inc",
    productName: "Tasty Frozen Table",
    sellDate: "08/07/2023",
    inStock: true,
    qty: 406,
    progress: 1,
    rating: 4,
    orderId: "70-4044402",
    country: "Argentina",
  },
  {
    companyName: "Stehr - Lockman",
    productName: "Small Rubber Shoes",
    sellDate: "20/04/2023",
    inStock: true,
    qty: 155,
    progress: 8,
    rating: 2,
    orderId: "68-5394927",
    country: "United Kingdom",
  },
  {
    companyName: "Kohler LLC",
    productName: "Small Rubber Shoes",
    sellDate: "31/03/2023",
    inStock: false,
    qty: 73,
    progress: 10,
    rating: 3,
    orderId: "69-7959018",
    country: "Tanzania",
  },
  {
    companyName: "Reichert LLC",
    productName: "Small Fresh Bacon",
    sellDate: "27/12/2022",
    inStock: false,
    qty: 390,
    progress: 7,
    rating: 4,
    orderId: "38-9417799",
    country: "Antigua and Barbuda",
  },
  {
    companyName: "Bogan - Daniel",
    productName: "Awesome Wooden Hat",
    sellDate: "14/07/2023",
    inStock: true,
    qty: 437,
    progress: 1,
    rating: 5,
    orderId: "57-6703092",
    country: "Hungary",
  },
  {
    companyName: "Hahn - Welch",
    productName: "Awesome Wooden Hat",
    sellDate: "12/08/2023",
    inStock: true,
    qty: 220,
    progress: 1,
    rating: 3,
    orderId: "86-4204058",
    country: "Guinea-Bissau",
  },
  {
    companyName: "Stehr - Lockman",
    productName: "Tasty Frozen Table",
    sellDate: "13/12/2022",
    inStock: true,
    qty: 17,
    progress: 4,
    rating: 4,
    orderId: "54-7480148",
    country: "Central African Republic",
  },
  {
    companyName: "Dooley and Sons",
    productName: "Small Rubber Shoes",
    sellDate: "12/02/2023",
    inStock: false,
    qty: 430,
    progress: 6,
    rating: 3,
    orderId: "37-8423722",
    country: "United States of America",
  },
  {
    companyName: "Lesch Group",
    productName: "Small Fresh Bacon",
    sellDate: "09/03/2023",
    inStock: false,
    qty: 179,
    progress: 7,
    rating: 4,
    orderId: "57-1894626",
    country: "Angola",
  },
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Rustic Cotton Ball",
    sellDate: "27/08/2023",
    inStock: false,
    qty: 200,
    progress: 5,
    rating: 0,
    orderId: "48-6132485",
    country: "Uruguay",
  },
  {
    companyName: "Lind Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "02/02/2023",
    inStock: true,
    qty: 76,
    progress: 3,
    rating: 1,
    orderId: "38-9650182",
    country: "Somalia",
  },
  {
    companyName: "Kreiger and Sons",
    productName: "Rustic Cotton Ball",
    sellDate: "18/02/2023",
    inStock: false,
    qty: 120,
    progress: 3,
    rating: 1,
    orderId: "21-9411547",
    country: "Faroe Islands",
  },
  {
    companyName: "Upton - Reichert",
    productName: "Sleek Wooden Bacon",
    sellDate: "05/04/2023",
    inStock: false,
    qty: 61,
    progress: 2,
    rating: 1,
    orderId: "94-6877333",
    country: "Somalia",
  },
  {
    companyName: "Jenkins LLC",
    productName: "Small Frozen Tuna",
    sellDate: "13/12/2022",
    inStock: false,
    qty: 444,
    progress: 7,
    rating: 1,
    orderId: "42-5631253",
    country: "Latvia",
  },
  {
    companyName: "Kohler LLC",
    productName: "Tasty Frozen Table",
    sellDate: "30/10/2023",
    inStock: false,
    qty: 71,
    progress: 5,
    rating: 1,
    orderId: "29-1487393",
    country: "Mozambique",
  },
  {
    companyName: "OReilly LLC",
    productName: "Rustic Cotton Ball",
    sellDate: "09/01/2023",
    inStock: false,
    qty: 124,
    progress: 9,
    rating: 0,
    orderId: "69-8473430",
    country: "Canada",
  },
  {
    companyName: "Rath LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "11/08/2023",
    inStock: true,
    qty: 173,
    progress: 5,
    rating: 3,
    orderId: "78-7013182",
    country: "Central African Republic",
  },
  {
    companyName: "Ward Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "19/01/2023",
    inStock: true,
    qty: 498,
    progress: 4,
    rating: 3,
    orderId: "68-1282791",
    country: "Moldova",
  },
  {
    companyName: "Renner - Prosacco",
    productName: "Sleek Wooden Bacon",
    sellDate: "03/10/2023",
    inStock: true,
    qty: 364,
    progress: 4,
    rating: 3,
    orderId: "98-9421614",
    country: "French Southern Territories",
  },
  {
    companyName: "Rath LLC",
    productName: "Small Fresh Bacon",
    sellDate: "14/12/2022",
    inStock: true,
    qty: 143,
    progress: 2,
    rating: 1,
    orderId: "22-3711436",
    country: "Germany",
  },
  {
    companyName: "Shanahan - Boyle",
    productName: "Small Rubber Shoes",
    sellDate: "30/06/2023",
    inStock: true,
    qty: 407,
    progress: 8,
    rating: 1,
    orderId: "60-1526543",
    country: "Wallis and Futuna",
  },
  {
    companyName: "Lesch and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "22/01/2023",
    inStock: false,
    qty: 457,
    progress: 9,
    rating: 5,
    orderId: "21-3691766",
    country: "Slovakia (Slovak Republic)",
  },
  {
    companyName: "Abernathy Inc",
    productName: "Small Frozen Tuna",
    sellDate: "10/06/2023",
    inStock: true,
    qty: 45,
    progress: 9,
    rating: 2,
    orderId: "65-1490570",
    country: "Montserrat",
  },
  {
    companyName: "Kreiger and Sons",
    productName: "Rustic Cotton Ball",
    sellDate: "05/08/2023",
    inStock: false,
    qty: 440,
    progress: 7,
    rating: 0,
    orderId: "15-8247044",
    country: "United States of America",
  },
  {
    companyName: "Carroll Group",
    productName: "Rustic Soft Ball",
    sellDate: "06/12/2022",
    inStock: true,
    qty: 81,
    progress: 2,
    rating: 4,
    orderId: "11-5766507",
    country: "French Southern Territories",
  },
  {
    companyName: "Abernathy Inc",
    productName: "Rustic Soft Ball",
    sellDate: "05/03/2023",
    inStock: false,
    qty: 123,
    progress: 7,
    rating: 0,
    orderId: "57-6411557",
    country: "Cyprus",
  },
  {
    companyName: "Hills and Sons",
    productName: "Rustic Soft Ball",
    sellDate: "07/09/2023",
    inStock: false,
    qty: 317,
    progress: 6,
    rating: 3,
    orderId: "35-1269275",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Kreiger and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "03/03/2023",
    inStock: false,
    qty: 135,
    progress: 4,
    rating: 2,
    orderId: "90-5821903",
    country: "Chile",
  },
  {
    companyName: "Wilkinson - Dare",
    productName: "Rustic Soft Ball",
    sellDate: "17/12/2022",
    inStock: false,
    qty: 195,
    progress: 3,
    rating: 1,
    orderId: "28-7679665",
    country: "Albania",
  },
  {
    companyName: "Weber Inc",
    productName: "Small Fresh Fish",
    sellDate: "11/02/2023",
    inStock: false,
    qty: 288,
    progress: 4,
    rating: 0,
    orderId: "89-1703562",
    country: "Puerto Rico",
  },
  {
    companyName: "Lesch - Carter",
    productName: "Tasty Frozen Table",
    sellDate: "13/09/2023",
    inStock: true,
    qty: 493,
    progress: 0,
    rating: 4,
    orderId: "45-4349946",
    country: "Bahrain",
  },
  {
    companyName: "Luettgen Inc",
    productName: "Small Rubber Shoes",
    sellDate: "29/07/2023",
    inStock: false,
    qty: 271,
    progress: 7,
    rating: 3,
    orderId: "38-8700587",
    country: "Somalia",
  },
  {
    companyName: "Hintz - Boehm",
    productName: "Small Fresh Bacon",
    sellDate: "10/07/2023",
    inStock: true,
    qty: 176,
    progress: 1,
    rating: 5,
    orderId: "76-8251029",
    country: "Switzerland",
  },
  {
    companyName: "Kohler LLC",
    productName: "Small Fresh Bacon",
    sellDate: "06/05/2023",
    inStock: true,
    qty: 408,
    progress: 9,
    rating: 5,
    orderId: "58-5018545",
    country: "Moldova",
  },
  {
    companyName: "Labadie LLC",
    productName: "Small Rubber Shoes",
    sellDate: "12/02/2023",
    inStock: true,
    qty: 38,
    progress: 9,
    rating: 3,
    orderId: "15-7303333",
    country: "Sierra Leone",
  },
];

const countries = [
  "United Kingdom",
  "Norfolk Island",
  "United States of America",
  "Liechtenstein",
  "France",
  "Senegal",
  "Belize",
  "New Caledonia",
  "Canada",
  "Mauritius",
  "Albania",
  "Brazil",
  "Uruguay",
  "Comoros",
  "French Southern Territories",
  "Saint Martin",
  "Nauru",
  "Nigeria",
  "Burkina Faso",
  "Moldova",
  "Azerbaijan",
  "Croatia",
  "Mongolia",
  "Tunisia",
  "Vanuatu",
  "Romania",
  "Qatar",
  "Peru",
  "Angola",
  "Iran",
  "Indonesia",
  "Germany",
  "Latvia",
  "Central African Republic",
  "Cocos (Keeling) Islands",
  "Ethiopia",
  "Belarus",
  "Montenegro",
  "Montserrat",
  "Sri Lanka",
  "Argentina",
  "Pitcairn Islands",
  "Macao",
  "Monaco",
  "Russian Federation",
  "Chile",
  "Burundi",
  "Slovakia (Slovak Republic)",
  "Ecuador",
  "Sierra Leone",
  "Switzerland",
  "Tanzania",
  "Virgin Islands, U.S.",
  "Puerto Rico",
  "Christmas Island",
  "Greece",
  "Guinea-Bissau",
  "Afghanistan",
  "Tajikistan",
  "Somalia",
  "Mayotte",
  "Cyprus",
  "Paraguay",
  "Wallis and Futuna",
  "Estonia",
  "Mozambique",
  "Antigua and Barbuda",
  "Trinidad and Tobago",
  "Hungary",
];

const addClassWhenNeeded = (td, cellProperties) => {
  const className = cellProperties.className;

  if (className !== void 0) {
    Handsontable.dom.addClass(td, className);
  }
};

export function progressBarRenderer(
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  const div = document.createElement("div");

  div.style.width = `${value * 10}px`;
  div.ariaLabel = `${value * 10}%`;

  addClassWhenNeeded(td, cellProperties);
  Handsontable.dom.addClass(div, "progressBar");
  Handsontable.dom.empty(td);

  td.appendChild(div);
}

export function starRenderer(
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  const div = document.createElement("div");
  div.textContent = "★".repeat(value);
  div.ariaLabel = `${value}`;
  Handsontable.dom.addClass(div, "stars");
  Handsontable.dom.empty(td);

  td.appendChild(div);
}

export const SELECTED_CLASS = "selected";
export const ODD_ROW_CLASS = "odd";

const headerAlignments = new Map([
  ["9", "htCenter"],
  ["10", "htRight"],
  ["12", "htCenter"],
]);

export function addClassesToRows(TD, row, column, prop, value, cellProperties) {
  // Adding classes to `TR` just while rendering first visible `TD` element
  if (column !== 0) {
    return;
  }

  const parentElement = TD.parentElement;

  if (parentElement === null) {
    return;
  }

  // Add class to selected rows
  if (cellProperties.instance.getDataAtRowProp(row, "0")) {
    Handsontable.dom.addClass(parentElement, SELECTED_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, SELECTED_CLASS);
  }

  // Add class to odd TRs
  if (row % 2 === 0) {
    Handsontable.dom.addClass(parentElement, ODD_ROW_CLASS);
  } else {
    Handsontable.dom.removeClass(parentElement, ODD_ROW_CLASS);
  }
}

export function alignHeaders(column, TH) {
  if (column < 0) {
    return;
  }

  if (TH.firstChild) {
    const alignmentClass = this.isRtl() ? "htRight" : "htLeft";

    if (headerAlignments.has(column.toString())) {
      Handsontable.dom.removeClass(TH.firstChild, alignmentClass);
      Handsontable.dom.addClass(
        TH.firstChild,
        headerAlignments.get(column.toString())
      );
    } else {
      Handsontable.dom.addClass(TH.firstChild, alignmentClass);
    }
  }
}

// Get the DOM element with the ID 'handsontable' where the Handsontable will be rendered
const app = document.getElementById("handsontable");

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 90, 90, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Progress",
    "Rating",
    "Order ID",
    "Country",
  ],
  columns: [
    { data: "companyName", type: "text" },
    { data: "productName", type: "text" },
    {
      data: "sellDate",
      type: "date",
      allowInvalid: false,
    },
    {
      data: "inStock",
      type: "checkbox",
      className: "htCenter",
    },
    { data: "qty", type: "numeric" },
    {
      data: "progress",
      renderer: progressBarRenderer,
      readOnly: true,
      className: "htMiddle",
    },
    {
      data: "rating",
      renderer: starRenderer,
      readOnly: true,
      className: "star htCenter",
    },
    {
      data: "orderId",
      type: "text",
    },
    {
      data: "country",
      type: "dropdown",
      source: countries,
    },
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  contextMenu: true,
  navigableHeaders: true, // new a11y
  disableTabNavigation: false, // new a11y
  autoWrapRow: true,
  autoWrapCol: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  nestedRows: true,
  afterGetColHeader: alignHeaders,
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation",
};

// Initialize the Handsontable instance with the specified configuration options
let hotInstance = new Handsontable(app, hotOptions);

// Helper function to set up checkbox event handling
export const setupCheckbox = (element, callback) =>
  element.addEventListener("click", (clickEvent) => callback(element.checked));

// Set up event listeners for various checkboxes to update Handsontable settings
setupCheckbox(document.querySelector("#enableTabNavigation"), (checked) => {
  hotOptions.disableTabNavigation = !checked;
  hotInstance.updateSettings({
    disableTabNavigation: hotOptions.disableTabNavigation,
  });
  console.log(
    `Updated setting: disableTabNavigation to`,
    hotInstance.getSettings().disableTabNavigation
  );
});

setupCheckbox(document.querySelector("#enableHeaderNavigation"), (checked) => {
  hotOptions.navigableHeaders = checked;
  hotInstance.updateSettings({
    navigableHeaders: hotOptions.navigableHeaders,
  });
  console.log(
    `Updated setting: navigableHeaders to`,
    hotInstance.getSettings().navigableHeaders
  );
});

setupCheckbox(
  document.querySelector("#enableCellVirtualization"),
  (checked) => {
    hotInstance.destroy();
    hotInstance = new Handsontable(document.getElementById("handsontable"), {
      ...hotOptions,
      renderAllRows: !checked,
      viewportColumnRenderingOffset: checked ? "auto" : 9,
    });
    console.log(
      `Updated setting: renderAllRows to`,
      hotInstance.getSettings().renderAllRows
    );
  }
);

setupCheckbox(document.querySelector("#enableCellEnterEditing"), (checked) => {
  hotOptions.enterBeginsEditing = checked;
  hotInstance.updateSettings({
    enterBeginsEditing: hotOptions.enterBeginsEditing,
  });
  console.log(
    `Updated setting: enableCellEnterEditing to`,
    hotInstance.getSettings().enterBeginsEditing
  );
});

setupCheckbox(
  document.querySelector("#enableArrowRLFirstLastColumn"),
  (checked) => {
    hotOptions.autoWrapRow = checked;
    hotInstance.updateSettings({
      autoWrapRow: hotOptions.autoWrapRow,
    });
    console.log(
      `Updated setting: autoWrapRow to`,
      hotInstance.getSettings().autoWrapRow
    );
  }
);

setupCheckbox(
  document.querySelector("#enableArrowTDFirstLastColumn"),
  (checked) => {
    hotOptions.autoWrapCol = checked;
    hotInstance.updateSettings({
      autoWrapCol: hotOptions.autoWrapCol,
    });
    console.log(
      `Updated setting: autoWrapCol to`,
      hotInstance.getSettings().autoWrapCol
    );
  }
);

setupCheckbox(document.querySelector("#enableEnterFocusEditing"), (checked) => {
  hotOptions.enterMoves = checked ? { col: 0, row: 1 } : { col: 0, row: 0 };
  hotInstance.updateSettings({
    enterMoves: hotOptions.enterMoves,
  });
  console.log(
    `Updated setting: enterMoves to`,
    hotInstance.getSettings().enterMoves
  );
});

```
:::
### Handsontable configuration options 
Each feature within Handsontable is designed to accommodate specific needs. Below, we show key configuration options that offer flexibility and control over the grid's behavior. 
| Option                                                                                          | Definition                                                                                                                                                                                                                                                                                                   |
|:------------------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`navigableHeaders`](@/api/options.md#navigableheaders)                                         | The `navigableHeaders` option enables keyboard navigation across row and column headers using <kbd>Arrow keys</kbd> or <kbd>Tab</kbd> keys. <br><br> Default: `false`                                                                                                                                                                         |
| [`tabMoves`](@/api/options.md#tabmoves)                                                         | The `tabMoves` option sets the cell movement behavior for pressing the <kbd>Tab</kbd> key in a grid, allowing specification of the number of rows and columns to navigate, which can be defined using an object or a function.                <br><br>Default: `{row: 0, col: 1}`                                          |
| [`enterMoves`](@/api/options.md#entermoves)                                                     | The `enterMoves` option defines the navigation behavior upon pressing the <kbd>Enter</kbd> key in a grid, dictating the number of columns and rows the selection moves, which can be customized with an object or function, especially in relation to the `enterBeginsEditing` setting. <br><br> Default: `{col: 0, row: 1}`|
| [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)                                     | The `enterBeginsEditing` option controls if pressing <kbd>Enter</kbd> key once starts editing the active cell (`true`, default) or moves to the next cell according to `enterMoves` settings (`false`). <br><br> Default: `true`                                                                                             |
| [`autoWrapCol`](@/api/options.md#autowrapcol)                                                   | The `autoWrapCol` option toggles vertical wrapping in a grid, where pressing <kbd>↓</kbd> in the bottom-most cell moves to the top cell of the next column and pressing <kbd>↑</kbd> in the top-most cell moves to the bottom cell of the previous column.  <br><br> Default: `false`                                                   |
| [`autoWrapRow`](@/api/options.md#autowraprow)                                                   | The `autoWrapRow` option enables or disables wrapping the selection from the first cell to the last of the previous row and from the last cell to the first of the next row when navigating with arrow keys.   <br><br> Default: `false`                                                                          |
| [`renderAllRows`](@/api/options.md#renderallrows)                                               | The `renderAllRows` option determines if row virtualization is turned off (`true`) to render all rows simultaneously, or turned on (`false`, default) to render rows efficiently as needed.           <br><br> Default: `false`                                                                                   |
| [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)               | The `viewportColumnRenderingOffset` option sets the quantity of columns that Handsontable pre-renders outside the visible grid area, with `auto` for automatic calculation or a specific number for manual configuration.  <br><br> Default: `auto`                                                               |

## High-contrast theme
It's essential to make content easy to read and distinguish, particularly for users with visual impairments. High contrast between elements improves readability and user comfort during prolonged interaction. The recommended [minimum contrast ratio](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum) for text against images or backgrounds is 4.5:1. To achieve this level of contrast with the default theme of Handsontable, you need to adjust it according to your end-users' needs by doing the following:

* Override the grid's CSS with your own attributes.
* Use third-party software, such as the [High Contrast](https://chrome.google.com/webstore/detail/high-contrast/djcfdncoelnlbldjfhinnjlhdjlikmph) extension offered by Google for Chrome.

## Requirements for the developers

When you customize Handsontable, it's you who is responsible for ensuring the accessibility of your solution. Especially when you create [custom cell type](@/guides/cell-types/cell-type.md) or [custom plugin](@/guides/tools-and-building/custom-plugins.md), remember about making them accessible to everyone.

Our recommendations for custom development:

- Test your code against WCAG 2.1 requirements regulary.
- Use proper color contrast, font size, and semantic HTML.
- If needed, implement additional WAI-ARIA attributes.
- Avoid flashing or blinking content.
- Test your customizations with real users who have different types of disabilities. If you don’t have access to real users, try [Funkify](https://www.funkify.org/), a disability simulator, which can help you step into disabled users' shoes.

::: tip

 The accessibility level of any component in your application may be decreased by a low accessibility level of the elements surrounding it. For this reason, make sure to always check the accessibility of the entire application, using tools such as [Lighthouse](https://developers.google.com/web/tools/lighthouse).

:::

## Accessibility testing

We make sure our data grid remains accessible by taking the following steps:

- We check Handsontable's accessibility score with a range of accessibility testing tools.
- We use automated visual regression testing.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated unit and end-to-end tests.

## Known limitations
   - **Screen readers with frozen rows/columns:** Some screen readers may incorrectly read the number of rows and columns when frozen rows and columns are enabled.
   - **Dynamic ARIA attributes:** Dynamic ARIA attributes are sometimes ommited by screen readers.
   - **Access to actions:** Access to certain actions may require custom menu items; for example, sorting data in spreadsheet mode where headers are non-navigable, moving a column or row, resizing a column or row, and renaming a header name.

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks.md)
related to accessibility, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`disableTabNavigation`](@/api/options.md#disabletabnavigation)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`renderAllRows`](@/api/options.md#renderallrows)
- [`tabMoves`](@/api/options.md#tabmoves)
- [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
- [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)

## Troubleshooting

Try the following links if you didn't find what you need:
- [View related topics](https://github.com/handsontable/handsontable/labels/Accessibility) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help