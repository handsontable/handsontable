---
type: how-to
title: Migrating from 18.0 to 18.1
metaTitle: Migrating from 18.0 to 18.1 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.0 to Handsontable 18.1 -- set a license key in every environment, update code that reacts to a column-header click, and adjust a custom sanitizer.
permalink: /migration-from-18.0-to-18.1
canonicalUrl: /migration-from-18.0-to-18.1
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.0 to 18.1 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.0 to 18.1 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.0 to 18.1 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

Migrate from Handsontable 18.0 to Handsontable 18.1.

Handsontable 18.1 is a minor release and removes no public API. Seven changes still need your
attention. One blocks the grid. Three change existing behavior: what a column-header click does, how
the grid decides its layout, and how the loading plugin renders two of its options. One makes a
notification appear that 18.0 suppressed. The last two concern the
[`sanitizer`](@/api/options.md#sanitizer) option and reach you only if you set one.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

## 1. Set a license key in every environment

A missing or invalid [license key](@/guides/getting-started/license-key/license-key.md) now blocks
the grid. Handsontable covers it with a modal that cannot be closed and repeats the message in the
console. In 18.0 the same two states only added a notice below the grid, and the grid stayed fully
usable.

An expired key still does not block anything. Neither does a lapsed subscription: after its
expiration date the console reports an error and every feature keeps working, so a paying customer
is never locked out.

### Who is affected

You are affected if a Handsontable instance runs anywhere without a valid key. In practice that
means one of these:

- You never set [`licenseKey`](@/api/options.md#licensekey), for example because 18.0 let the grid
  work with a notice below it.
- You set `licenseKey` in production but not in local development, in CI, in an end-to-end test
  suite, or in a Storybook or demo build. These are the setups most likely to break on upgrade,
  because the block appears where nobody looked at the notice before.
- You set a key that Handsontable cannot read, for example a truncated one, a key for another
  product, or a placeholder such as an empty string.

### How to migrate

Pass a valid key to every instance, in every environment.

For commercial use, pass your purchased key:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  licenseKey: 'your-license-key',
});
```

:::

::: only-for react

```jsx
<HotTable licenseKey="your-license-key" />
```

:::

::: only-for angular

```html
<hot-table [settings]="{ licenseKey: 'your-license-key' }"></hot-table>
```

:::

::: only-for vue

```html
<hot-table :settings="{ licenseKey: 'your-license-key' }"></hot-table>
```

:::

For non-commercial or evaluation use, pass the non-commercial key. It is a valid key, so it does not
block the grid:

::: only-for javascript

```js
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

::: only-for react

```jsx
<HotTable licenseKey="non-commercial-and-evaluation" />
```

:::

::: only-for angular

```html
<hot-table [settings]="{ licenseKey: 'non-commercial-and-evaluation' }"></hot-table>
```

:::

::: only-for vue

```html
<hot-table :settings="{ licenseKey: 'non-commercial-and-evaluation' }"></hot-table>
```

:::

::: tip

Handsontable reads the license key once, when the instance initializes. Passing a new
`licenseKey` through [`updateSettings()`](@/api/core.md#updatesettings) does not re-evaluate the
license. To apply a different key, create the instance again.

:::

## 2. Update code that reacts to a column-header click

A click on a column header used to sort on mouse down, anywhere in the header cell. In 18.1 it sorts
on mouse up, and only the header label and its sort indicator respond. Pressing the header around
the label selects the column without sorting it, which is what makes it possible to select a column
and drag it in the same gesture. Handsontable tells a click from a drag by whether the pointer moves.

As part of the same change, [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and
[`afterColumnMove`](@/api/hooks.md#aftercolumnmove) now run only when the pointer actually drags a
column. In 18.0 both fired on a plain header click, even though no column moved.

### Who is affected

You are affected if either of these applies:

- You have automated tests or scripts that sort a column by dispatching a `mousedown` event on a
  column header, or by clicking the header cell rather than its label.
- You use `beforeColumnMove` or `afterColumnMove` to detect a column-header click, rather than an
  actual column move.

### How to migrate -- simulated header clicks

Dispatch a full press and release, and target the header label. The label carries the `sortAction`
class whenever clicking it sorts the column.

Before:

```js
const header = hot.rootElement.querySelector('thead th:nth-child(2)');

header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
```

After:

```js
const header = hot.rootElement.querySelector('thead th:nth-child(2)');
const sortLabel = header.querySelector('.colHeader.sortAction');

sortLabel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
sortLabel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
```

Do not move the pointer between the two events. A pointer move turns the gesture into a column drag
instead of a sort.

If your tests drive a real browser, click the label element itself. A click at the center of the
header cell no longer sorts, because the label is sized to its content rather than filling the cell.

### How to migrate -- column-move hooks used as click handlers

Move the logic to a hook that still fires on a click. Use
[`afterColumnSort`](@/api/hooks.md#aftercolumnsort) to react to the sort, or
[`afterOnCellMouseUp`](@/api/hooks.md#afteroncellmouseup) to react to the click itself.

Before:

```js
const hot = new Handsontable(container, {
  afterColumnMove(movedColumns, finalIndex, dropIndex, movePossible, orderChanged) {
    // ran on a plain header click too
    trackHeaderInteraction();
  },
});
```

After:

```js
const hot = new Handsontable(container, {
  afterColumnSort(currentSortConfig, destinationSortConfigs) {
    trackHeaderInteraction();
  },
});
```

Keep `beforeColumnMove` and `afterColumnMove` for the case they now describe: an actual column move.

## 3. Expect expired-key notices to reappear

Handsontable 18.1 detects expired license keys again. In 18.0 that detection silently never ran, so
an expired key produced no notice and no console message.

After you upgrade, a key that is past its date shows a notice below the grid and reports an error in
the console. Nothing is blocked, and every feature keeps working. No configuration change causes
this. The notice appears because the check works again.

### Who is affected

You are affected if you run 18.1 with a key whose date has passed. For a perpetual key that means a
maintenance date earlier than the build date of your Handsontable version. For a subscription key it
means an expiration date in the past.

### How to migrate

Nothing to change in your code. To remove the notice, renew the license and pass the new key.
Contact the [Sales Team](https://handsontable.com/get-a-quote) for a renewal.

## 4. Check custom layout code if the grid renders a wrong scrollbar

Handsontable 18.1 predicts whether scrollbars appear from the cached row heights and column widths.
Handsontable 18.0 rendered the grid, measured the result, and decided from the measurement.

The prediction matches the DOM as long as a cell renders at the size Handsontable cached for it.
When the two differ, the grid can show a scrollbar it does not need, miss one it does need, or leave
the viewport short by a row or a column.

The [`mergeCells`](@/guides/cell-features/merge-cells/merge-cells.md) plugin turns the new path off
for you. A merged cell's height depends on the viewport that the layout is computing, so the
prediction cannot resolve it.

### Who is affected

You are affected if a cell's rendered size is not known before the cell renders:

- You wrote a plugin whose content size depends on the viewport that the layout is computing. This is
  the case `mergeCells` opts out of. No other plugin opts out for you.
- You use a custom renderer or custom CSS that changes a cell's box after Handsontable measured it,
  for example a style rule that overrides a row height.

If your grid renders the same in 18.1 as it did in 18.0, this section does not apply to you. No
configuration change is needed.

### How to migrate

Return `false` from the [`modifySinglePassLayout`](@/api/hooks.md#modifysinglepasslayout) hook to
restore the 18.0 layout path for that instance:

```js
const hot = new Handsontable(container, {
  modifySinglePassLayout() {
    return false;
  },
});
```

From a plugin, register the hook the way `mergeCells` does:

```js
this.addHook('modifySinglePassLayout', () => false);
```

Handsontable reads the hook on every layout pass, so enabling or disabling a plugin through
[`updateSettings()`](@/api/core.md#updatesettings) takes effect without re-creating the grid.

## 5. Expect markup in the loading plugin's `title` and `description` to render as text

The [`loading`](@/api/options.md#loading) plugin renders its `title` and `description` options as
text. Handsontable 18.0 wrote both as HTML, so markup passed in them was interpreted. Markup now
shows up literally.

The plugin's `icon` option is unchanged. It is the one slot that takes markup, which is what lets
you replace the default SVG spinner.

The export progress dialog's title is escaped the same way. It comes from the language dictionary,
so this reaches you only through a custom translation that contains markup.

### Who is affected

You are affected if you pass markup in `loading.title` or `loading.description`, or in the `title` or
`description` you pass to the plugin's [`show()`](@/api/loading.md#show) or
[`update()`](@/api/loading.md#update) methods. A `<br>` between two lines and a `<strong>` around
part of the title are the usual cases.

### How to migrate

Drop the markup and style the text with CSS. The title renders into `.ht-loading__title` and the
description into `.ht-loading__description`.

Before:

```js
const hot = new Handsontable(container, {
  loading: {
    title: 'Loading <strong>sales data</strong>',
    description: 'Step 1 of 3<br>This can take a minute',
  },
});
```

After:

```js
const hot = new Handsontable(container, {
  loading: {
    title: 'Loading sales data',
    description: 'Step 1 of 3. This can take a minute.',
  },
});
```

If you need markup in the loading state, put it in `icon`.

## 6. Update a sanitizer that branches on its `source` argument

This section and the next one concern the [`sanitizer`](@/api/options.md#sanitizer) option. If you
do not set one, neither affects you.

Two of the `source` values your sanitizer receives have changed.

### Nested header measurement: `'innerHTML'` becomes `'header'`

The offscreen pass that measures nested header widths called your sanitizer with `'innerHTML'`,
while the rendered header called it with `'header'`. One label reached your sanitizer under two
different names, so a context-aware sanitizer applied two different rule sets to it, and the
measured width could not match what the user saw. Both now use `'header'`.

`'innerHTML'` is no longer passed by any part of the grid.

### Dialog content: `undefined` becomes `'dialog'`

[Dialog](@/api/dialog.md) content was passed to your sanitizer with **no second argument at all**,
so `source` arrived as `undefined`. It is now `'dialog'`.

If your sanitizer routes on `source` with a `switch` or an `if/else` chain, dialog content moves out
of whatever branch handled `undefined`, usually the default one, and into a `'dialog'` branch you
may not have written. Add one if dialog content needs different treatment from your default.

### Who is affected

You are affected only if your sanitizer tests its second argument. A sanitizer that ignores it needs
no change, and one that already routes unknown sources to a catch-all branch keeps working for
dialogs.

### How to migrate

Delete the `'innerHTML'` branch. The `'header'` branch you already have now covers both passes.

Before:

```js
const hot = new Handsontable(container, {
  sanitizer: (content, source) => {
    if (source === 'header' || source === 'innerHTML') {
      return strict(content);
    }

    return loose(content);
  },
});
```

After:

```js
const hot = new Handsontable(container, {
  sanitizer: (content, source) => {
    if (source === 'header') {
      return strict(content);
    }

    return loose(content);
  },
});
```

## 7. Expect your sanitizer to see two surfaces it never saw before

Two surfaces wrote HTML without consulting the sanitizer. These were bugs, not a change of contract.
The [`sanitizer`](@/api/options.md#sanitizer) option is documented to cover the HTML that
Handsontable writes on your behalf, and a grid that configured a sanitizer was not covered where it
had every reason to expect it was. Handsontable 18.1 closes both.

Nothing here needs action to stay correct, and no code of yours stops working. The section exists
because a sanitizer that does more than strip markup now sees content it never saw before, and in
one case that has a consequence worth knowing about.

### `password` cells, under `'password'`

Cells rendered by the [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md)
cell type were written to the DOM without the sanitizer being consulted. They now go through it.

The rendered value is normally a run of `hashSymbol` characters with no markup in it, so most
sanitizers will return it unchanged. Check this only if your sanitizer rewrites plain text, or if you
produce the displayed value yourself with a custom `valueFormatter` or a `hashSymbol` that contains
markup.

### Handsontable's own clipboard payload, under `'CopyPaste.paste.sourceData'`

When you copy between two Handsontable instances, the grid writes a second clipboard entry alongside
`text/html`. It carries the source data behind the cells, which is what lets an object-valued cell
arrive as an object rather than as its displayed text. That entry was parsed without passing through
your sanitizer. Since any page can write the same clipboard type from its own copy handler, a crafted
clipboard reached the parser unchecked even on a grid that had configured a sanitizer. It is now
sanitized, which is the security fix in this release.

You are affected if you set a `sanitizer` **and** either set
[`parsePastedValue`](@/api/options.md#parsepastedvalue) yourself, or use an `autocomplete`,
`dropdown`, or `multiSelect` column. Those three cell types turn `parsePastedValue` on for you, so
you can be affected without ever having written the option.

A sanitizer that strips unsafe markup, such as DOMPurify, leaves the payload's table intact and
nothing changes. A sanitizer that escapes HTML instead turns that table into text, and the pasted
cell then receives the displayed value rather than the original object.

### How to migrate

If you escape rather than strip, and you want object-valued paste to keep working, pass that one
source through:

```js
const hot = new Handsontable(container, {
  sanitizer: (content, source) => {
    if (source === 'CopyPaste.paste.sourceData') {
      return content;
    }

    return escapeHtml(content);
  },
});
```

This is safe. The payload is parsed into an inert document that cannot load resources or run scripts,
so passing it through does not expose you to injection from a crafted clipboard. It has its own
source precisely so you can make this choice without weakening how you treat real pasted HTML.

Leaving it sanitized is also fine if none of your columns parse pasted values, and it means your
sanitizer sees every clipboard payload, which matters if it does more than filter markup.

## Summary of changes

| Change | Who is affected | Action required |
| --- | --- | --- |
| A missing or invalid license key blocks the grid with a modal that cannot be closed | Any instance running without a valid key, including local, CI, test, and demo environments | Pass a valid [`licenseKey`](@/api/options.md#licensekey), or `'non-commercial-and-evaluation'` for non-commercial use |
| Column sorting runs on mouse up, and only the header label and its sort indicator sort on click | Tests or scripts that dispatch `mousedown` on a header cell to sort | Dispatch `mousedown` and `mouseup` on the `.colHeader.sortAction` label, without moving the pointer |
| `beforeColumnMove` and `afterColumnMove` no longer fire on a plain header click | Code using either hook to detect a header click | Use [`afterColumnSort`](@/api/hooks.md#aftercolumnsort) or [`afterOnCellMouseUp`](@/api/hooks.md#afteroncellmouseup) instead |
| Expired license keys are detected again | Instances running a key past its date | Nothing in code. Renew the license to remove the notice |
| The grid renders in a single pass and predicts scrollbars instead of measuring them | Plugins whose content size depends on the viewport, and custom renderers or CSS that resize a cell after it is measured | Nothing, unless the layout renders differently. Return `false` from [`modifySinglePassLayout`](@/api/hooks.md#modifysinglepasslayout) to restore the 18.0 path |
| The `loading` plugin renders `title` and `description` as text instead of HTML | Grids that pass markup in either option, or in the `title` or `description` passed to `show()` or `update()` | Drop the markup and style `.ht-loading__title` and `.ht-loading__description` with CSS. Use `icon` for markup |
| A sanitizer receives `'header'` instead of `'innerHTML'` for nested header measurement, and `'dialog'` instead of `undefined` for dialog content | Sanitizers that branch on their second argument | Delete the `'innerHTML'` branch. Add a `'dialog'` branch if dialog content needs one |
| `password` cells and Handsontable's own clipboard payload now pass through the sanitizer | Grids with a `sanitizer`, and, for the clipboard payload, [`parsePastedValue`](@/api/options.md#parsepastedvalue) or an `autocomplete`, `dropdown`, or `multiSelect` column | Nothing, unless your sanitizer escapes HTML rather than stripping it. Then pass `'CopyPaste.paste.sourceData'` through |

## Result

Your application now runs on Handsontable 18.1.

## Related resources

- [License key](@/guides/getting-started/license-key/license-key.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Column moving](@/guides/columns/column-moving/column-moving.md)
- [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
- [Security](@/guides/security/security/security.md)
- [Loading](@/guides/dialog/loading/loading.md)
