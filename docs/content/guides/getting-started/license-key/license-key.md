---
type: how-to
title: License key
metaTitle: License key | Handsontable DataGrid for JavaScript
description: Activate Handsontable DataGrid by passing your license key in the configuration object. Get a trial key, a free license for non-commercial projects, or a commercial license.
permalink: /license-key
canonicalUrl: /license-key
react:
  metaTitle: License key | Handsontable DataGrid for React
angular:
  metaTitle: License key | Handsontable DataGrid for Angular
vue:
  metaTitle: License key | Handsontable DataGrid for Vue
searchCategory: Guides
category: Getting started
menuTag: updated
---
Activate Handsontable DataGrid by passing your license key in the configuration object. Get a trial key, a free license for non-commercial projects, or a commercial license.

[[toc]]

## Overview

Handsontable needs a license key. The key you need depends on how you use the grid: evaluation, non-commercial use, or commercial use.

We require you to specify which terms apply to your usage, by passing a license key in Handsontable's [`licenseKey`](@/api/options.md#licensekey) configuration option.

## Commercial license

If you use the paid version of Handsontable, pass the string of numbers delivered to you after the purchase. Note that the license key is a string, so you need to wrap it in quotes `''`.

::: only-for javascript

```js
const settings = {
  licenseKey: '00000-00000-00000-00000-00000',
  //... other options
}
```

To use it with a framework, pass the string to a [`licenseKey`](@/api/options.md#licensekey) prop:

<code-group>
<code-block title="React" active>

```jsx
<HotTable settings={settings} licenseKey="00000-00000-00000-00000-00000" />
```

</code-block>
<code-block title="Angular">

```html
<hot-table [settings]="settings" licenseKey="00000-00000-00000-00000-00000"></hot-table>
```

</code-block>
<code-block title="Vue 2">

```html
<hot-table :settings="settings" licenseKey="00000-00000-00000-00000-00000" />
```

</code-block>
<code-block title="Vue 3">

```html
<hot-table :settings="settings" licenseKey="00000-00000-00000-00000-00000" />
```

</code-block>
</code-group>

:::

::: only-for react

```jsx
<HotTable licenseKey="00000-00000-00000-00000-00000" />
```

:::

::: only-for angular

Pass the license key through `GridSettings` in your component:

```ts
import { GridSettings } from "@handsontable/angular-wrapper";

readonly gridSettings: GridSettings = {
  licenseKey: '00000-00000-00000-00000-00000',
};
```

```html
<hot-table [settings]="gridSettings" />
```

Or set it globally for all tables via `HOT_GLOBAL_CONFIG` in `app.config.ts`:

```ts
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from "@handsontable/angular-wrapper";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: '00000-00000-00000-00000-00000' } as HotGlobalConfig,
    },
  ],
};
```

:::

::: only-for vue

Pass the license key as a prop:

```html
<HotTable licenseKey="00000-00000-00000-00000-00000" />
```

Or include it in the settings object passed to `:settings`:

```vue
<script setup>
  const hotSettings = ref({
    licenseKey: '00000-00000-00000-00000-00000',
    // ... other options
  });
</script>

<template>
  <HotTable :settings="hotSettings" />
</template>
```

:::

## Placeholder in code examples

The code examples in this documentation carry no license key. A commented-out line marks where the key goes:

::: only-for javascript

```js
const settings = {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  //... other options
}
```

:::

::: only-for react

```jsx
<HotTable
  // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
  autoWrapRow={true}
  autoWrapCol={true}
/>
```

:::

::: only-for angular

```ts
readonly gridSettings: GridSettings = {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};
```

:::

::: only-for vue

```html
<!-- license-key="your-license-key" (get a key at https://handsontable.com/pricing/) -->
<HotTable />
```

:::

To use an example in your own project, uncomment the line and replace `your-license-key` with your key. Without a key, the grid shows a [blocking screen](#notifications).

The live examples on handsontable.com run without a key, so the commented-out line changes nothing there.

## Entitlement license keys

Handsontable also accepts entitlement license keys. An entitlement key is plain-English text that
states what you licensed, followed by a bracketed block that the grid reads:

```text
This is a Handsontable license key for Acme Corp, issued on 2026-08-12 for the "Acme Portal"
project. It includes 1 license:

> 1. Subscription license under Handsontable Subscription License Agreement 2.0 of 2022-05-21, for
     Handsontable on the Enterprise package, for internal use, valid until 2027-08-12 (UTC). Use
     after that date is not permitted. To renew, contact sales@handsontable.com.

[eyJwcm9kdWN0cyI6eyJoYW5kc29udGFibGUi...3a4f8361]
```

Pass the whole key string, exactly as you received it, in the same
[`licenseKey`](@/api/options.md#licensekey) option. The key text contains double quotes (around the
project name) and can contain apostrophes (in a company name), so do not paste it into a quoted
string or a quoted HTML attribute - the first quote inside the key ends the value there. Read the key
from your configuration, or write it as a template literal (in backticks), as in the examples below.
A template literal works as long as the key text contains no backtick and no `${`; if it does, read
the key from your configuration.

::: only-for javascript

```js
const settings = {
  licenseKey: `This is a Handsontable license key for Acme Corp, issued on 2026-08-12 for the "Acme Portal" project. ... [eyJwcm9kdWN0cyI6...3a4f8361]`,
  //... other options
}
```

:::

::: only-for react

```jsx
const licenseKey = `This is a Handsontable license key for Acme Corp, issued on 2026-08-12 for the "Acme Portal" project. ... [eyJwcm9kdWN0cyI6...3a4f8361]`;

<HotTable licenseKey={licenseKey} />
```

:::

::: only-for angular

```ts
import { GridSettings } from "@handsontable/angular-wrapper";

readonly gridSettings: GridSettings = {
  licenseKey: `This is a Handsontable license key for Acme Corp, issued on 2026-08-12 for the "Acme Portal" project. ... [eyJwcm9kdWN0cyI6...3a4f8361]`,
};
```

:::

::: only-for vue

```html
<script setup>
const licenseKey = `This is a Handsontable license key for Acme Corp, issued on 2026-08-12 for the "Acme Portal" project. ... [eyJwcm9kdWN0cyI6...3a4f8361]`;
</script>

<template>
  <HotTable :licenseKey="licenseKey" />
</template>
```

:::

Keys issued in the 25-character format keep working without any change.

Pass the key unchanged. A newer key protects its text as well as the bracketed block, so editing
the text, removing it, pasting the bracketed block alone, or adding text after the block makes it
invalid. Keys issued earlier keep working the way they did in Handsontable 18.1.
Spaces and line breaks are ignored, in the text and inside the block, so you can rewrap the key,
paste it out of an email that broke the block across lines, or put the whole key on one line, and the
key still works. Line breaks saved as the characters `\n`, as some `.env` files and CI secret fields
store them, work too. End the key with the block - only whitespace, or line breaks saved as `\n`,
may follow it. Space and line breaks around the whole key are trimmed for you, so a key pasted with a
trailing newline still works.

Handsontable 18.1 does not ignore line breaks inside the block. If you use 18.1, make sure the block
is on one line, with no spaces in it. Later versions check newer keys more strictly than 18.1, so
before you upgrade from 18.1, make sure you pass the whole key, exactly as you received it - not
only the bracketed block, and with nothing after it.

When you store the key in an environment variable, a `.env` file, or a CI secret, put it on one
line. In a `.env` file, also wrap the key in single quotes (`'...'`), or in backticks if the key text
contains an apostrophe. Without quotes, a line break or a ` #` in the key cuts the value short, and
double quotes end at the first double quote inside the key. Do not escape the quotes inside the key
(`\"`) - the backslashes stay in the value, and the key becomes invalid. Never change any other
character of the key, for example by replacing straight quotes with curly ones.

Each license behaves differently around its date:

### Trial keys

A trial key is time-boxed. During the trial, the grid shows the Handsontable badge in its top-left
corner and the [Powered by Handsontable DataGrid bar](#powered-by-handsontable-datagrid-bar) below
the table. Hover over the badge to see the trial status. Once the key's notice period begins, the
console starts warning how many days remain - on a standard 45-day trial that is from day one. On
the last licensed day the warning says the key expires today, because that day is still licensed in
full. After the expiration date, a message opens next to the badge and below the grid, and the console
reports an error. When the grace period stored in the key also passes, a blocking screen replaces
the grid. To purchase a commercial license, contact our [Sales Team](https://handsontable.com/get-a-quote).

### Subscription keys

The console warns you before the expiration date. How early depends on the notice period stored in
your key. After the expiration date, the console reports an error. The grid itself displays no
message, and it never stops working. To renew your subscription, contact our
[Sales Team](https://handsontable.com/get-a-quote).

The expiration date is a full calendar day in UTC. Your license runs to the end of the named day,
wherever you are.

### Perpetual keys

A perpetual key works like the 25-character commercial keys: its maintenance date is compared
against the build date of your Handsontable version, never against the current date. You can use the
versions released on or before that date indefinitely, including offline. On a newer version, the
console reports an error and the grid shows a notice below the table.

### Powered by Handsontable DataGrid bar

A trial key, and a key whose license terms ask for it, show a bar below the table that reads
"Powered by Handsontable DataGrid" next to the Handsontable logo. The bar links to
[handsontable.com](https://handsontable.com) and sits below any license message.

The bar is not a warning, so it shows on a key issued for use in an application for external users
too, and no option turns it off. Every other key shows no bar. The grid keeps the height you set:
the bar takes its room from the grid, as the pagination bar does.

## Keys that name a tier

An entitlement key can name one or more tiers. The grid turns on the features of those tiers and
keeps every other feature off. A key that names no tier turns on every feature, as every key did
before 19.0. The 25-character keys also turn on every feature.

The table lists the tiers that include each feature. For prices, see the
[pricing page](https://handsontable.com/pricing).

<!-- license-tiers:start -->

| Feature | Standard | Professional |
| --- | :---: | :---: |
| Data grid | Yes | Yes |
| Async values | Yes | Yes |
| Auto column size | Yes | Yes |
| Auto link | Yes | Yes |
| Auto row header size | Yes | Yes |
| Auto row size | Yes | Yes |
| Autofill | Yes | Yes |
| Bind rows with headers | Yes | Yes |
| Checkbox header | Yes | Yes |
| Collapsible columns | Yes | Yes |
| Column freezing | Yes | Yes |
| Column menu | Yes | Yes |
| Column moving | Yes | Yes |
| Column resizing | Yes | Yes |
| Column sorting | Yes | Yes |
| Column stretching | Yes | Yes |
| Column summary | Yes | Yes |
| Comments | Yes | Yes |
| Context menu | Yes | Yes |
| Copy and paste | Yes | Yes |
| Custom borders | Yes | Yes |
| Data provider | Yes | Yes |
| Dialog | Yes | Yes |
| Drag to scroll | Yes | Yes |
| Empty data state | Yes | Yes |
| Export to file | Yes | Yes |
| Filters | Yes | Yes |
| Formula builder | Yes | Yes |
| Formulas | Yes | Yes |
| Freeze bar | Yes | Yes |
| Hidden columns | Yes | Yes |
| Hidden rows | Yes | Yes |
| Import from file | Yes | Yes |
| Loading | Yes | Yes |
| Merge cells | Yes | Yes |
| Move cells | Yes | Yes |
| Multi-column sorting | Yes | Yes |
| Nested headers | Yes | Yes |
| Nested rows | Yes | Yes |
| Notifications | Yes | Yes |
| Pagination | Yes | Yes |
| Row moving | Yes | Yes |
| Row resizing | Yes | Yes |
| Row selection | Yes | Yes |
| Search | Yes | Yes |
| Selection handles | Yes | Yes |
| Sheets bar | Yes | Yes |
| Trim rows | Yes | Yes |
| Undo and redo | Yes | Yes |
| View state | Yes | Yes |
| Cell type: Autocomplete | Yes | Yes |
| Cell type: Checkbox | Yes | Yes |
| Cell type: Date | Yes | Yes |
| Cell type: Date (Intl) | Yes | Yes |
| Cell type: Date and time (Intl) | Yes | Yes |
| Cell type: Dropdown | Yes | Yes |
| Cell type: Handsontable | Yes | Yes |
| Cell type: Multiselect | Yes | Yes |
| Cell type: Numeric | Yes | Yes |
| Cell type: Password | Yes | Yes |
| Cell type: Select | Yes | Yes |
| Cell type: Text | Yes | Yes |
| Cell type: Time | Yes | Yes |
| Cell type: Time (Intl) | Yes | Yes |
| XLSX export | Yes | Yes |
| XLSX import | Yes | Yes |
| XLSX: Cell styles | No | Yes |
| XLSX: Comments | No | Yes |
| XLSX: Conditional formatting | No | Yes |
| XLSX: Data validation | No | Yes |
| XLSX: Formulas | Yes | Yes |
| XLSX: Import report | Yes | Yes |
| XLSX: Number formats | No | Yes |
| XLSX: Sheet layout | Yes | Yes |
| XLSX: Sheet protection | No | Yes |

<!-- license-tiers:end -->

When your key names a tier and your grid turns on a plugin that tier does not include:

- The plugin stays off. The rest of the grid works, and the grid is not locked.
- The console shows one error, and the same message appears below the grid. See
  [Feature not included in the license key](#feature-not-included-in-the-license-key).
- The option keeps the value you set, so `getSettings()` still returns it. Pass a key whose tier
  includes the feature through [`updateSettings()`](@/api/core.md#updatesettings), and the plugin
  turns on.
- The plugin's methods work as they do for a plugin whose option is off. Some of them throw, because
  the plugin never started, so do not call the methods of a plugin your tier does not include.

This applies to the plugins that are on by default too: [`CopyPaste`](@/api/copyPaste.md),
[`UndoRedo`](@/api/undoRedo.md), [`Autofill`](@/api/autofill.md),
[`AutoColumnSize`](@/api/autoColumnSize.md), and [`DragToScroll`](@/api/dragToScroll.md).

Four plugins are on in every grid: [`ExportFile`](@/api/exportFile.md),
[`ImportFile`](@/api/importFile.md), [`ViewState`](@/api/viewState.md), and
[`CheckboxHeader`](@/api/checkboxHeader.md). They check the key when you use them. A method of
`ExportFile`, `ImportFile`, or `ViewState` that your tier does not cover throws an error with the
same message, and a header checkbox your tier does not cover is not drawn.

A key issued for use in an application for external users silences the console and the bar, so on
such a key a missing feature is off with no message.

Tiers can be added after your version of Handsontable is released. Your version does not know such
a tier, so a key that names only that tier turns off the plugins and the parts of the XLSX add-on in
the table, and reports them as missing. The grid itself keeps working. To use the key, upgrade to a
Handsontable version released after the tier was added.

The `handsontable` package lists every feature with the tiers that include it in
`dist/manifest.json`.

## XLSX add-on

An additional add-on extends Excel import and export. Available as a bundle, it carries formulas,
styles, layout (column widths, row heights, merged cells, and frozen panes), number formats,
comments, conditional formatting, data validation, and sheet protection into and out of `.xlsx`
files. The tier your key names decides which parts of the add-on are on. The table in
[Keys that name a tier](#keys-that-name-a-tier) lists them in the rows that start with `XLSX`. See the
[pricing page](https://handsontable.com/pricing) for prices.

A key that names no tier includes the whole add-on, so keys issued before 19.0 work as before. When
your tier leaves out part of the add-on, an import or export skips that part, does the rest, and
prints one console warning that names what it skipped. An import also reports each skipped part on
`result.dropped` as a `license:xlsx:<id>` entry. See the
[Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md).

## Result

Your grid is now licensed. A valid commercial key removes the license notice from the grid header.

## The validation process

We validate the license key to determine whether you are entitled to use the software. To do that, we compare the time between two dates. These dates come from two sources of information. One is the `build date` that is provided in each version of Handsontable. The other is the `creation date` that comes with the license key. This process does not trigger any connection to any server.

Entitlement keys extend this process. A trial or subscription key carries its expiration date inside the key, and Handsontable compares that date against the current date, in UTC. A perpetual key keeps the build-date comparison described above. No key triggers any connection to any server.

## Notifications

If your license key is missing, invalid, or expired, Handsontable displays a notification. Where it appears depends on the problem.

A **missing or invalid key** blocks the grid. Handsontable covers it with a modal that cannot be closed, and repeats the message in the console. Create the instance with a valid key to remove it. The grid is not usable until you do.

<span class="img-light">

![The blocking modal for a missing license key, light theme](/img/pages/license-key/missing-license-key-light.png)

</span>

<span class="img-dark">

![The blocking modal for a missing license key, dark theme](/img/pages/license-key/missing-license-key-dark.png)

</span>

The modal covers only the grid. The rest of your page keeps working. The modal does not appear on this site, so this page shows it as an image.

An **expired key** does not block anything. Its message appears below the table and in the console, and every feature keeps working.

A **key that does not include a feature** your grid uses blocks nothing either. The feature stays off, and its message appears below the table and in the console. See [Keys that name a tier](#keys-that-name-a-tier).

The messages are as follows:

### Missing license key

Shown in a blocking modal and in the console:

_The license key for Handsontable is missing. Use your purchased key to activate the product.  Read more about it in the documentation or contact us at `[email]`._

### Invalid license key

Shown in a blocking modal and in the console:

_The license key for Handsontable is invalid.  Read more on how to install it properly or contact us at `[email]`._

Since Handsontable 19.0, the `non-commercial-and-evaluation` key, and its second form
`ht68e-1f2b7-47158-70b05-0842f`, show this message too. To keep using Handsontable, pass a key from
[Get a license key](#get-a-license-key).

### Expired license key

Shown below the table and in the console:

_The license key for Handsontable expired on `[expiration_date]`, and is not valid for the installed version `[handsontable_version]`.  Renew your license key or downgrade to a version released prior to `[expiration_dates]`. If you need any help, contact us at `[email]`._

### Feature not included in the license key

Shown below the table and in the console:

_The license key for Handsontable does not include these features: `[features]`. They are turned off. To add them, contact `[email]`._

In the console, `[features]` lists each missing feature as its name and token, for example
`Filters (feat:filters)`. Below the table, it lists the names only, for example `Filters`.

## Get a license key

- **Evaluation:** start a free trial. Get a trial key at [handsontable.com/pricing](https://handsontable.com/pricing/). The trial covers internal evaluation outside production, runs once, and can't be renewed. During the trial, you can contact our technical support team. When it ends, you need a commercial license to keep using Handsontable.
- **Commercial use:** buy a commercial license. Contact our [Sales Team](https://handsontable.com/get-a-quote).
- **Non-commercial projects:** projects such as teaching or academic research may qualify for a free license. To apply, [contact our sales team](https://handsontable.com/contact/) and tell us about your project.

## FAQ

### How do I update the license key in many tables at once?

There's no built-in method to update all existing instances automatically. You have two options:

- **Before creating any instances:** set the key globally so every new instance picks it up.

  ```js
  Handsontable.defaults.licenseKey = 'your-new-key';
  ```

- **For instances that already exist:** Handsontable checks the license key once, when it creates an instance, so [`updateSettings()`](@/api/core.md#updatesettings) does not change the license status, the notices, or the console messages of a running grid. The tiers a key names are the exception: they are read from the current key, so a key passed through `updateSettings()` turns on the features of its tiers and applies to the next XLSX import or export. To apply the whole key, destroy each instance and create it again with the new key, looping through them manually. Re-creating an instance resets its UI state, such as sorting, filters, selection, and undo history.

::: only-for javascript

To re-create an instance, destroy it and construct it again with the new key:

```js
hot1.destroy();
hot1 = new Handsontable(container1, { ...settings1, licenseKey: 'your-new-key' });

hot2.destroy();
hot2 = new Handsontable(container2, { ...settings2, licenseKey: 'your-new-key' });
```

:::

::: only-for react angular vue

The wrapper component creates its instance once, when it mounts. A later change to its `licenseKey` goes through `updateSettings()`, so it changes only which features the key's tiers turn on. Remount the component instead, for example by changing its `key` in React, toggling `*ngIf` in Angular, or toggling `v-if` in Vue.

:::

### What happens if I keep using a stale (expired) license key?

What you can do depends on your license type:

- **Subscription license:** once your subscription expires, you can no longer use Handsontable. Renew your subscription to keep using the grid.
- **Perpetual license:** you can keep using any version of Handsontable that was released _before_ your license expired. You won't be able to upgrade to versions released after that date.

If you load a version that your license doesn't cover, you'll see a [console warning](#expired-license-key) and a watermark on the grid. To keep support and access to updates, keep your license up to date.

### What will I see if I update to a newer version with a stale key?

If your license key is expired and you update to a version of Handsontable released after it expired, you'll see:

- A watermark below the table saying the license is invalid.
- A warning in the browser console (see [Expired license key](#expired-license-key)).

All features still work, but you're not entitled to use that version under an expired license. To remove the warning and watermark, either downgrade to the last version released while your license was still active, or renew the license.

## Related articles

### Related guides

<div class="boxes-list gray">

- [Software license](@/guides/technical-specification/software-license/software-license.md)
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md#what-your-license-unlocks)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md#what-your-license-unlocks)

</div>

### Related API reference

<div class="boxes-list gray">

- Configuration options:
  - [`licenseKey`](@/api/options.md#licensekey)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
