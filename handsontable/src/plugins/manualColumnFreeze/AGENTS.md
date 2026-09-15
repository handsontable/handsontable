# ManualColumnFreeze plugin — freeze a column from the menu

The `manualColumnFreeze` plugin lets the user pin a column to the start of the grid. Read this before
touching `manualColumnFreeze.ts` or `contextMenuItem/`.

It owns **no state of its own**. Freezing is: move the column to the freeze line with
`columnIndexMapper.moveIndexes()`, then change `fixedColumnsStart` by one. `unfreezeColumn` does the
reverse, in the reverse order.

## `_fixedColumnsStart` — writing the private key on purpose

```js
(settings as { _fixedColumnsStart: number })._fixedColumnsStart += 1;
```

Since 12.0.0 `fixedColumnsLeft` is replaced by `fixedColumnsStart`, and **the old name still works**. Using
both together throws, so the plugin writes the *private* `_fixedColumnsStart` key to bypass that validation
rather than touching the public option.

Both `freezeColumn()` and `unfreezeColumn()` do this, and the comment is repeated at both sites. **Do not
"clean it up" to the public key** — that breaks every grid still configured with `fixedColumnsLeft`, which
the breaking-changes policy forbids.

## `freezeColumn()` does not re-render

That is documented on the method. A caller freezing several columns should render once at the end.

## The menu items are registered on TWO hooks

`afterContextMenuDefaultOptions` **and** `afterDropdownMenuDefaultOptions`. The dropdown menu builds its
items from a separate hook, so without the second registration the `freeze_column` / `unfreeze_column` keys
resolve to inert placeholder rows there (issue #5429).

The dropdown registration uses `AFTER_FILTERS_ORDER_INDEX`, which runs it **after** the callbacks at the
default index — keeping the entries below the Filters interface, which registers at the default index and
makes up the bulk of the column menu.

## Two move restrictions, enforced in `beforeColumnMove`

- A column may not be moved **before the freeze line**.
- A **frozen** column may not be moved.

Both are vetoes in the hook, not UI-level guards, so the public `manualColumnMove` API is covered too.

## Open issue: freezing beyond the viewport (#4259)

Freezing more columns than fit the viewport still reproduces on 18.0.0 and on `develop`: the frozen overlay
overflows and covers the master table, so the scrollbar moves but the grid does not. The cause is
Walkontable's `stickyColumnsStart` / `stickyRowsTop` clamping their rendered count against a **count**
rather than against available **width**.

There is no fix in the plugin, and a render-time clamp is a behavior change that needs sign-off. If you are
asked about it: the current recommendation is a documentation note plus a `warnOnce`, not a silent
auto-unfreeze.

## Where to look next

- The plugin whose moves this one vetoes: `../manualColumnMove/AGENTS.md`.
- The two menus it registers into: `../contextMenu/AGENTS.md`, `../dropdownMenu/AGENTS.md`.
- The overlay that renders the frozen area: `../../3rdparty/walkontable/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualColumnFreeze'`
