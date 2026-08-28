---
type: how-to
title: Migrating from 18.0 to 18.1
metaTitle: Migrating from 18.0 to 18.1 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.0 to Handsontable 18.1 -- set a license key in every environment, and update code that reacts to a column-header click.
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

Handsontable 18.1 is a minor release and removes no public API. Four changes still need your
attention: one blocks the grid, one changes what a column-header click does, one makes a
notification appear that 18.0 suppressed, and one changes how the grid decides its layout.

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

## Summary of changes

| Change | Who is affected | Action required |
| --- | --- | --- |
| A missing or invalid license key blocks the grid with a modal that cannot be closed | Any instance running without a valid key, including local, CI, test, and demo environments | Pass a valid [`licenseKey`](@/api/options.md#licensekey), or `'non-commercial-and-evaluation'` for non-commercial use |
| Column sorting runs on mouse up, and only the header label and its sort indicator sort on click | Tests or scripts that dispatch `mousedown` on a header cell to sort | Dispatch `mousedown` and `mouseup` on the `.colHeader.sortAction` label, without moving the pointer |
| `beforeColumnMove` and `afterColumnMove` no longer fire on a plain header click | Code using either hook to detect a header click | Use [`afterColumnSort`](@/api/hooks.md#aftercolumnsort) or [`afterOnCellMouseUp`](@/api/hooks.md#afteroncellmouseup) instead |
| Expired license keys are detected again | Instances running a key past its date | Nothing in code. Renew the license to remove the notice |
| The grid renders in a single pass and predicts scrollbars instead of measuring them | Plugins whose content size depends on the viewport, and custom renderers or CSS that resize a cell after it is measured | Nothing, unless the layout renders differently. Return `false` from [`modifySinglePassLayout`](@/api/hooks.md#modifysinglepasslayout) to restore the 18.0 path |

## Result

Your application now runs on Handsontable 18.1.

## Related resources

- [License key](@/guides/getting-started/license-key/license-key.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Column moving](@/guides/columns/column-moving/column-moving.md)
- [Configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
