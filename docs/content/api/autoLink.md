---
title: AutoLink
metaTitle: AutoLink | Handsontable DataGrid for JavaScript
permalink: /api/auto-link
canonicalUrl: /api/auto-link
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 883xgxul
description: Use the AutoLink plugin with its API options and methods to render the URLs found in cell values as clickable links.
react:
  id: 77y9d5vk
  metaTitle: AutoLink | Handsontable DataGrid for React
angular:
  id: p4s2h8nq
  metaTitle: AutoLink | Handsontable DataGrid for Angular
---

[[toc]]

See the [Clickable links](@/guides/cell-features/clickable-links/clickable-links.md) guide for examples and configuration details.

## Options

### autoLink
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api autoLink|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L736

:::

_autoLink.autoLink : boolean | object_

The `autoLink` option configures the `AutoLink` plugin, which renders the
URLs found in cell values as clickable links.

You can set the `autoLink` option to one of the following:

| Setting           | Description                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `false` (default) | Disable the `AutoLink` plugin                                       |
| `true`            | Enable the `AutoLink` plugin with the default settings               |
| An object         | Enable the `AutoLink` plugin and configure its settings              |

If you set the `autoLink` option to an object, you can configure the following settings:

| Option      | Possible settings                                                       | Description                                                                 |
| ----------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `target`    | `'_blank'` (default) \| `'_self'`                                       | Where the links open                                                         |
| `schemes`   | An array of `'http'`, `'https'`, `'mailto'`, `'tel'` (default: all four) | The URL schemes to link. Narrows the fixed four-scheme allowlist, never widens it. A column or cell `schemes` replaces the grid-level list for those cells. |
| `inline`    | `true` (default) \| `false`                                             | `true`: link URLs inside longer text<br>`false`: link only a cell whose whole value is one URL |
| `strict`    | `true` (default) \| `false`                                             | `true`: link only URLs that carry a scheme<br>`false`: also link bare domains (`example.com`) as `https` and bare email addresses as `mailto`, validated against the IANA top-level domain list bundled with Handsontable |
| `className` | A string (default: `''`)                                                | Extra class name(s) added to every link                                      |

The full IANA top-level domain list is used, so a file name whose extension is also a
top-level domain, such as `report.zip` or `README.md`, links too. Keep the default unless your
data holds bare domains or email addresses, and keep `strict: true` or set `autoLink: false` on
columns that hold file names. The bundled list is fixed at build time - Handsontable makes no
network request to validate a bare domain, which keeps `strict: false` usable in an
air-gapped environment. Punycode top-level domains (`xn--...`) are skipped, since nobody types
those into a cell.

The cell keeps its own renderer and its value stays unchanged, so copying, autofill, sorting,
and export are unaffected. Every link element gets the `ht-link` and `ht-auto-link` classes,
and always carries `rel="noopener noreferrer"`. Press <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd>
to open the first link of the selected cell.

For `mailto:` and `tel:` links, the scheme prefix is wrapped in a `ht-link-scheme` element and
hidden, so the cell shows only the address or the number. The cell value and the link target
keep the prefix.

Only the `http`, `https`, `mailto`, and `tel` schemes are ever linked. A cell that already
contains a link element, such as a `HYPERLINK` cell rendered through
[`formulas.hyperlinks`](@/api/options.md#formulas) or an `html` cell holding an anchor, is left as it is.

The plugin is enabled at the grid level. Set `autoLink: false` for a column or a cell to opt it
out, or set an object to override the grid-level settings for that column or cell.

Read more:
- [Clickable links](@/guides/cell-features/clickable-links/clickable-links.md)

**Default**: <code>false</code>  
**Since**: 19.0.0  
**Example**  
```js
// link every URL, email address and phone number found in cell values
autoLink: true,

// open links in the same tab, link web URLs only, and add a class to every link
autoLink: {
  target: '_self',
  schemes: ['http', 'https'],
  className: 'company-link',
},

// also link bare domains (as `https`) and bare email addresses (as `mailto`)
autoLink: {
  strict: false,
},

// enable the plugin, but keep one column as plain text
autoLink: true,
columns: [
  { data: 'website' },
  { data: 'notes', autoLink: false },
],
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L142

:::

_AutoLink.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L137

:::

_AutoLink.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L126

:::

_AutoLink.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L131

:::

_AutoLink.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L155

:::

_AutoLink.SETTINGS\_VALIDATORS_

Returns an object of validator functions used to type-check each settings property at runtime.


## Methods

### destroy

::: ask-about-api destroy|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L213

:::

_autoLink.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L197

:::

_autoLink.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L173

:::

_autoLink.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L168

:::

_autoLink.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings.



### updatePlugin

::: ask-about-api updatePlugin|AutoLink

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoLink/autoLink.ts#L190

:::

_autoLink.updatePlugin()_

Updates the plugin's state. This method is executed when `updateSettings()` is invoked with any
of the plugin's settings.


