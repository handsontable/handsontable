---
type: how-to
title: License key
metaTitle: License key - JavaScript Data Grid | Handsontable
description: Activate Handsontable, passing your license key in the configuration object. Use a special key for non-commercial and evaluation purposes.
permalink: /license-key
canonicalUrl: /license-key
react:
  metaTitle: License key - React Data Grid | Handsontable
angular:
  metaTitle: License key - Angular Data Grid | Handsontable
vue:
  metaTitle: License key - Vue Data Grid | Handsontable
searchCategory: Guides
category: Getting started
menuTag: updated
---
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

## Non-Commercial license

If you use Handsontable for purposes not intended toward monetary compensation such as, but not limited to, teaching, academic research, evaluation, testing and experimentation, pass the string  `'non-commercial-and-evaluation'`.

With this key, the grid shows the Handsontable badge in its top-left corner. The badge is the only marker of this license - it has no tooltip, and the grid displays no other message, because the Non-Commercial and Evaluation License permits your usage.

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

::: only-for angular

Pass the license key through `GridSettings` in your component:

```ts
import {
  GridSettings,
  NON_COMMERCIAL_LICENSE,
} from "@handsontable/angular-wrapper";

readonly gridSettings: GridSettings = {
  licenseKey: NON_COMMERCIAL_LICENSE,
};
```

```html
<hot-table [settings]="gridSettings" />
```

Or set it globally for all tables via `HOT_GLOBAL_CONFIG` in `app.config.ts`:

```ts
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import {
  HOT_GLOBAL_CONFIG,
  HotGlobalConfig,
  NON_COMMERCIAL_LICENSE,
} from "@handsontable/angular-wrapper";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
```

:::

::: only-for vue

```html
<HotTable licenseKey="non-commercial-and-evaluation" />
```

:::

## Typed license keys

Handsontable also accepts typed license keys. A typed key is a long, self-descriptive string. Its prefix tells you which license terms apply: `[TRIAL]`, `[FREE]`, `[SUB]`, or `[PERP]`. Pass the whole key string, exactly as you received it, in the same [`licenseKey`](@/api/options.md#licensekey) option:

::: only-for javascript

```js
const settings = {
  licenseKey: '[SUB]_this_{Handsontable}_key_is_granted_under_a_subscription_license___...',
  //... other options
}
```

:::

::: only-for react

```jsx
<HotTable licenseKey="[SUB]_this_{Handsontable}_key_is_granted_under_a_subscription_license___..." />
```

:::

::: only-for angular

```ts
import { GridSettings } from "@handsontable/angular-wrapper";

readonly gridSettings: GridSettings = {
  licenseKey: '[SUB]_this_{Handsontable}_key_is_granted_under_a_subscription_license___...',
};
```

:::

::: only-for vue

```html
<HotTable licenseKey="[SUB]_this_{Handsontable}_key_is_granted_under_a_subscription_license___..." />
```

:::

Keys issued in the 25-character format keep working without any change.

Each key type behaves differently around its expiration date:

### Trial keys

A `[TRIAL]` key is time-boxed. During the trial, the grid shows the Handsontable badge in its top-left corner, and the console warns how many days remain. Hover over the badge to see the trial status. After the expiration date, a message opens next to the badge and below the grid, and the console reports an error. When the grace period stored in the key also passes, a blocking screen replaces the grid. To purchase a commercial license, contact our [Sales Team](https://handsontable.com/get-a-quote).

### Free-plan keys

A `[FREE]` key never expires. The grid shows the Handsontable badge in its top-left corner, with an upgrade tooltip on hover. The badge is the visible marker of the Free plan - upgrading to a commercial key removes it. The console stays silent.

### Subscription keys

The console warns when your `[SUB]` key expires in 60 days or less. After the expiration date, the console reports an error with the date the software becomes inactive. During that grace period, the grid itself displays no message.

What happens after the grace period depends on the deployment model stored in your key. Keys issued for internal use show a dialog over the grid. You can close the dialog and keep working while your organization renews the license. Keys issued for SaaS products - where the grid is part of a product sold to your own customers - never show any message in the grid. The console error is the only signal.

To renew your subscription, contact our [Sales Team](https://handsontable.com/get-a-quote).

### Perpetual keys

A `[PERP]` key works like the 25-character commercial keys: its maintenance end date is compared against the build date of your Handsontable version, never against the current date. You can use the versions released within your maintenance period indefinitely, including offline.

## The validation process

We validate the license key to determine whether you are entitled to use the software. To do that, we compare the time between two dates. These dates come from two sources of information. One is the `build date` that is provided in each version of Handsontable. The other is the `creation date` that comes with the license key. This process does not trigger any connection to any server.

Typed keys extend this process. Trial and subscription keys carry their expiration date inside the key, and Handsontable compares that date against the current date. Free-plan keys never expire. Perpetual keys keep the build-date comparison described above. No key type triggers any connection to any server.

## Notifications

If your license key is missing, invalid, or expired, Handsontable will display an appropriate notification. The notification is displayed in two places, below the table as HTML text and in the console.

For a missing or invalid key, the grid also shows the Handsontable badge in its top-left corner, with a hover tooltip that explains the problem. For an expired key, the badge tooltip opens on its own with the expiration date, and you can dismiss it.

The messages are as follows:

### Missing license key

_The license key for Handsontable is missing. Use your purchased key to activate the product. Alternatively, you can activate Handsontable to use for non-commercial purposes by passing the key: ‘non-commercial-and-evaluation’.  Read more about it in the documentation or contact us at `[email]`._

### Invalid license key

_The license key for Handsontable is invalid.  Read more on how to install it properly or contact us at `[email]`._

### Expired license key

_The license key for Handsontable expired on `[expiration_date]`, and is not valid for the installed version `[handsontable_version]`.  Renew your license key or downgrade to a version released prior to `[expiration_dates]`. If you need any help, contact us at `[email]`._

## Get a license key

To get a commercial license key for your Handsontable copy, contact our [Sales Team](https://handsontable.com/get-a-quote).

## Result

Your grid is now licensed. A valid commercial key removes the license notice from the grid header.

## Related articles

### Related guides

<div class="boxes-list gray">

- [Software license](@/guides/technical-specification/software-license/software-license.md)

</div>

### Related API reference

<div class="boxes-list gray">

- Configuration options:
  - [`licenseKey`](@/api/options.md#licensekey)

</div>
