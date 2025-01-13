<div align="center">
  <br><br>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/handsontable/handsontable/blob/develop/resources/handsontable-logo-white.svg?raw=true"/>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/handsontable/handsontable/blob/develop/resources/handsontable-logo-black.svg?raw=true"/>
    <img width="360" alt="Logo of Handsontable data grid" src="https://github.com/handsontable/handsontable/blob/develop/resources/handsontable-logo-black.svg?raw=true"/>
  </picture>
  <br><br>
  <h3>The official <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/vue-icon.svg" width="16" height="16"> Vue 3 wrapper for Handsontable.
    <br>
    <a href="https://handsontable.com/docs" target="_blank">JavaScript Data Grid</a> with a spreadsheet-like look and feel.</h3>

  <p>With its spreadsheet-like editing features, it’s perfect for building data-rich internal apps. It allows users to enter, edit, validate, and process data from various sources. Common use cases include resource planning software (ERP), inventory management systems, digital platforms, and data modeling applications.</p>

<a href="https://handsontable.com">Website</a> &nbsp;&nbsp;—&nbsp;&nbsp; <a href="https://handsontable.com/docs/javascript-data-grid/vue3-installation/">Documentation</a> &nbsp;&nbsp;—&nbsp;&nbsp; <a href="https://handsontable.com/docs/themes">Themes</a> &nbsp;&nbsp;—&nbsp;&nbsp; <a href="https://handsontable.com/docs/api">API</a> &nbsp;&nbsp;—&nbsp;&nbsp; <a href="https://github.com/handsontable/handsontable/discussions">Community</a>

  <br>

[![NPM version](https://img.shields.io/npm/v/@handsontable/vue3?style=for-the-badge)](https://npmjs.com/package/@handsontable/vue3)
[![Total downloads](https://img.shields.io/npm/dt/handsontable.svg?style=for-the-badge)](https://npmjs.com/package/@handsontable/vue3)
[![Monthly downloads](https://img.shields.io/npm/dm/handsontable.svg?style=for-the-badge)](https://npmjs.com/package/@handsontable/vue3)
[![Contributors](https://img.shields.io/github/contributors/handsontable/handsontable?style=for-the-badge)](https://github.com/handsontable/handsontable/graphs/contributors)
<br>
[![CI status](https://github.com/handsontable/handsontable/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/handsontable/handsontable/actions/workflows/test.yml?query=branch%3Amaster)
[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=handsontable_handsontable&metric=alert_status)](https://sonarcloud.io/dashboard?id=handsontable_handsontable)
[![FOSSA status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhandsontable?ref=badge_shield)

  <br>

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/handsontable/handsontable/blob/develop/resources/handsontable-preview-dark-theme.png?raw=true"/>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/handsontable/handsontable/blob/develop/resources/handsontable-preview-light-theme.png?raw=true"/>
    <img width="780" alt="Vue data grid preview" src="https://github.com/handsontable/handsontable/blob/develop/resources/handsontable-preview-light-theme.png?raw=true"/>
  </picture>
</div>

## ✨ Key Features

&nbsp;&nbsp;✅&nbsp; [Built-in themes](https://handsontable.com/docs/themes/) <br>
&nbsp;&nbsp;✅&nbsp; [Flexible API](https://handsontable.com/docs/api/) <br>
&nbsp;&nbsp;✅&nbsp; [Virtualization](https://handsontable.com/docs/row-virtualization/) <br>
&nbsp;&nbsp;✅&nbsp; [IME support](https://handsontable.com/docs/ime-support/) <br>
&nbsp;&nbsp;✅&nbsp; [Internationalization](https://handsontable.com/docs/language/) <br>
&nbsp;&nbsp;✅&nbsp; [RTL support](https://handsontable.com/docs/layout-direction/) <br>
&nbsp;&nbsp;✅&nbsp; [Accessibility](https://handsontable.com/docs/accessibility/) <br>
&nbsp;&nbsp;✅&nbsp; [Keyboard shortcuts](https://handsontable.com/docs/keyboard-shortcuts/) <br>
&nbsp;&nbsp;✅&nbsp; [Sorting data](https://handsontable.com/docs/rows-sorting/) <br>
&nbsp;&nbsp;✅&nbsp; [Filtering data](https://handsontable.com/docs/column-filter/) <br>
&nbsp;&nbsp;✅&nbsp; [400 built-in formulas](https://handsontable.com/docs/formula-calculation/) <br>
&nbsp;&nbsp;✅&nbsp; [Configurable selection](https://handsontable.com/docs/selection/) <br>
&nbsp;&nbsp;✅&nbsp; [Data validation](https://handsontable.com/docs/cell-validator/) <br>
&nbsp;&nbsp;✅&nbsp; [Conditional formatting](https://handsontable.com/docs/conditional-formatting/) <br>
&nbsp;&nbsp;✅&nbsp; [Merged cells](https://handsontable.com/docs/merge-cells/) <br>
&nbsp;&nbsp;✅&nbsp; [Pinned/frozen columns](https://handsontable.com/docs/column-freezing/) <br>
&nbsp;&nbsp;✅&nbsp; [Hiding columns](https://handsontable.com/docs/column-hiding/) <br>
&nbsp;&nbsp;✅&nbsp; [Right-click context menu](https://handsontable.com/docs/context-menu/) <br>

<div id="installation">

## 🪄 Installation
Below is the installation guide for the Handsontable with Vue 3 wrapper. If you're using another framework, please refer to its dedicated wrapper for specific installation instructions.

- <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/javascript-icon.svg" width="12" height="12" alt="JavaScript logo"> <a href="https://github.com/handsontable/handsontable"> JavaScript</a>
- <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="12" height="12" alt="React logo"> <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/react-wrapper"> React functional component</a>
- <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/react-icon.svg" width="12" height="12" alt="React logo"> <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/react"> React class component</a>
- <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/angular-icon.svg" width="12" height="12" alt="Angular logo"> <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/angular"> Angular</a>
- <img src="https://raw.githubusercontent.com/handsontable/handsontable/develop/resources/icons/vue-icon.svg" width="12" height="12" alt="Vue logo"> <a href="https://github.com/handsontable/handsontable/tree/master/wrappers/vue"> Vue 2</a>

---

```bash
npm install handsontable @handsontable/vue3
```

You can load it directly from [jsDelivr](https:jsdelivr.com/package/npm/@handsontable/vue3) as well.
```html
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@handsontable/vue3/dist/vue-handsontable.min.js"></script>

<link href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css" rel="stylesheet">
```

The component will be available as `Handsontable.vue.HotTable`.

### Usage

Use this data grid as you would any other component in your application. [Options](https://handsontable.com/docs/api/options/) can be set as `HotTable` props.

**Styles**
```css
@import '~handsontable/styles/handsontable.min.css';
@import '~handsontable/styles/ht-theme-main.min.css';
```

**Vue 3 Component**
```vue
<template>
  <div class="ht-theme-main-dark-auto">
    <hot-table
      :data="data"
      :row-headers=true
      :col-headers=true
      :navigable-headers=true
      :tab-navigation=true
      :multi-column-sorting=true
      header-class-name="htLeft"
      license-key="non-commercial-and-evaluation"
    >
      <hot-column title="Company" data="company" width=100></hot-column>
      <hot-column title="Country" data="country" width=170 type="dropdown" :source="['United Kingdom', 'Japan', 'United States']"></hot-column>
      <hot-column title="Rating" data="rating" width=100 type="numeric"></hot-column>
    </hot-table>
  </div>
</template>

<script>
  import { defineComponent } from 'vue';
  import { HotTable, HotColumn } from '@handsontable/vue3';
  import { registerAllModules } from 'handsontable/registry';
  import 'handsontable/styles/handsontable.min.css';
  import 'handsontable/styles/ht-theme-main.min.css';

  // register Handsontable's modules
  registerAllModules();

  const ExampleComponent = defineComponent({
    data() {
      return {
        data: [
          { company: 'Tagcat', country: 'United Kingdom', rating: 4.4 },
          { company: 'Zoomzone', country: 'Japan', rating: 4.5 },
          { company: 'Meeveo', country: 'United States', rating: 4.6 },
        ]
      };
    },
    components: {
      HotTable,
      HotColumn,
    }
  });

  export default ExampleComponent;
</script>
```

[![Static Badge](https://img.shields.io/badge/View%20live%20demo-1a42e8?style=for-the-badge)](https://handsontable.com/docs/javascript-data-grid/vue3-basic-example/)

</div>

<br>

## 🚀 Resources

- [Website](https://handsontable.com)
- [Demo](https://handsontable.com/demo)
- [Documentation](https://handsontable.com/docs/javascript-data-grid/vue3-installation/)
- [npm](https://www.npmjs.com/package/@handsontable/vue3)
- [CDN](https://www.jsdelivr.com/package/npm/@handsontable/vue3)
- [Forum](https://forum.handsontable.com/)
- [Blog](https://handsontable.com/blog)
- [Contact support team](https://handsontable.com/contact?category=technical_support)
- [Get a quote](https://handsontable.com/get-a-quote)

<br>

## 🤔 Is Handsontable a Data Grid or a Spreadsheet?

Handsontable is a data grid component written in JavaScript, not a spreadsheet. However, it brings in many features typically found in spreadsheet software. We designed it this way because spreadsheet-like patterns are often the most user-friendly when it comes to data entry and management.

### Spreadsheet-like features in Handsontable:

- Keyboard shortcuts compliant with either Google Sheets or Excel
- 400 spreadsheet formulas via native integration with [HyperFormula](https://github.com/handsontable/hyperformula)
- Keyboard navigation across headers that can be disabled, making only cells navigable
- TAB navigation across cells that can be disabled
- Built-in undo-redo functionality
- Powerful clipboard capabilities for copy-paste operations
- Ability to scroll the grid within the container (`div`) or window
- Data binding in the form of an array of objects or arrays of arrays
- Built-in cell editors like a date picker or dropdown list

At first glance, it might seem that a data table, spreadsheet, and data grid are just different names for the same thing - an interactive table displaying data. In reality, these tools serve different purposes and offer distinct functionalities, designed to meet specific needs. Handsontable sits comfortably in the data grid category while incorporating many of the best aspects of spreadsheet software.

<br>

## 🛟 Support

**We're here to help!**

If you're using Handsontable with a free, non-commercial license, you can:
- Join the conversation on [GitHub Discussions](https://github.com/handsontable/handsontable/discussions) to share ideas, suggest features, or discuss changes.
- Report any bugs you find on our [GitHub Issue Board](https://github.com/handsontable/handsontable/issues).
- Connect with other developers and find answers on our [Developer Forum](https://handsontable.com/forum).

If you have a commercial license, feel free to contact us directly at [support@handsontable.com](mailto:support@handsontable.com) or use our [contact form](https://handsontable.com/contact?category=technical_support).

<br>

## 📖 Licenses

Handsontable is available under two licensing options, allowing you to choose the one that best fits your needs. Each license comes with its own terms and conditions, as outlined below:

### ① Free license for non-commercial use, and evaluation purposes
This license is available for non-commercial purposes such as teaching, academic research, or evaluation. It allows you to use Handsontable free of charge under the terms specified in the non-commercial license agreement.
[Learn more here](https://github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf).

### ② Commercial license
For commercial use, a paid license is required. This license includes support and maintenance to ensure you get the most out of Handsontable. The commercial license can be purchased directly from Handsoncode or through an [authorized reseller](https://handsontable.com/resellers). See the [pricing page](https://handsontable.com/pricing) for details.

<br>

## 🔑 License Key

For projects covered by the free non-commercial license, simply use the phrase `'non-commercial-and-evaluation'` as your license key.

If you're using Handsontable in a project that supports commercial activities, you'll need to purchase a license key at [handsontable.com/pricing](https://handsontable.com/pricing). You can find more details in [our documentation](https://handsontable.com/docs/license-key/).

<br>

## 🙌 Contributing

Contributions are welcome, but before you make them, please read the [Contributing Guide](https://github.com/handsontable/handsontable/blob/develop/CONTRIBUTING.md) and accept the [Contributor License Agreement](https://goo.gl/forms/yuutGuN0RjsikVpM2).

<br>
<br>

Created and maintained by the [Handsontable Team](https://handsontable.com/team) 👋

---

© 2012 - 2025 Handsoncode
