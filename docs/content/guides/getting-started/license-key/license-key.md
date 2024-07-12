---
id: zbx8ayzw
title: License key
metaTitle: License key - JavaScript Data Grid | Handsontable
description: Activate Handsontable, passing your license key in the configuration object. Use a special key for non-commercial and evaluation purposes.
permalink: /license-key
canonicalUrl: /license-key
react:
  id: vyfski60
  metaTitle: License key - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# License key

Activate Handsontable, passing your license key in the configuration object. Use a special key for non-commercial and evaluation purposes.

[[toc]]

## Overview

Handsontable is available under Commercial and Free licenses, depending on your usage.

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

## Non-Commercial license

If you use Handsontable for purposes not intended toward monetary compensation such as, but not limited to, teaching, academic research, evaluation, testing and experimentation, pass the string  `'non-commercial-and-evaluation'`.

::: only-for javascript

```js
const settings = {
  licenseKey: 'non-commercial-and-evaluation',
  //... other options
}
```

:::

::: only-for react

```jsx
<HotTable 
  autoWrapRow={true}
  autoWrapCol={true}
  licenseKey="non-commercial-and-evaluation" />
```

:::

## The validation process

We validate the license key to determine whether you are entitled to use the software. To do that, we compare the time between two dates. These dates come from two sources of information. One is the `build date` that is provided in each version of Handsontable. The other is the `creation date` that comes with the license key. This process does not trigger any connection to any server.

## Notifications

If your license key is missing, invalid, or expired, Handsontable will display an appropriate notification. The notification is displayed in two places, below the table as HTML text and in the console. The messages are as follows:

### Missing license key

_The license key for Handsontable is missing. Use your purchased key to activate the product. Alternatively, you can activate Handsontable to use for non-commercial purposes by passing the key: ‘non-commercial-and-evaluation’.  Read more about it in the documentation or contact us at `[email]`._

### Invalid license key

_The license key for Handsontable is invalid.  Read more on how to install it properly or contact us at `[email]`._

### Expired license key

_The license key for Handsontable expired on `[expiration_date]`, and is not valid for the installed version `[handsontable_version]`.  Renew your license key or downgrade to a version released prior to `[expiration_dates]`. If you need any help, contact us at `[email]`._

## Get a license key

To get a commercial license key for your Handsontable copy, contact our [Sales Team](https://handsontable.com/get-a-quote).

## Related articles

### Related guides

<div class="boxes-list gray">
 
- [Software license](@/guides/technical-specification/software-license/software-license.md)

</div>

### Related API reference

- Configuration options:
  - [`licenseKey`](@/api/options.md#licensekey)
