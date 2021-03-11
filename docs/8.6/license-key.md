---
title: License key
permalink: /8.6/license-key
canonicalUrl: /license-key
---

# {{ $frontmatter.title }}

[[toc]]

::: tip
License key is validated in an offline mode. No connection is made to any server.
:::

Starting with version 7.0.0, we require you to pass the license key in the `Settings` object in each instance of Handsontable.

## Installing the license key

Pass your license key in the `Settings` object as shown below. Note that the license key is a string, so you need to wrap it in quotes ('').
```js
const settings = {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: '00000-00000-00000-00000-00000'
}
```

Alternatively, you can pass it to a `licenseKey` prop:

**React**
```jsx
<HotTable settings={settings} licenseKey="00000-00000-00000-00000-00000" />
```

**Angular**
```html
<hot-table [settings]="settings" licenseKey="00000-00000-00000-00000-00000"></hot-table>
```
**Vue**
```html
<hot-table :settings="settings" licenseKey="00000-00000-00000-00000-00000" />
```
## Non-commercial use

If you use Handsontable for purposes not intended toward monetary compensation such as, but not limited to, teaching, academic research, evaluation, testing and experimentation, pass a phrase  `'non-commercial-and-evaluation'`.

```
licenseKey: 'non-commercial-and-evaluation'
```
## The validation process

Validation is done offline so we never make any connection to any server. Each commercial license key keeps several pieces of information encoded inside of it. One such item is an expiration date. To validate your license, we simply compare that date with the release date of your version of Handsontable. If you use a version that was released after the expiration date of your license key, you will see a notification right below the data grid, as well as in the console.

## Notifications

If your license key is missing, invalid or expired, we will display a corresponding notification right below your instance of the data grid and in the console log. Below are the messages you will see, depending on what the issue is.

**License key is missing**

The license key for Handsontable is missing. Use your purchased key to activate the product. Alternatively, you can activate Handsontable to use for non-commercial purposes by passing the key: ‘non-commercial-and-evaluation’.  [Read more](license-key.md)  about it in the documentation or contact us at `[email]`.

**License key is invalid**

The license key for Handsontable is invalid.  [Read more](license-key.md) on how to install it properly or contact us at `[email]`.

**License key has expired**

The license key for Handsontable expired on `[expiration_date]`, and is not valid for the installed version `[handsontable_version]`.  [Renew](https://my.handsontable.com) your license key or downgrade to a version released prior to `[expiration_dates]`. If you need any help, contact us at `[email]`.

## Troubleshooting

If you have any questions or concerns, feel free to contact our [Support Team.](https://handsontable.com/contact?category=technical_support)
