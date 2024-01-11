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

- Keyboard navigation that lets you use the grid without a mouse.
- Support for the most popular screen readers.
- Flexible API to configure keyboard shortcuts and navigation methods.

## Conformance with standards

Most global standards and regulations are created in accordance with WCAG (Web Content Accessibility Guidelines).
Handsontable meets requirements outlined in the [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) guidelines,
which makes it compatible with most local standards, such as:

| <div style="width:365px">Region</div> | Standards                                                                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| USA                                   | [Section 508 of the US Rehabilitation Act](https://www.section508.gov/)<br>[Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)                                  |
| Europe                                | [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)<br>[Web Accessibility Directive (WAD)](https://eur-lex.europa.eu/legal-content/EN/LSU/?uri=CELEX:32016L2102) |
| Canada                                | [Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601)                                                                                                         |

## Keyboard navigation

Handsontable doesn't require a mouse to navigate across the grid's elements. This is an important feature for those users with temporary or permanent motor impairments for whom following the mouse cursor is difficult. Keyboard navigation is also a great way to improve productivity, which is why many users choose the keyboard over the mouse regardless of their accessibility needs.

Our experience with hundreds of implementations shows that Handsontable tends to be used either as a **spreadsheet application** or a **data grid component**. While at first the difference seems subtle, it significantly impacts user expectations regarding navigation.

In a typical spreadsheet application (think of Microsoft Excel or Google Sheets), you can't move the focus onto headers. This makes it difficult to sort or filter data without knowing complex [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md). Additionally, opening a [column menu](@/guides/columns/column-menu.md) is not trivial.
Handsontable offers flexibility in this regard, allowing users to switch between data grid and spreadsheet "modes". To do that switch, you can use a combination of two options: [`navigableHeaders`](@/api/options.md#navigableheaders) to enable or disable moving focus onto headers, and [`tabNavigation`](@/api/options.md#tabnavigation) to decide if the <kbd>**Tab**</kbd> key can be used to navigate across cells and headers.

The following table provides more details about these two scenarios:
 
| Aspect                    | Data grid mode                                                                                                                                                                                                                                          | Spreadsheet mode (default)                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration             | [`navigableHeaders: true`](@/api/options.md#navigableheaders) <br>  [`tabNavigation: false`](@/api/options.md#tabnavigation)                                                                                                                            | [`navigableHeaders: false`](@/api/options.md#navigableheaders) <br> [`tabNavigation: true`](@/api/options.md#tabnavigation)                                                                             |
| Primary navigation method | Arrow keys                                                                                                                                                                                                                                              | <kbd>**Tab**</kbd> / <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>                                                                                                                                            |
| Navigable headers         | Yes                                                                                                                                                                                                                                                     | No                                                                                                                                                                                                      |
| Navigation                | Use the arrow keys navigate across the grid. Use simple shortcuts such as <kbd>**Enter**</kbd> or <kbd>**Space**</kbd> to open menus or interact with headers, cells, or cell editors. <br><br>You can't use the <kbd>**Tab**</kbd> key for navigation. | Use <kbd>**Tab**</kbd> / <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> to navigate across the grid.<br>This behavior is similar to Excel or Google Sheets. <br><br>To open menus, use more complex shortcuts. |
| Focus order               | One tab stop: the grid is included in the page tab sequence only once.                                                                                                                                                                                  | Multiple tab stops: all tabbable elements of the grid, such as cells or headers, are included in the page tab sequence.                                                                                 |

## Navigation shortcuts

Handsontable provides a wide range of [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts.md), but some of them are particularly important for users who navigate the grid with the keyboard only. For example, actions triggered while navigating across headers involve simple key combinations, making them intuitive and useful. For more complex scenarios, you can [customize the shortcuts keys](@/guides/navigation/custom-shortcuts.md) through the API.

| Windows                                                                                                 | macOS                                                                                                  | Action              | Focused element |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- | --------------- |
| <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd>                                                | <kbd>**Shift**</kbd>+<kbd>**Option**</kbd>+<kbd>**↓**</kbd>                                            | Open a column menu  | Any cell        |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                                                                | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                                                                | Open a column menu  | Column header   |
| <kbd>**Enter**</kbd>                                                                                    | <kbd>**Enter**</kbd>                                                                                   | Sort data           | Column header   |
| <kbd>**Alt**</kbd>+<kbd>**A**</kbd>                                                                     | <kbd>**Option**</kbd>+<kbd>**A**</kbd>                                                                 | Clear filters       | Any cell        |
| <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                                                                | <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>*                                                              | Select a column     | Any cell        |
| <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                               | <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                              | Select a row        | Any cell        |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> <br> <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> <br> <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | Open a context menu | Any cell        |

*To use this shortcut, disable the default macOS behavior for the <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd> key combination, under **System Settings** > **Keyboard** > **Keyboard Shortcuts** > **Input Sources**.

## Support for screen readers

Although semantic HTML doesn't need any additional attributes to be properly interpreted by assistive technologies, some of Handsontable's complex features are not fully covered by the HTML specification. That's why Handsontable provides support for screen readers with ARIA attributes (Accessible Rich Internet Applications) applied to its HTML markup.

Each new version of Handsontable is thoroughly tested for accessibility with the following screen readers:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)

## Accessible data grid demo

Check out the interactive demo below to see how various Handsontable settings impact its accessibility level and affect the user experience.

::: only-for javascript angular vue

::: example #example1 --html 1 --css 2 --js 3

```html
<div class="example-container">
  <div class="checkbox-container">
    <div class="checkbox-group">
      <div>
        <label
          class="option-label"
          for="enable-tab-navigation"
          id="tab-navigation-label"
          ><input
            checked
            type="checkbox"
            id="enable-tab-navigation"
            name="enable-tab-navigation"
            aria-labelledby="tab-navigation-label"
          />
          Enable navigation with the Tab key
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#tabnavigation"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more enabling/disabling tab navigation (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
      <div>
        <label
          class="option-label"
          for="enable-header-navigation"
          id="header-navigation-label"
        >
          <input
            checked
            type="checkbox"
            id="enable-header-navigation"
            name="enable-header-navigation"
            aria-labelledby="header-navigation-label"
          />
          Enable navigation across headers
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#navigableheaders"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more about enabling/disabling tab navigation across headers (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
      <div>
        <label
          class="option-label"
          for="enable-cell-virtualization"
          id="cell-virtualization-label"
        >
          <input
            checked
            type="checkbox"
            id="enable-cell-virtualization"
            name="enable-cell-virtualization"
            aria-labelledby="cell-virtualization-label"
          />
          Enable cells virtualization
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#renderAllRows"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more about row virtualization (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
      <div>
        <label
          class="option-label"
          for="enable-cell-enter-editing"
          id="cell-enter-editing-label"
          ><input
            checked
            type="checkbox"
            id="enable-cell-enter-editing"
            name="enable-cell-enter-editing"
            aria-labelledby="cell-enter-editing-label"
          />
          The Enter key begins cell editing
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#enterbeginsediting"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more about Enter key cell editing (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
    </div>
    <div class="checkbox-group">
      <div>
        <label
          class="option-label"
          for="enable-arrow-rl-first-last-column"
          id="arrow-rl-first-last-column-label"
          ><input
            checked
            type="checkbox"
            id="enable-arrow-rl-first-last-column"
            name="enable-arrow-first-last-column"
            aria-labelledby="arrow-rl-first-last-column-label"
          />
          The right/left arrow keys move the focus to the first/last column
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#autowrapcol"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more about right/left arrow key behavior (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
      <div>
        <label
          class="option-label"
          for="enable-arrow-td-first-last-column"
          id="arrow-td-first-last-column-label"
        >
          <input
            checked
            type="checkbox"
            id="enable-arrow-td-first-last-column"
            name="enable-arrow-td-first-last-column"
            aria-labelledby="arrow-td-first-last-column-label"
          />
          The up/down arrow keys move the focus to the first/last row
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#autowraprow"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more about up/down arrow key behavior (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
      <div>
        <label
          class="option-label"
          for="enable-enter-focus-editing"
          id="enter-focus-editing-label"
        >
          <input
            checked
            type="checkbox"
            id="enable-enter-focus-editing"
            name="enable-enter-focus-editing"
            aria-labelledby="enter-focus-editing-label"
          />
          The Enter key moves the focus after cell edition
        </label>
        <a
          href="https://handsontable.com/docs/javascript-data-grid/api/options/#entermoves"
          target="_blank"
          class="external-link"
          rel="noopener noreferrer"
          aria-label="Learn more about Enter key focus behavior (opens in a new window)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            width="15"
            height="15"
            class="icon outbound"
          >
            <path
              fill="currentColor"
              d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
            ></path>
            <polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            ></polygon>
          </svg>
        </a>
      </div>
    </div>
  </div>

  <input
    class="placeholder-input"
    type="text"
    placeholder="Focusable text input"
  />

  <div id="example1"></div>

  <input
    class="placeholder-input"
    type="text"
    placeholder="Focusable text input"
  />
</div>
```

```css
.checkbox-container {
  padding-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group > div {
  display: flex;
}

.checkbox-group > div > label {
  display: flex;
  gap: 0.2rem;
}

.external-link {
  margin-left: 0.5rem;
  position: relative;
  top: 2px;
  color: black;
}

.external-link:hover {
  color: #0000ee;
}

.placeholder-input {
  max-width: 20rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: black;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
}

.option-label {
  align-items: flex-start;
}

/* 
  We want the focus to be around input and label, in order to achieve this,
  we remove focus from the input and add it to the label (wrapper in this case)
  we then use the :focus-within pseudo class plus native focus styles
  https://css-tricks.com/copy-the-browsers-native-focus-styles/
*/
.option-label:focus-within {
  outline: 5px auto Highlight;
  outline: 5px auto -webkit-focus-ring-color;
}

.option-label > input:focus {
  outline: none;
}

/* fixes dark theme conflicting with text color */
html.theme-dark .option-label {
  color: #e5ebf1 !important;
}

.example-container {
  gap: 1rem;
  display: flex;
  flex-direction: column;
}
```

```js

  /* start:skip-in-preview */
const data = [
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Rustic Soft Ball",
    sellDate: "05/07/2023",
    inStock: false,
    qty: 82,
    orderId: "16-3974628",
    country: "United Kingdom",
  },
  {
    companyName: "Rath LLC",
    productName: "Small Frozen Tuna",
    sellDate: "31/05/2023",
    inStock: false,
    qty: 459,
    orderId: "77-7839351",
    country: "Costa Rica",
  },
  {
    companyName: "Reichert LLC",
    productName: "Rustic Soft Ball",
    sellDate: "16/03/2023",
    inStock: false,
    qty: 318,
    orderId: "75-6343150",
    country: "United States of America",
  },
  {
    companyName: "Kozey Inc",
    productName: "Sleek Wooden Bacon",
    sellDate: "24/04/2023",
    inStock: true,
    qty: 177,
    orderId: "56-3608689",
    country: "Pitcairn Islands",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Awesome Wooden Hat",
    sellDate: "29/04/2023",
    inStock: true,
    qty: 51,
    orderId: "58-1204318",
    country: "Argentina",
  },
  {
    companyName: "Gerhold - Rowe",
    productName: "Tasty Frozen Table",
    sellDate: "27/03/2023",
    inStock: false,
    qty: 439,
    orderId: "62-6066132",
    country: "Senegal",
  },
  {
    companyName: "Rath LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "24/11/2022",
    inStock: false,
    qty: 493,
    orderId: "76-7785471",
    country: "Cyprus",
  },
  {
    companyName: "Kozey Inc",
    productName: "Rustic Soft Ball",
    sellDate: "11/08/2023",
    inStock: false,
    qty: 225,
    orderId: "34-3551159",
    country: "Saint Martin",
  },
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Awesome Wooden Hat",
    sellDate: "07/02/2023",
    inStock: false,
    qty: 261,
    orderId: "77-1112514",
    country: "Chile",
  },
  {
    companyName: "Hegmann Inc",
    productName: "Tasty Frozen Table",
    sellDate: "06/05/2023",
    inStock: false,
    qty: 439,
    orderId: "12-3252385",
    country: "Switzerland",
  },
  {
    companyName: "Weber Inc",
    productName: "Awesome Wooden Hat",
    sellDate: "22/04/2023",
    inStock: true,
    qty: 235,
    orderId: "71-7639998",
    country: "Brazil",
  },
  {
    companyName: "Jacobi - Kutch",
    productName: "Sleek Wooden Bacon",
    sellDate: "13/12/2022",
    inStock: true,
    qty: 163,
    orderId: "68-1588829",
    country: "Burkina Faso",
  },
  {
    companyName: "Jenkins LLC",
    productName: "Small Rubber Shoes",
    sellDate: "26/03/2023",
    inStock: true,
    qty: 8,
    orderId: "61-6324553",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Koepp and Sons",
    productName: "Sleek Wooden Bacon",
    sellDate: "04/05/2023",
    inStock: true,
    qty: 355,
    orderId: "74-6985005",
    country: "Mozambique",
  },
  {
    companyName: "Doyle Group",
    productName: "Awesome Wooden Hat",
    sellDate: "01/08/2023",
    inStock: false,
    qty: 186,
    orderId: "84-4370131",
    country: "Cocos (Keeling) Islands",
  },
  {
    companyName: "Rempel - Durgan",
    productName: "Tasty Frozen Table",
    sellDate: "30/09/2023",
    inStock: false,
    qty: 284,
    orderId: "13-6461825",
    country: "Monaco",
  },
  {
    companyName: "Lesch - Jakubowski",
    productName: "Small Fresh Bacon",
    sellDate: "26/09/2023",
    inStock: true,
    qty: 492,
    orderId: "13-9465439",
    country: "Iran",
  },
  {
    companyName: "Jacobi - Kutch",
    productName: "Rustic Cotton Ball",
    sellDate: "04/05/2023",
    inStock: true,
    qty: 300,
    orderId: "76-5194058",
    country: "Indonesia",
  },
  {
    companyName: "Gerhold - Rowe",
    productName: "Rustic Cotton Ball",
    sellDate: "07/07/2023",
    inStock: true,
    qty: 493,
    orderId: "61-8600792",
    country: "Norfolk Island",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Small Fresh Fish",
    sellDate: "14/07/2023",
    inStock: false,
    qty: 304,
    orderId: "10-6007287",
    country: "Romania",
  },
  {
    companyName: "Gutkowski Inc",
    productName: "Small Fresh Bacon",
    sellDate: "10/01/2023",
    inStock: true,
    qty: 375,
    orderId: "25-1164132",
    country: "Afghanistan",
  },
  {
    companyName: "Koepp and Sons",
    productName: "Small Fresh Fish",
    sellDate: "30/03/2023",
    inStock: false,
    qty: 365,
    orderId: "75-7975820",
    country: "Germany",
  },
  {
    companyName: "Zboncak and Sons",
    productName: "Small Fresh Fish",
    sellDate: "17/08/2023",
    inStock: false,
    qty: 308,
    orderId: "59-6251875",
    country: "Tajikistan",
  },
  {
    companyName: "Mills Group",
    productName: "Rustic Soft Ball",
    sellDate: "30/09/2023",
    inStock: false,
    qty: 191,
    orderId: "67-7521441",
    country: "Puerto Rico",
  },
  {
    companyName: "Zboncak and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "18/03/2023",
    inStock: false,
    qty: 208,
    orderId: "19-4264192",
    country: "Bolivia",
  },
  {
    companyName: "Rath LLC",
    productName: "Rustic Soft Ball",
    sellDate: "14/06/2023",
    inStock: true,
    qty: 191,
    orderId: "78-5742060",
    country: "Benin",
  },
  {
    companyName: "Upton - Reichert",
    productName: "Tasty Frozen Table",
    sellDate: "27/02/2023",
    inStock: false,
    qty: 45,
    orderId: "26-6191298",
    country: "Tunisia",
  },
  {
    companyName: "Carroll Group",
    productName: "Rustic Soft Ball",
    sellDate: "12/12/2022",
    inStock: true,
    qty: 385,
    orderId: "13-7828353",
    country: "French Southern Territories",
  },
  {
    companyName: "Reichel Group",
    productName: "Small Frozen Tuna",
    sellDate: "12/12/2022",
    inStock: true,
    qty: 117,
    orderId: "67-9643738",
    country: "Mongolia",
  },
  {
    companyName: "Kozey Inc",
    productName: "Rustic Soft Ball",
    sellDate: "24/03/2023",
    inStock: false,
    qty: 335,
    orderId: "78-1331653",
    country: "Angola",
  },
  {
    companyName: "Brown LLC",
    productName: "Small Rubber Shoes",
    sellDate: "13/06/2023",
    inStock: true,
    qty: 305,
    orderId: "63-2315723",
    country: "French Southern Territories",
  },
  {
    companyName: "Weber Inc",
    productName: "Rustic Cotton Ball",
    sellDate: "07/09/2023",
    inStock: true,
    qty: 409,
    orderId: "53-6782557",
    country: "Indonesia",
  },
  {
    companyName: "OReilly LLC",
    productName: "Tasty Frozen Table",
    sellDate: "18/05/2023",
    inStock: true,
    qty: 318,
    orderId: "91-7787675",
    country: "Mayotte",
  },
  {
    companyName: "Weber Inc",
    productName: "Sleek Wooden Bacon",
    sellDate: "20/04/2023",
    inStock: false,
    qty: 234,
    orderId: "41-3560672",
    country: "Switzerland",
  },
  {
    companyName: "Hodkiewicz Inc",
    productName: "Tasty Frozen Table",
    sellDate: "19/10/2023",
    inStock: true,
    qty: 136,
    orderId: "48-6028776",
    country: "Peru",
  },
  {
    companyName: "Lesch and Sons",
    productName: "Rustic Cotton Ball",
    sellDate: "29/09/2023",
    inStock: false,
    qty: 187,
    orderId: "84-3770456",
    country: "Central African Republic",
  },
  {
    companyName: "Pouros - Brakus",
    productName: "Small Frozen Tuna",
    sellDate: "29/01/2023",
    inStock: false,
    qty: 350,
    orderId: "08-4844950",
    country: "Isle of Man",
  },
  {
    companyName: "Batz - Rice",
    productName: "Small Rubber Shoes",
    sellDate: "06/11/2023",
    inStock: false,
    qty: 252,
    orderId: "88-4899852",
    country: "Burundi",
  },
  {
    companyName: "Kub Inc",
    productName: "Small Fresh Fish",
    sellDate: "05/09/2023",
    inStock: true,
    qty: 306,
    orderId: "06-5022461",
    country: "Mauritius",
  },
  {
    companyName: "Hills and Sons",
    productName: "Small Frozen Tuna",
    sellDate: "07/11/2023",
    inStock: false,
    qty: 435,
    orderId: "99-5539911",
    country: "Somalia",
  },
  {
    companyName: "Shanahan - Boyle",
    productName: "Small Frozen Tuna",
    sellDate: "19/06/2023",
    inStock: true,
    qty: 171,
    orderId: "82-8162453",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Luettgen Inc",
    productName: "Awesome Wooden Hat",
    sellDate: "30/09/2023",
    inStock: false,
    qty: 6,
    orderId: "02-8118250",
    country: "Colombia",
  },
  {
    companyName: "Hegmann Inc",
    productName: "Small Rubber Shoes",
    sellDate: "16/02/2023",
    inStock: true,
    qty: 278,
    orderId: "07-9773343",
    country: "Central African Republic",
  },
  {
    companyName: "Kub Inc",
    productName: "Small Frozen Tuna",
    sellDate: "08/08/2023",
    inStock: false,
    qty: 264,
    orderId: "66-4470479",
    country: "Norfolk Island",
  },
  {
    companyName: "Kub Inc",
    productName: "Tasty Frozen Table",
    sellDate: "06/06/2023",
    inStock: true,
    qty: 494,
    orderId: "13-1175339",
    country: "Liechtenstein",
  },
  {
    companyName: "Hahn - Welch",
    productName: "Small Frozen Tuna",
    sellDate: "12/06/2023",
    inStock: false,
    qty: 485,
    orderId: "32-9127309",
    country: "Bahrain",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Small Frozen Tuna",
    sellDate: "08/04/2023",
    inStock: true,
    qty: 332,
    orderId: "41-3774568",
    country: "Montserrat",
  },
  {
    companyName: "Crona and Sons",
    productName: "Small Fresh Bacon",
    sellDate: "21/06/2023",
    inStock: true,
    qty: 104,
    orderId: "48-9995090",
    country: "Syrian Arab Republic",
  },
  {
    companyName: "Lind Group",
    productName: "Rustic Cotton Ball",
    sellDate: "17/08/2023",
    inStock: false,
    qty: 51,
    orderId: "68-9599400",
    country: "Czech Republic",
  },
  {
    companyName: "Labadie LLC",
    productName: "Small Fresh Bacon",
    sellDate: "20/04/2023",
    inStock: true,
    qty: 155,
    orderId: "52-4334332",
    country: "Croatia",
  },
  {
    companyName: "Doyle Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "23/07/2023",
    inStock: false,
    qty: 465,
    orderId: "63-8894526",
    country: "Indonesia",
  },
];

const countries = data.reduce((acc, curr) => {
  if (acc.includes(curr.country)) {
    return acc;
  }
  return [...acc, curr.country];
}, []);


/* end:skip-in-preview */

// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const app = document.getElementById("example1");

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Order ID",
    "Country",
  ],
  columns: [
    { data: "companyName", type: "text" },
    { data: "productName", type: "text" },
    {
      data: "sellDate",
      type: "date",
      dateFormat: "DD/MM/YYYY",
      allowInvalid: false,
    },
    {
      data: "inStock",
      type: "checkbox",
      className: "htCenter",
    },
    { data: "qty", type: "numeric" },
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
  navigableHeaders: true, // New accessibility feature
  tabNavigation: true, // New accessibility feature
  autoWrapRow: true,
  autoWrapCol: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  licenseKey: "non-commercial-and-evaluation",
};

// Initialize the Handsontable instance with the specified configuration options
let hotInstance = new Handsontable(app, hotOptions);

// Helper function to set up checkbox event handling
const setupCheckbox = (element, callback) =>
  element.addEventListener("click", (clickEvent) => callback(element.checked));

// Set up event listeners for various checkboxes to update Handsontable settings.
// This allows us to change the Handsontable settings from the UI, showcasing
// the flexibility of Handsontable in configuring according to your needs.

// Checkbox: Enable/Disable Tab Navigation
setupCheckbox(document.querySelector("#enable-tab-navigation"), (checked) => {
  hotOptions.tabNavigation = checked;
  hotInstance.updateSettings({
    tabNavigation: hotOptions.tabNavigation,
  });
  console.log(
    `Updated setting: tabNavigation to`,
    hotInstance.getSettings().tabNavigation
  );
});

// Checkbox: Enable/Disable Header Navigation
setupCheckbox(
  document.querySelector("#enable-header-navigation"),
  (checked) => {
    hotOptions.navigableHeaders = checked;
    hotInstance.updateSettings({
      navigableHeaders: hotOptions.navigableHeaders,
    });
    console.log(
      `Updated setting: navigableHeaders to`,
      hotInstance.getSettings().navigableHeaders
    );
  }
);

// Checkbox: Enable/Disable Cell Virtualization
setupCheckbox(
  document.querySelector("#enable-cell-virtualization"),
  (checked) => {
    hotInstance.destroy();
    hotInstance = new Handsontable(document.getElementById("example1"), {
      ...hotOptions,
      renderAllRows: !checked,
      renderAllColumns: !checked,
    });
    console.log(
      `Updated setting: renderAllRows to`,
      hotInstance.getSettings().renderAllRows
      `Updated setting: renderAllColumns to`,
      hotInstance.getSettings().renderAllColumns
    );
  }
);

// Checkbox: Enable/Disable Cell Enter Editing
setupCheckbox(
  document.querySelector("#enable-cell-enter-editing"),
  (checked) => {
    hotOptions.enterBeginsEditing = checked;
    hotInstance.updateSettings({
      enterBeginsEditing: hotOptions.enterBeginsEditing,
    });
    console.log(
      `Updated setting: enable-cell-enter-editing to`,
      hotInstance.getSettings().enterBeginsEditing
    );
  }
);

// Checkbox: Enable/Disable Arrow Navigation for First/Last Row
setupCheckbox(
  document.querySelector("#enable-arrow-rl-first-last-column"),
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

// Checkbox: Enable/Disable Arrow Navigation for First/Last Column
setupCheckbox(
  document.querySelector("#enable-arrow-td-first-last-column"),
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

// Checkbox: Enable/Disable Enter Key Focus for Editing
setupCheckbox(
  document.querySelector("#enable-enter-focus-editing"),
  (checked) => {
    hotOptions.enterMoves = checked ? { col: 0, row: 1 } : { col: 0, row: 0 };
    hotInstance.updateSettings({
      enterMoves: hotOptions.enterMoves,
    });
    console.log(
      `Updated setting: enterMoves to`,
      hotInstance.getSettings().enterMoves
    );
  }
);
```

:::

:::

::: only-for react

::: example #example2 :react --css 1 --js 2

```css
.checkbox-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group > div {
  display: flex;
}

.checkbox-group > div > label {
  display: flex;
  gap: 0.2rem;
}

.external-link {
  margin-left: 0.5rem;
  position: relative;
  top: 2px;
  color: black;
}

.external-link:hover {
  color: #0000ee;
}

.placeholder-input {
  max-width: 20rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: black;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
}

.option-label {
  align-items: flex-start;
}

/* 
  We want the focus to be around input and label, in order to achieve this,
  we remove focus from the input and add it to the label (wrapper in this case)
  we then use the :focus-within pseudo class plus native focus styles
  https://css-tricks.com/copy-the-browsers-native-focus-styles/
*/
.option-label:focus-within {
  outline: 5px auto Highlight;
  outline: 5px auto -webkit-focus-ring-color;
}

.option-label > input:focus {
  outline: none;
}

/* fixes dark theme conflicting with text color */
html.theme-dark .option-label {
  color: #e5ebf1 !important;
}

#example2 {
  gap: 1rem;
  display: flex;
  flex-direction: column;
}
```

```jsx
/* start:skip-in-preview */
import { HotTable, HotColumn } from "@handsontable/react";
import { useState } from "react";

import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

const data = [
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Rustic Soft Ball",
    sellDate: "05/07/2023",
    inStock: false,
    qty: 82,
    orderId: "16-3974628",
    country: "United Kingdom",
  },
  {
    companyName: "Rath LLC",
    productName: "Small Frozen Tuna",
    sellDate: "31/05/2023",
    inStock: false,
    qty: 459,
    orderId: "77-7839351",
    country: "Costa Rica",
  },
  {
    companyName: "Reichert LLC",
    productName: "Rustic Soft Ball",
    sellDate: "16/03/2023",
    inStock: false,
    qty: 318,
    orderId: "75-6343150",
    country: "United States of America",
  },
  {
    companyName: "Kozey Inc",
    productName: "Sleek Wooden Bacon",
    sellDate: "24/04/2023",
    inStock: true,
    qty: 177,
    orderId: "56-3608689",
    country: "Pitcairn Islands",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Awesome Wooden Hat",
    sellDate: "29/04/2023",
    inStock: true,
    qty: 51,
    orderId: "58-1204318",
    country: "Argentina",
  },
  {
    companyName: "Gerhold - Rowe",
    productName: "Tasty Frozen Table",
    sellDate: "27/03/2023",
    inStock: false,
    qty: 439,
    orderId: "62-6066132",
    country: "Senegal",
  },
  {
    companyName: "Rath LLC",
    productName: "Awesome Wooden Hat",
    sellDate: "24/11/2022",
    inStock: false,
    qty: 493,
    orderId: "76-7785471",
    country: "Cyprus",
  },
  {
    companyName: "Kozey Inc",
    productName: "Rustic Soft Ball",
    sellDate: "11/08/2023",
    inStock: false,
    qty: 225,
    orderId: "34-3551159",
    country: "Saint Martin",
  },
  {
    companyName: "Hodkiewicz - Hintz",
    productName: "Awesome Wooden Hat",
    sellDate: "07/02/2023",
    inStock: false,
    qty: 261,
    orderId: "77-1112514",
    country: "Chile",
  },
  {
    companyName: "Hegmann Inc",
    productName: "Tasty Frozen Table",
    sellDate: "06/05/2023",
    inStock: false,
    qty: 439,
    orderId: "12-3252385",
    country: "Switzerland",
  },
  {
    companyName: "Weber Inc",
    productName: "Awesome Wooden Hat",
    sellDate: "22/04/2023",
    inStock: true,
    qty: 235,
    orderId: "71-7639998",
    country: "Brazil",
  },
  {
    companyName: "Jacobi - Kutch",
    productName: "Sleek Wooden Bacon",
    sellDate: "13/12/2022",
    inStock: true,
    qty: 163,
    orderId: "68-1588829",
    country: "Burkina Faso",
  },
  {
    companyName: "Jenkins LLC",
    productName: "Small Rubber Shoes",
    sellDate: "26/03/2023",
    inStock: true,
    qty: 8,
    orderId: "61-6324553",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Koepp and Sons",
    productName: "Sleek Wooden Bacon",
    sellDate: "04/05/2023",
    inStock: true,
    qty: 355,
    orderId: "74-6985005",
    country: "Mozambique",
  },
  {
    companyName: "Doyle Group",
    productName: "Awesome Wooden Hat",
    sellDate: "01/08/2023",
    inStock: false,
    qty: 186,
    orderId: "84-4370131",
    country: "Cocos (Keeling) Islands",
  },
  {
    companyName: "Rempel - Durgan",
    productName: "Tasty Frozen Table",
    sellDate: "30/09/2023",
    inStock: false,
    qty: 284,
    orderId: "13-6461825",
    country: "Monaco",
  },
  {
    companyName: "Lesch - Jakubowski",
    productName: "Small Fresh Bacon",
    sellDate: "26/09/2023",
    inStock: true,
    qty: 492,
    orderId: "13-9465439",
    country: "Iran",
  },
  {
    companyName: "Jacobi - Kutch",
    productName: "Rustic Cotton Ball",
    sellDate: "04/05/2023",
    inStock: true,
    qty: 300,
    orderId: "76-5194058",
    country: "Indonesia",
  },
  {
    companyName: "Gerhold - Rowe",
    productName: "Rustic Cotton Ball",
    sellDate: "07/07/2023",
    inStock: true,
    qty: 493,
    orderId: "61-8600792",
    country: "Norfolk Island",
  },
  {
    companyName: "Johnston - Wisozk",
    productName: "Small Fresh Fish",
    sellDate: "14/07/2023",
    inStock: false,
    qty: 304,
    orderId: "10-6007287",
    country: "Romania",
  },
  {
    companyName: "Gutkowski Inc",
    productName: "Small Fresh Bacon",
    sellDate: "10/01/2023",
    inStock: true,
    qty: 375,
    orderId: "25-1164132",
    country: "Afghanistan",
  },
  {
    companyName: "Koepp and Sons",
    productName: "Small Fresh Fish",
    sellDate: "30/03/2023",
    inStock: false,
    qty: 365,
    orderId: "75-7975820",
    country: "Germany",
  },
  {
    companyName: "Zboncak and Sons",
    productName: "Small Fresh Fish",
    sellDate: "17/08/2023",
    inStock: false,
    qty: 308,
    orderId: "59-6251875",
    country: "Tajikistan",
  },
  {
    companyName: "Mills Group",
    productName: "Rustic Soft Ball",
    sellDate: "30/09/2023",
    inStock: false,
    qty: 191,
    orderId: "67-7521441",
    country: "Puerto Rico",
  },
  {
    companyName: "Zboncak and Sons",
    productName: "Awesome Wooden Hat",
    sellDate: "18/03/2023",
    inStock: false,
    qty: 208,
    orderId: "19-4264192",
    country: "Bolivia",
  },
  {
    companyName: "Rath LLC",
    productName: "Rustic Soft Ball",
    sellDate: "14/06/2023",
    inStock: true,
    qty: 191,
    orderId: "78-5742060",
    country: "Benin",
  },
  {
    companyName: "Upton - Reichert",
    productName: "Tasty Frozen Table",
    sellDate: "27/02/2023",
    inStock: false,
    qty: 45,
    orderId: "26-6191298",
    country: "Tunisia",
  },
  {
    companyName: "Carroll Group",
    productName: "Rustic Soft Ball",
    sellDate: "12/12/2022",
    inStock: true,
    qty: 385,
    orderId: "13-7828353",
    country: "French Southern Territories",
  },
  {
    companyName: "Reichel Group",
    productName: "Small Frozen Tuna",
    sellDate: "12/12/2022",
    inStock: true,
    qty: 117,
    orderId: "67-9643738",
    country: "Mongolia",
  },
  {
    companyName: "Kozey Inc",
    productName: "Rustic Soft Ball",
    sellDate: "24/03/2023",
    inStock: false,
    qty: 335,
    orderId: "78-1331653",
    country: "Angola",
  },
  {
    companyName: "Brown LLC",
    productName: "Small Rubber Shoes",
    sellDate: "13/06/2023",
    inStock: true,
    qty: 305,
    orderId: "63-2315723",
    country: "French Southern Territories",
  },
  {
    companyName: "Weber Inc",
    productName: "Rustic Cotton Ball",
    sellDate: "07/09/2023",
    inStock: true,
    qty: 409,
    orderId: "53-6782557",
    country: "Indonesia",
  },
  {
    companyName: "OReilly LLC",
    productName: "Tasty Frozen Table",
    sellDate: "18/05/2023",
    inStock: true,
    qty: 318,
    orderId: "91-7787675",
    country: "Mayotte",
  },
  {
    companyName: "Weber Inc",
    productName: "Sleek Wooden Bacon",
    sellDate: "20/04/2023",
    inStock: false,
    qty: 234,
    orderId: "41-3560672",
    country: "Switzerland",
  },
  {
    companyName: "Hodkiewicz Inc",
    productName: "Tasty Frozen Table",
    sellDate: "19/10/2023",
    inStock: true,
    qty: 136,
    orderId: "48-6028776",
    country: "Peru",
  },
  {
    companyName: "Lesch and Sons",
    productName: "Rustic Cotton Ball",
    sellDate: "29/09/2023",
    inStock: false,
    qty: 187,
    orderId: "84-3770456",
    country: "Central African Republic",
  },
  {
    companyName: "Pouros - Brakus",
    productName: "Small Frozen Tuna",
    sellDate: "29/01/2023",
    inStock: false,
    qty: 350,
    orderId: "08-4844950",
    country: "Isle of Man",
  },
  {
    companyName: "Batz - Rice",
    productName: "Small Rubber Shoes",
    sellDate: "06/11/2023",
    inStock: false,
    qty: 252,
    orderId: "88-4899852",
    country: "Burundi",
  },
  {
    companyName: "Kub Inc",
    productName: "Small Fresh Fish",
    sellDate: "05/09/2023",
    inStock: true,
    qty: 306,
    orderId: "06-5022461",
    country: "Mauritius",
  },
  {
    companyName: "Hills and Sons",
    productName: "Small Frozen Tuna",
    sellDate: "07/11/2023",
    inStock: false,
    qty: 435,
    orderId: "99-5539911",
    country: "Somalia",
  },
  {
    companyName: "Shanahan - Boyle",
    productName: "Small Frozen Tuna",
    sellDate: "19/06/2023",
    inStock: true,
    qty: 171,
    orderId: "82-8162453",
    country: "Virgin Islands, U.S.",
  },
  {
    companyName: "Luettgen Inc",
    productName: "Awesome Wooden Hat",
    sellDate: "30/09/2023",
    inStock: false,
    qty: 6,
    orderId: "02-8118250",
    country: "Colombia",
  },
  {
    companyName: "Hegmann Inc",
    productName: "Small Rubber Shoes",
    sellDate: "16/02/2023",
    inStock: true,
    qty: 278,
    orderId: "07-9773343",
    country: "Central African Republic",
  },
  {
    companyName: "Kub Inc",
    productName: "Small Frozen Tuna",
    sellDate: "08/08/2023",
    inStock: false,
    qty: 264,
    orderId: "66-4470479",
    country: "Norfolk Island",
  },
  {
    companyName: "Kub Inc",
    productName: "Tasty Frozen Table",
    sellDate: "06/06/2023",
    inStock: true,
    qty: 494,
    orderId: "13-1175339",
    country: "Liechtenstein",
  },
  {
    companyName: "Hahn - Welch",
    productName: "Small Frozen Tuna",
    sellDate: "12/06/2023",
    inStock: false,
    qty: 485,
    orderId: "32-9127309",
    country: "Bahrain",
  },
  {
    companyName: "Nader - Fritsch",
    productName: "Small Frozen Tuna",
    sellDate: "08/04/2023",
    inStock: true,
    qty: 332,
    orderId: "41-3774568",
    country: "Montserrat",
  },
  {
    companyName: "Crona and Sons",
    productName: "Small Fresh Bacon",
    sellDate: "21/06/2023",
    inStock: true,
    qty: 104,
    orderId: "48-9995090",
    country: "Syrian Arab Republic",
  },
  {
    companyName: "Lind Group",
    productName: "Rustic Cotton Ball",
    sellDate: "17/08/2023",
    inStock: false,
    qty: 51,
    orderId: "68-9599400",
    country: "Czech Republic",
  },
  {
    companyName: "Labadie LLC",
    productName: "Small Fresh Bacon",
    sellDate: "20/04/2023",
    inStock: true,
    qty: 155,
    orderId: "52-4334332",
    country: "Croatia",
  },
  {
    companyName: "Doyle Group",
    productName: "Sleek Wooden Bacon",
    sellDate: "23/07/2023",
    inStock: false,
    qty: 465,
    orderId: "63-8894526",
    country: "Indonesia",
  },
];

const countries = data.reduce((acc, curr) => {
  if (acc.includes(curr.country)) {
    return acc;
  }
  return [...acc, curr.country];
}, []);
/* end:skip-in-preview */

// Handsontable options
const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Order ID",
    "Country",
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  licenseKey: "non-commercial-and-evaluation",
};

function App() {
  const [toggleableOptions, setToggleableOptions] = useState({
    tabNavigation: true,
    navigableHeaders: true,
    renderAllRows: false,
    renderAllColumns: false,
    enterBeginsEditing: true,
    autoWrapRow: true,
    autoWrapCol: true,
    enterMoves: { col: 0, row: 1 },
  });

  return (
    <>
      {/* DemoOptions component for changing Handsontable options */}
      <DemoOptions
        changeToggleOptions={setToggleableOptions}
        {...toggleableOptions}
      />

      <input
        className="placeholder-input"
        type="text"
        placeholder="Focusable text input"
      />

      {/* Handsontable component with dynamic options */}
      <HotTable
        // Handsontable needs to reload when changing virtualization
        // by changing the key, we force the component to reload
        key={String(toggleableOptions.renderAllRows)}
        {...hotOptions}
        // Pass in the options which can change for demo
        {...toggleableOptions}
      >
        {/* Define HotColumns for the data */}
        <HotColumn data="companyName" type="text" />
        <HotColumn data="productName" type="text" />
        <HotColumn
          data="sellDate"
          dateFormat="DD/MM/YYYY"
          correctFormat
          type="date"
          allowInvalid={false}
        />
        <HotColumn data="inStock" type="checkbox" className="htCenter" />
        <HotColumn data="qty" type="numeric" />
        <HotColumn data="orderId" type="text" />
        <HotColumn data="country" type="dropdown" source={countries} />
      </HotTable>
      <input
        className="placeholder-input"
        type="text"
        placeholder="Focusable text input"
      />
    </>
  );
}

// Demo Options allows you to change the Handsontable options
// This allows us to change the Handsontable settings from the UI, showcasing
// the flexibility of Handsontable in configuring according to your needs.
function DemoOptions({
  tabNavigation,
  navigableHeaders,
  renderAllRows,
  renderAllColumns,
  enterBeginsEditing,
  autoWrapRow,
  autoWrapCol,
  enterMoves,
  changeToggleOptions,
}) {
  // on checkbox change, update handsontable option
  const handleCheckboxChange = (checkboxName) => {
    switch (checkboxName) {
      case "enable-tab-navigation":
        changeToggleOptions((existing) => ({
          ...existing,
          tabNavigation: !tabNavigation,
        }));
        break;
      case "enable-header-navigation":
        changeToggleOptions((existing) => ({
          ...existing,
          navigableHeaders: !navigableHeaders,
        }));
        break;
      case "enable-cell-virtualization":
        changeToggleOptions((existing) => ({
          ...existing,
          renderAllRows: !renderAllRows,
          renderAllColumns: !renderAllColumns,
        }));
        break;
      case "enable-cell-enter-editing":
        changeToggleOptions((existing) => ({
          ...existing,
          enterBeginsEditing: !enterBeginsEditing,
        }));
        break;
      case "enable-arrow-rl-first-last-column":
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapRow: !autoWrapRow,
        }));
        break;
      case "enable-arrow-td-first-last-column":
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapCol: !autoWrapCol,
        }));
        break;
      case "enable-enter-focus-editing":
        changeToggleOptions((existing) => ({
          ...existing,
          enterMoves:
            enterMoves.row !== 1 ? { col: 0, row: 1 } : { col: 0, row: 0 },
        }));
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="checkbox-container">
        <div className="checkbox-group">
          <div>
            <label
              className="option-label"
              htmlFor="enable-tab-navigation"
              id="tab-navigation-label"
            >
              <input
                checked={tabNavigation}
                type="checkbox"
                id="enable-tab-navigation"
                name="enable-tab-navigation"
                aria-label="Enable navigation with the Tab key"
                onChange={() => handleCheckboxChange("enable-tab-navigation")}
              />
              Enable navigation with the Tab key
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#tabnavigation"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more enabling/disabling tab navigation (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-header-navigation"
              id="header-navigation-label"
            >
              <input
                checked={navigableHeaders}
                type="checkbox"
                id="enable-header-navigation"
                name="enable-header-navigation"
                aria-labelledby="header-navigation-label"
                onChange={() =>
                  handleCheckboxChange("enable-header-navigation")
                }
              />
              Enable navigation across headers
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#navigableheaders"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about enabling/disabling tab navigation across headers (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-cell-virtualization"
              id="cell-virtualization-label"
            >
              <input
                checked={!renderAllRows}
                type="checkbox"
                id="enable-cell-virtualization"
                name="enable-cell-virtualization"
                aria-labelledby="cell-virtualization-label"
                onChange={() =>
                  handleCheckboxChange("enable-cell-virtualization")
                }
              />
              Enable cells virtualization
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#renderAllRows"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about row virtualization (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-cell-enter-editing"
              id="cell-enter-editing-label"
            >
              <input
                checked={enterBeginsEditing}
                type="checkbox"
                id="enable-cell-enter-editing"
                name="enable-cell-enter-editing"
                aria-labelledby="cell-enter-editing-label"
                onChange={() =>
                  handleCheckboxChange("enable-cell-enter-editing")
                }
              />
              The Enter key begins cell editing
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#enterbeginsediting"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key cell editing (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
        </div>
        <div className="checkbox-group">
          <div>
            <label
              className="option-label"
              htmlFor="enable-arrow-rl-first-last-column"
              id="arrow-rl-first-last-column-label"
            >
              <input
                checked={autoWrapRow}
                type="checkbox"
                id="enable-arrow-rl-first-last-column"
                name="enableArrowFirstLastColumn"
                aria-labelledby="arrow-rl-first-last-column-label"
                onChange={() =>
                  handleCheckboxChange("enable-arrow-rl-first-last-column")
                }
              />
              The right/left arrow keys move the focus to the first/last column
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#autowrapcol"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about right/left arrow key behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-arrow-td-first-last-column"
              id="arrow-td-first-last-column-label"
            >
              <input
                checked={autoWrapCol}
                type="checkbox"
                id="enable-arrow-td-first-last-column"
                name="enable-arrow-td-first-last-column"
                aria-labelledby="arrow-td-first-last-column-label"
                onChange={() =>
                  handleCheckboxChange("enable-arrow-td-first-last-column")
                }
              />
              The up/down arrow keys move the focus to the first/last row
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#autowraprow"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about up/down arrow key behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-enter-focus-editing"
              id="enter-focus-editing-label"
            >
              <input
                checked={enterMoves.row !== 0}
                type="checkbox"
                id="enable-enter-focus-editing"
                name="enable-enter-focus-editing"
                aria-labelledby="enter-focus-editing-label"
                onChange={() =>
                  handleCheckboxChange("enable-enter-focus-editing")
                }
              />
              The Enter key moves the focus after cell edition
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#entermoves"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key focus behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("example2"));
```

:::

:::

## Disabling DOM virtualization for improved accessibility

By default, Handsontable uses DOM virtualization to display only the [rows](@/guides/rows/row-virtualization.md)
and [columns](@/guides/columns/column-virtualization.md) that are currently visible on the screen,
plus a few extra cells outside the visible area to ensure a seamless scrolling experience.

However, assistive technologies rely on the elements within the DOM appearing in the correct order.
Otherwise, they require the use of [additional ARIA attributes](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties),
such as `row-colindex` or `aria-rowindex`, to understand the grid's structure and accurately announce (read) it to the user.

We already use ARIA attributes to describe data sorting, hidden columns or rows, and merged cells.
Unfortunately, our tests have discovered scenarios where screen readers either announce incorrect indices or omit the ARIA attributes altogether.
To address this issue, we recommend disabling DOM virtualization, which entails loading all grid elements into the browser.
This action creates a complete [Accessibility tree](https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree) that can be easily parsed
and interpreted by assistive technology.

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // disable column virtualization
  renderAllColumns: true,
  // disable row virtualization
  renderAllRows: true,
});
```

:::

::: only-for react

```js
<HotTable
  // disable column virtualization
  renderAllColumns={true}
  // disable row virtualization
  renderAllRows={true}
/>
```

:::

## High-contrast theme

The recommended [minimum contrast ratio](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum) for text against images or backgrounds is 4.5:1. To achieve this level of contrast with Handsontable's default theme, you can:

- Override the grid's CSS with your own styles.
- Use third-party software, such as the [High Contrast](https://chrome.google.com/webstore/detail/high-contrast/djcfdncoelnlbldjfhinnjlhdjlikmph) extension for Chrome, supported by Google.

## Requirements for developers

When you customize Handsontable, it's you who's responsible for ensuring the accessibility of your solution. Especially when you create a [custom cell type](@/guides/cell-types/cell-type.md) or a [custom plugin](@/guides/tools-and-building/custom-plugins.md), remember to make them accessible to everyone.

Our recommendations for custom development:

- Test your code against WCAG 2.1 requirements frequently.
- Use proper color contrast, font size, and semantic HTML.
- If needed, implement additional WAI-ARIA attributes.
- Avoid flashing or blinking content.
- Test your customizations with real users who have different types of disabilities. If you don’t have access to real users, try [Funkify](https://www.funkify.org/), a disability simulator, which can help you look at your application from the perspective of users with different disabilities.

::: tip

The quality of custom Handsontable modifications can impact your application's accessibility level. Make sure to actively check how your changes influence the overall accessibility of your application, using tools like [Lighthouse](https://developers.google.com/web/tools/lighthouse).

:::

## Maintaining accessibility

We make sure our data grid remains accessible by taking the following measures:

- We check Handsontable's accessibility score with a range of accessibility testing tools.
- We use automated visual regression testing.
- We manually test all of Handsontable's features with the most popular screen readers.
- We use automated unit and end-to-end tests.

## Known limitations

- When [frozen rows](@/guides/rows/row-freezing.md), [frozen columns](@/guides/columns/column-freezing.md), or both, are enabled, some screen readers may incorrectly read the total number of rows and columns.
- When you select a cell that's part of a frozen row, frozen column, or both, NVDA and JAWS might incorrectly announce that cell's column header name.
- Dynamic ARIA attributes are sometimes omitted by screen readers.
- The `aria-rowcount` attribute is intentionally set to `-1`, as most screen readers either ignore or misinterpret it. This configuration ensures accuracy with screen readers such as VoiceOver. We plan to revise this approach once screen readers consistently handle the `aria-rowcount` attribute correctly.

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks.md) related to accessibility, see the following API reference pages:

- [`autoWrapCol`](@/api/options.md#autowrapcol)
- [`autoWrapRow`](@/api/options.md#autowraprow)
- [`tabNavigation`](@/api/options.md#tabnavigation)
- [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
- [`enterMoves`](@/api/options.md#entermoves)
- [`navigableHeaders`](@/api/options.md#navigableheaders)
- [`renderAllColumns`](@/api/options.md#renderallcolumns)
- [`renderAllRows`](@/api/options.md#renderallrows)
- [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
- [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)

## Troubleshooting

Try the following links if you didn't find what you need:

- [View related topics](https://github.com/handsontable/handsontable/labels/Accessibility) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help
