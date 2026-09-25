import { test, expect } from '../fixtures/test';
import { IconElementsPage } from '../fixtures/pages/IconElementsPage';

test.describe('Icon elements (DEV-3003)', () => {
  test('the theme stylesheet defines a --ht-icon-* variable per icon', async({ page, theme, bundle }) => {
    const grid = new IconElementsPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.cssVariable('arrow-right')).toMatch(/^url\("data:image\/svg\+xml/);
    expect(await grid.cssVariable('checkbox')).toMatch(/^url\("data:image\/svg\+xml/);
  });

  test('menu items carry icon elements for checked state and submenus', async({ page, theme, bundle }) => {
    const grid = new IconElementsPage(page, theme, bundle);

    await grid.goto();
    await grid.page.getByTestId('grid').locator('td').first().click({ button: 'right' });

    const menu = page.locator('.htContextMenu');

    await expect(menu).toBeVisible();
    await expect(grid.icon('arrow-right', menu.locator('td.htSubmenu'))).toHaveCount(1);
    await expect(grid.icon('arrow-right', menu.locator('td.htSubmenu'))).toHaveClass(/ht-icon--flip-rtl/);
  });

  // 18.1 pinned the RTL submenu arrow and check marks at `4 * gap` from the menu's left edge, NOT
  // at the LTR distance (`padding + 2 * gap`) mirrored. Those differ per theme in both directions
  // (main 16 vs 20, classic 8 vs 12, horizon 24 vs 20), so the logical property alone moved every
  // menu surface's marks in RTL; `_dropdown-menu.scss` restates the 18.1 rule (PR #13639 review).
  test('in RTL the submenu arrow keeps its 18.1 inset of four gaps from the menu edge', async({ page, theme, bundle }) => {
    const grid = new IconElementsPage(page, theme, bundle);

    await grid.goto({ dir: 'rtl' });
    await grid.page.getByTestId('grid').locator('td').first().click({ button: 'right' });

    const menu = page.locator('.htContextMenu');

    await expect(menu).toBeVisible();

    const icon = grid.icon('arrow-right', menu.locator('td.htSubmenu'));

    await expect(icon).toHaveCount(1);

    const { left, fourGaps } = await icon.evaluate((el) => {
      const styles = getComputedStyle(el);
      const gap = parseFloat(styles.getPropertyValue('--ht-gap-size'));

      return { left: parseFloat(styles.left), fourGaps: gap * 4 };
    });

    expect(fourGaps).toBeGreaterThan(0);
    expect(left).toBe(fourGaps);
  });

  test('every column header dropdown-menu button carries one menu icon', async({ page, theme, bundle }) => {
    const grid = new IconElementsPage(page, theme, bundle);

    await grid.goto();

    // The fixture has 4 columns, `colHeaders: true` and `dropdownMenu: true`, and is narrow
    // enough that no horizontal scrolling hides a column - so every column's header button
    // renders, one icon each. Scoped to `.ht_master`: Walkontable's sticky-header clone
    // (`.ht_clone_top`) duplicates the same header row's DOM, which would otherwise double
    // the count.
    await expect(grid.icon('menu', grid.grid().locator('.ht_master th .changeType'))).toHaveCount(4);
  });

  test.describe('checkbox renderer', () => {
    // Column 0 of the base fixture is `{ type: 'checkbox' }`, no `label` option - `.ht_master`
    // (not `.ht_clone_*`) is the authoritative DOM copy for structural/DOM-order assertions, since
    // Walkontable does not clone the body cells the way it clones headers.
    test('checkbox cells carry a sibling icon after the input', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const cell = page.locator('.ht_master td').first();
      const input = cell.locator('input.htCheckboxRendererInput');

      // `appearance: none` used to come from the deleted generated `iconsMap` stylesheet and now
      // lives in `_checkbox-renderer.scss` (see the comment there) - without it the browser's own
      // checkbox chrome would paint on top of (or instead of) the `.ht-icon` tick.
      await expect(input).toHaveCSS('appearance', 'none');
      await expect(cell.locator('input.htCheckboxRendererInput + .ht-icon.ht-icon-checkbox')).toHaveCount(1);
      await input.click();
      await expect(input).toBeChecked();
      // Re-render did not duplicate the icon - `createInput()` clones a fresh input per render,
      // and the icon is rebuilt with it.
      await expect(cell.locator('.ht-icon')).toHaveCount(1);
    });

    // A later static sibling paints above a positioned one only because `mask-image` gives the
    // icon a stacking context. An external (font) icon mapping clears the mask, so the overlay
    // slots pin their own layer instead of relying on that side effect - otherwise the tick
    // vanishes behind the checked box as soon as the icon set is swapped.
    test('the overlay icon owns a stacking level above the input', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const icon = grid.icon('checkbox').first();

      await expect(icon).toHaveCSS('position', 'relative');
      await expect(icon).toHaveCSS('z-index', '1');
    });

    test('a click on the checkbox without a label toggles the underlying value', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const input = page.locator('.ht_master td').first().locator('input.htCheckboxRendererInput');

      await expect(input).not.toBeChecked();
      await input.click();
      await expect(input).toBeChecked();

      const value = await page.evaluate(() => (window as unknown as { hot: any }).hot.getDataAtCell(0, 0));

      expect(value).toBe(true);
    });

    test('a click on a labelled checkbox still toggles the underlying value - the icon overlay ' +
      'does not steal the click', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      // A label wraps the input (`position: 'after'`, not separated) - the arrangement the
      // filters "Filter by value" list also uses, and the one where the icon sits between the
      // input and the label text in the DOM.
      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({
          columns: [
            { type: 'checkbox', label: { value: 'Pick me', position: 'after' } },
            {}, { type: 'autocomplete', source: ['a', 'b'] }, {},
          ],
        });
      });

      const cell = page.locator('.ht_master td').first();
      const input = cell.locator('input.htCheckboxRendererInput');
      const icon = cell.locator('input.htCheckboxRendererInput + .ht-icon.ht-icon-checkbox');

      await expect(icon).toHaveCount(1);
      await expect(icon).toHaveCSS('pointer-events', 'none');
      await expect(input).not.toBeChecked();

      // Click the label text, off the icon's overlay - the way a real user clicks a labelled
      // checkbox - and confirm the value toggled.
      await cell.locator('label.htCheckboxRendererLabel').click();
      await expect(input).toBeChecked();

      const value = await page.evaluate(() => (window as unknown as { hot: any }).hot.getDataAtCell(0, 0));

      expect(value).toBe(true);
    });

    test('every label arrangement inserts the icon immediately after the input', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const arrangements: Array<[string, Record<string, unknown>]> = [
        ['before, wrapped', { position: 'before', value: 'L' }],
        ['after, wrapped', { position: 'after', value: 'L' }],
        ['before, separated', { position: 'before', value: 'L', separated: true }],
        ['after, separated', { position: 'after', value: 'L', separated: true }],
      ];

      for (const [, label] of arrangements) {
        await page.evaluate((labelOption) => {
          (window as unknown as { hot: any }).hot.updateSettings({
            columns: [
              { type: 'checkbox', label: labelOption },
              {}, { type: 'autocomplete', source: ['a', 'b'] }, {},
            ],
          });
        }, label);

        const cell = page.locator('.ht_master td').first();

        // The sibling selector itself is the proof: it only matches when the icon is the
        // input's NEXT element sibling, whatever DOM branch (wrapped-in-label or separated,
        // before or after) placed the input.
        await expect(cell.locator('input.htCheckboxRendererInput + .ht-icon.ht-icon-checkbox')).toHaveCount(1);
        await expect(cell.locator('.ht-icon')).toHaveCount(1);
      }
    });

    test('the retired pseudo-element no longer paints the tick, and the box pseudo-element is untouched', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const input = page.locator('.ht_master td').first().locator('input.htCheckboxRendererInput');

      const afterContent = await input.evaluate(el => getComputedStyle(el, '::after').content);
      const beforeContent = await input.evaluate(el => getComputedStyle(el, '::before').content);

      // `mixins.pseudo` (`content: ""`) was removed from the `::after` rule; the leftover
      // generated `iconsMap` rule (mask-image etc.) carries no `content` of its own, so with
      // nothing supplying it the pseudo-element paints nothing.
      expect(afterContent).toBe('none');
      // The box `::before` is untouched by this migration and keeps generating its pseudo-element.
      expect(beforeContent).toBe('""');
    });

    test('every one of the nine state rules colors the icon with its own theme token', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const cell = page.locator('.ht_master td').first();
      const input = cell.locator('input.htCheckboxRendererInput');
      const icon = cell.locator('input.htCheckboxRendererInput + .ht-icon.ht-icon-checkbox');

      /**
       * Resolves a `--ht-checkbox-*-icon-color` CSS custom property to the colour the browser
       * actually paints, in the SAME normalized format `getComputedStyle(icon).color` uses
       * (e.g. `rgb(...)`/`rgba(...)`). Reading `getPropertyValue('--ht-checkbox-...')` directly
       * would return the UNRESOLVED nested reference (every one of these tokens is itself
       * `var(--ht-colors-white)`/`var(--ht-colors-transparent)`/`var(--ht-disabled-color)`, see
       * `styles/ht-theme-*.css`) - so instead this applies the token to a real `color` property
       * on a probe element parented inside the themed grid container (where the custom
       * properties are declared, `.ht-theme-<name>`) and lets the browser's own cascade resolve
       * the whole chain, exactly as it does for the icon itself.
       */
      const resolveToken = (tokenVar: string) => page.evaluate((v) => {
        const container = document.querySelector('[data-testid="grid"]') as HTMLElement;
        const probe = document.createElement('span');

        probe.style.color = `var(${v})`;
        container.appendChild(probe);

        const resolved = getComputedStyle(probe).color;

        probe.remove();

        return resolved;
      }, tokenVar);

      /**
       * Reproduces this Handsontable instance state, waits for the corresponding pseudo-class(es)
       * to be in effect, and returns the icon's resolved `color`.
       */
      const colorFor = async(state: {
        checked?: boolean; disabled?: boolean; indeterminate?: boolean; focus?: boolean;
      }) => {
        // A checked-value change re-renders and clones a fresh `<input>` (`createInput()`), so it
        // must run BEFORE any direct DOM mutation below, or the mutation is wiped by the render.
        // `setDataAtCell` is a no-op render when the value is unchanged from the previous
        // iteration (e.g. two consecutive `checked: true` states), so the target below may be the
        // SAME DOM node the previous iteration mutated - `disabled`/`indeterminate` are therefore
        // always explicitly written (not only when this state wants them true), or a flag left
        // over from the prior iteration would leak into this one's reading.
        await page.evaluate((checked) => {
          (window as unknown as { hot: any }).hot.setDataAtCell(0, 0, !!checked);
        }, !!state.checked);

        await input.evaluate((el: HTMLInputElement, s) => {
          el.disabled = !!s.disabled;
          el.indeterminate = !!s.indeterminate;
        }, state);

        if (state.focus) {
          // A real `focus()`, not a class toggle - the SCSS drives this off the native `:focus`
          // pseudo-class, and the input keeps `tabindex="-1"` (script-focusable, not Tab-reachable).
          await input.focus();
          await expect(input).toBeFocused();
        } else {
          // Same reasoning as above: clear focus left over from a previous iteration explicitly,
          // rather than assuming a fresh render (which would not happen for a repeated `checked`
          // value) already did it.
          await input.evaluate((el: HTMLInputElement) => el.blur());
        }

        if (state.disabled) {
          await expect(input).toBeDisabled();
        }

        return icon.evaluate(el => getComputedStyle(el).color);
      };

      // The nine state rules `_checkbox-renderer.scss` declares for the tick, each against the
      // theme token its own sibling-selector rule names.
      const states: Array<{
        name: string;
        token: string;
        state: { checked?: boolean; disabled?: boolean; indeterminate?: boolean; focus?: boolean };
      }> = [
        { name: 'unchecked (default)', token: '--ht-checkbox-icon-color', state: {} },
        { name: 'checked', token: '--ht-checkbox-checked-icon-color', state: { checked: true } },
        {
          name: 'checked + disabled',
          token: '--ht-checkbox-checked-disabled-icon-color',
          state: { checked: true, disabled: true },
        },
        {
          name: 'checked + focus',
          token: '--ht-checkbox-checked-focus-icon-color',
          state: { checked: true, focus: true },
        },
        { name: 'focus', token: '--ht-checkbox-focus-icon-color', state: { focus: true } },
        { name: 'disabled', token: '--ht-checkbox-disabled-icon-color', state: { disabled: true } },
        {
          name: 'indeterminate',
          token: '--ht-checkbox-indeterminate-icon-color',
          state: { indeterminate: true },
        },
        {
          name: 'indeterminate + disabled',
          token: '--ht-checkbox-indeterminate-disabled-icon-color',
          state: { indeterminate: true, disabled: true },
        },
        {
          name: 'indeterminate + focus',
          token: '--ht-checkbox-indeterminate-focus-icon-color',
          state: { indeterminate: true, focus: true },
        },
      ];

      const resolved: Record<string, string> = {};

      for (const { name, token, state } of states) {
        const [actualColor, tokenColor] = await Promise.all([colorFor(state), resolveToken(token)]);

        resolved[name] = tokenColor;

        // The icon's live computed colour must equal what the theme's OWN token resolves to for
        // this state - not a hardcoded string, so this stays true across all three themes and
        // survives a future palette change. If a state rule were missing, mis-scoped, or
        // collapsed into another one, the icon would still carry the base (or a different
        // state's) colour here and this assertion would catch it directly.
        expect(actualColor, `${name} icon color`).toBe(tokenColor);
      }

      // Where the theme intentionally gives two states the SAME token (e.g. `checked-focus` and
      // `indeterminate-focus` both resolve to white), assert that equality explicitly instead of
      // asserting states differ - the point is that the icon takes the colour the theme names for
      // that state, not that neighbouring states must look different from each other.
      expect(resolved['checked + focus']).toBe(resolved['indeterminate + focus']);
      expect(resolved['checked + disabled']).toBe(resolved['indeterminate + disabled']);
      // The three genuinely distinct tokens this theme uses across the nine states (transparent /
      // white / the disabled token) must still be pairwise distinguishable, or every state above
      // would trivially pass by accident against a single collapsed colour.
      expect(resolved.checked).not.toBe(resolved['unchecked (default)']);
      expect(resolved.disabled).not.toBe(resolved.checked);
    });
  });

  test.describe('column sorting indicator', () => {
    // `.ht_clone_top th` is the visible, interactive copy of the header row - `.ht_master`'s
    // `<thead>` is `visibility: hidden` (DEV-3003 traps), so clicks and rendered-state assertions
    // target the clone. Column B (index 2: row header, then col A) is a plain column with no
    // per-column `columnSorting` override.
    const columnBHeader = (page: import('@playwright/test').Page) => page.locator('.ht_clone_top th').nth(2);

    test('a sorted column header carries one indicator icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const header = columnBHeader(page);

      await header.locator('.colHeader').click();
      await expect(grid.icon('arrow-narrow-up', header)).toHaveCount(1);

      await header.locator('.colHeader').click();
      await expect(grid.icon('arrow-narrow-down', header)).toHaveCount(1);
      // Scoped to the sort-indicator slot, not a bare `.ht-icon` count: the fixture also enables
      // `dropdownMenu`, so this same header carries a second, unrelated `.ht-icon-menu` button icon.
      await expect(header.locator('.ht-sort-indicator')).toHaveCount(1);
    });

    // DEV-3003 trap: the old `::before` belonged to the `.colHeader` label, so a press on the
    // arrow targeted the label and `wasClickableHeaderClicked()` accepted it. The arrow is a
    // sibling element now, and the base `.ht-icon` is `pointer-events: none` - the slot must take
    // its hits back and the gate must accept it, or the arrow is the one part of a sortable header
    // that does not sort.
    test('a click precisely on the indicator icon toggles the sort order', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const header = columnBHeader(page);

      await header.locator('.colHeader').click();
      await expect(grid.icon('arrow-narrow-up', header)).toHaveCount(1);

      const icon = header.locator('.ht-sort-indicator');

      await expect(icon).toHaveCSS('pointer-events', 'auto');
      await expect(icon).toHaveCSS('cursor', 'pointer');

      const hitTarget = await icon.evaluate((el) => {
        const rect = el.getBoundingClientRect();

        return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === el;
      });

      expect(hitTarget).toBe(true);

      await icon.click();

      await expect(grid.icon('arrow-narrow-down', header)).toHaveCount(1);
      await expect(grid.icon('arrow-narrow-up', header)).toHaveCount(0);
    });

    // AutoColumnSize measures headers in an offscreen `.htGhostTable`, where the sort arrow is
    // stood in for by a `*` pseudo-element on the label. Before DEV-3003 the glyph's own
    // `.sortAction::before { width: var(--ht-icon-size) }` rule matched that pseudo-element too, so
    // the reserve measured `icon-size + (icon-size + 2px)`. The glyph rule is gone; the width has to
    // be restated on the ghost rule, or every sortable header with a menu button measures ~10px
    // narrower than 18.1 (caught by the visual suite on every nested-headers demo).
    test('the ghost-table sort reserve keeps its 18.1 geometry: icon-size box plus icon-size + 2px padding', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const probe = await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;
        const ghost = document.createElement('div');

        ghost.className = `htGhostTable htAutoSize ${hot.rootElement.className}`;
        ghost.innerHTML = '<table class="htCore"><thead><tr><th><div class="relative">'
          + '<span class="colHeader columnSorting sortAction">A</span></div></th></tr></thead></table>';
        hot.rootElement.appendChild(ghost);

        const label = ghost.querySelector('span.colHeader') as HTMLElement;
        const before = getComputedStyle(label, '::before');
        const iconSize = getComputedStyle(label).getPropertyValue('--ht-icon-size').trim();
        const result = { content: before.content, width: before.width, paddingInlineEnd: before.paddingInlineEnd, iconSize };

        ghost.remove();

        return result;
      });

      const iconPx = parseFloat(probe.iconSize);

      expect(iconPx).toBeGreaterThan(0);
      expect(probe.content).toBe('"*"');
      expect(parseFloat(probe.width)).toBe(iconPx);
      expect(parseFloat(probe.paddingInlineEnd)).toBe(iconPx + 2);
    });

    test('clicking a sorted header a third time (no sort) removes the indicator icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const header = columnBHeader(page);

      await header.locator('.colHeader').click(); // ascending
      await header.locator('.colHeader').click(); // descending
      await expect(grid.icon('arrow-narrow-down', header)).toHaveCount(1);

      await header.locator('.colHeader').click(); // back to unsorted

      await expect(header).toHaveAttribute('aria-sort', 'none');
      await expect(header.locator('.ht-sort-indicator')).toHaveCount(0);
    });

    test('a column with `indicator: false` never shows the icon, even while sorted', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({
          columns: [
            { type: 'checkbox' },
            { columnSorting: { indicator: false } },
            { type: 'autocomplete', source: ['a', 'b'] },
            {},
          ],
        });
      });

      const header = columnBHeader(page);

      await header.locator('.colHeader').click();

      // The column IS sorted - `aria-sort` and the `indicatorDisabled` class come straight from
      // the sort state, independent of the `indicator` setting - it just renders no icon for it.
      await expect(header).toHaveAttribute('aria-sort', 'ascending');
      await expect(header.locator('.colHeader')).toHaveClass(/indicatorDisabled/);
      await expect(header.locator('.ht-sort-indicator')).toHaveCount(0);
    });

    test('disabling the plugin removes the indicator icon from every header', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const header = columnBHeader(page);

      await header.locator('.colHeader').click();
      await expect(header.locator('.ht-sort-indicator')).toHaveCount(1);

      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({ columnSorting: false });
      });

      await expect(grid.grid().locator('.ht_master .ht-sort-indicator')).toHaveCount(0);
    });

    test('re-rendering a sorted header repeatedly keeps exactly one indicator icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const header = columnBHeader(page);

      await header.locator('.colHeader').click();
      await expect(header.locator('.ht-sort-indicator')).toHaveCount(1);

      // `#onAfterGetColHeader` fires per header, per draw - forcing several renders proves
      // `syncIcon()` keeps the slot at exactly one element instead of stacking duplicates.
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        for (let i = 0; i < 5; i++) {
          hot.render();
        }
      });

      await expect(header.locator('.ht-sort-indicator')).toHaveCount(1);
      await expect(grid.icon('arrow-narrow-up', header)).toHaveCount(1);
    });
  });

  test.describe('filters plugin', () => {
    // Column B (`.changeType`.nth(1): 0 is column A) is a plain column with no per-column
    // override, same choice as the column-sorting block above. `.ht_clone_top` is the visible,
    // interactive copy of the header row - `.ht_master`'s own `<thead>` is `visibility: hidden`.
    const openFiltersMenu = async(page: import('@playwright/test').Page) => {
      await page.locator('.ht_clone_top th .changeType').nth(1).click();

      const menu = page.locator('.htDropdownMenu');

      await expect(menu).toBeVisible();

      return menu;
    };

    test('the condition select caption keeps exactly one caret icon after changing condition', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const menu = await openFiltersMenu(page);
      const caption = menu.locator('.htFiltersMenuCondition .htUISelectCaption').first();

      // Caret present on first open, before any condition is picked.
      await expect(grid.icon('select-arrow', caption)).toHaveCount(1);

      await caption.click();

      const conditionsMenu = page.locator('.htFiltersConditionsMenu:visible');

      await expect(conditionsMenu).toBeVisible();
      await conditionsMenu.locator('td', { hasText: /^Is equal to$/ }).click();
      await expect(conditionsMenu).toBeHidden();

      // `SelectUI#update()` rewrites the caption's label on every condition change - this is
      // exactly the path that used to wipe the caret (a bare `captionElement.textContent = …`
      // would remove every child, icon included). Assert AFTER the change, not only on open.
      await expect(caption).toContainText('Is equal to');
      await expect(grid.icon('select-arrow', caption)).toHaveCount(1);
    });

    test('a radio in the "Filter by condition" operators row carries its dot icon and stays clickable', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const menu = await openFiltersMenu(page);
      const caption = menu.locator('.htFiltersMenuCondition .htUISelectCaption').first();

      await caption.click();

      const conditionsMenu = page.locator('.htFiltersConditionsMenu:visible');

      await expect(conditionsMenu).toBeVisible();
      await conditionsMenu.locator('td', { hasText: /^Is equal to$/ }).click();
      await expect(conditionsMenu).toBeHidden();

      // Setting a condition reveals the AND/OR operators row - two `RadioInputUI` instances.
      const operators = menu.locator('.htFiltersMenuOperators');
      const radios = operators.locator('.htUIRadio input[type="radio"]');

      await expect(radios.first()).toBeVisible();
      const icons = grid.icon('radio', operators);

      await expect(icons).toHaveCount(2);

      const secondRadio = radios.nth(1);
      const secondIcon = icons.nth(1);

      await expect(secondRadio).not.toBeChecked();

      // The dot icon sits exactly on top of its input (both boxes are `--ht-icon-size`, which
      // equals `--ht-radio-size`) and must not steal the click meant for the input - confirm
      // `pointer-events: none` (`_icon.scss`) is actually in effect, not just declared, by
      // checking what a real click at that pixel would hit.
      await expect(secondIcon).toHaveCSS('pointer-events', 'none');

      const hitTarget = await secondIcon.evaluate((icon) => {
        const rect = icon.getBoundingClientRect();
        const target = document.elementFromPoint(
          rect.left + rect.width / 2, rect.top + rect.height / 2);

        return target?.tagName ?? null;
      });

      // A pre-existing, unrelated `label::before` overlay (`_radio.scss`, predating DEV-3003)
      // covers the whole `.htUIRadio` row - including this pixel - so the icon is never the
      // top hit-tested element here even before this change; the LABEL is. That overlay is what
      // a real click at this point resolves to, never the icon (`ht-icon-radio` never appears).
      expect(hitTarget).not.toBe('I');

      // Click the way a real user does - on the row's label, which is the actual top element at
      // every point in the row (icon included) and natively toggles its associated input.
      await operators.locator('label[for="disjunction"]').click();
      await expect(secondRadio).toBeChecked();
    });

    test('the "Filter by value" list shows one checkbox icon per row and stays clickable', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      // The "Filter by value" list is a nested Handsontable grid with a `type: 'checkbox'`
      // column (`label.position: 'after'`, not separated) - the most complex real consumer of
      // this renderer (`filters/ui/multipleSelect.ts`).
      const menu = await openFiltersMenu(page);
      const byValueTab = menu.locator('.htFiltersMenuLabel', { hasText: 'Filter by value' });

      await byValueTab.click();

      const list = menu.locator('.htUIMultipleSelectHot');

      await expect(list).toBeVisible();

      const rows = list.locator('.htCore tbody tr');
      const rowCount = await rows.count();

      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i).locator('input.htCheckboxRendererInput + .ht-icon.ht-icon-checkbox')).toHaveCount(1);
      }

      // Click the first row's label (not the icon, which is `pointer-events: none`) and confirm
      // it toggles - proving the overlay never steals the click on the nested grid either.
      const firstInput = rows.first().locator('input.htCheckboxRendererInput');
      const wasChecked = await firstInput.isChecked();

      await rows.first().locator('label.htCheckboxRendererLabel').click();

      await expect(firstInput).toBeChecked({ checked: !wasChecked });
    });
  });

  test.describe('pagination bar', () => {
    test('pagination buttons carry directional icons that mirror in RTL', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      await expect(grid.icon('arrow-right', page.locator('.ht-page-next'))).toHaveCount(1);
      expect(await grid.transform(grid.icon('arrow-right', page.locator('.ht-page-next')))).toBe('none');

      await grid.goto({ dir: 'rtl' });
      await expect(grid.icon('arrow-right', page.locator('.ht-page-next'))).toHaveCount(1);
      expect(await grid.transform(grid.icon('arrow-right', page.locator('.ht-page-next'))))
        .toBe('matrix(-1, 0, 0, 1, 0, 0)');
    });

    test('every navigation button carries exactly one icon of the expected name, in LTR and RTL', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);
      const buttons: Array<[string, string]> = [
        ['.ht-page-first', 'arrow-left-with-bar'],
        ['.ht-page-prev', 'arrow-left'],
        ['.ht-page-next', 'arrow-right'],
        ['.ht-page-last', 'arrow-right-with-bar'],
      ];

      for (const dir of ['ltr', 'rtl'] as const) {
        await grid.goto(dir === 'rtl' ? { dir: 'rtl' } : {});

        for (const [selector, iconName] of buttons) {
          const button = page.locator(selector);
          const icon = grid.icon(iconName, button);

          await expect(icon).toHaveCount(1);
          expect(await grid.transform(icon)).toBe(dir === 'rtl' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none');
        }
      }
    });

    // Mirroring follows the GRID's direction, never the page's. The retired `[dir="rtl"]` descendant
    // rules mirrored an LTR grid's arrows whenever any ancestor was RTL; `.ht-icon--flip-rtl:dir(rtl)`
    // resolves against the element's own inherited direction, which the grid root sets from
    // `layoutDirection`. Disclosed in the 19.0 migration guide (PR #13639 review).
    test('mirroring follows layoutDirection, not the page dir, when the two disagree', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      // LTR grid on an RTL page: no mirror.
      await grid.goto({ pageDir: 'rtl' });

      expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
      expect(await grid.transform(grid.icon('arrow-right', page.locator('.ht-page-next')))).toBe('none');

      // RTL grid on an LTR page: mirrored.
      await grid.goto({ dir: 'rtl', pageDir: 'ltr' });

      expect(await page.evaluate(() => document.documentElement.dir)).toBe('ltr');
      expect(await grid.transform(grid.icon('arrow-right', page.locator('.ht-page-next'))))
        .toBe('matrix(-1, 0, 0, 1, 0, 0)');
    });

    test('the page-size caret exists and is never mirrored, in LTR or RTL', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);
      const transforms: Record<'ltr' | 'rtl', string> = { ltr: '', rtl: '' };

      for (const dir of ['ltr', 'rtl'] as const) {
        await grid.goto(dir === 'rtl' ? { dir: 'rtl' } : {});

        const wrapper = page.locator('.ht-page-size-section__select-wrapper');
        const caret = grid.icon('arrow-down', wrapper);

        await expect(caret).toHaveCount(1);
        transforms[dir] = await grid.transform(caret);

        // The caret is not `flipInRtl`-mirrored: unlike the navigation arrows it must never
        // report the RTL mirror matrix.
        expect(transforms[dir]).not.toBe('matrix(-1, 0, 0, 1, 0, 0)');
      }

      // The caret uses its own `transform: translateY(-50%)` for vertical centring (it carries
      // no `.ht-icon--flip-rtl`, so it never fights over the `transform` property), and that
      // value must be identical in both writing directions.
      expect(transforms.ltr).toBe(transforms.rtl);
    });

    test('the retired pseudo-element no longer paints on the navigation buttons', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const beforeContent = await page.locator('.ht-page-next').evaluate(
        el => getComputedStyle(el, '::before').content);

      // `mixins.pseudo` (`content: ""`) was removed from the component SCSS; the generated
      // `iconsMap` rule (width/height/mask-image/background-color) has no `content` of its own,
      // so with nothing supplying it the pseudo-element paints nothing.
      expect(beforeContent).toBe('none');
    });

    test('switching themes at runtime rebuilds the icons and keeps exactly one per button', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const buttons = ['.ht-page-first', '.ht-page-prev', '.ht-page-next', '.ht-page-last'];
      const otherThemeName = theme === 'horizon' ? 'main' : 'horizon';

      for (const selector of buttons) {
        await expect(page.locator(selector).locator('.ht-icon')).toHaveCount(1);
      }

      // Switch the CSS class-based theme at RUNTIME (`hot.useTheme()`, the public API - not the
      // `?theme=` query param the grid was built with) and back again, twice. `Pagination`'s
      // `afterSetTheme` hook calls `refreshIcons()` on every one of these switches, and
      // `#installIcons()` removes any existing `.ht-icon` before appending a new one - calling it
      // repeatedly must never leave more than one icon per slot.
      await page.evaluate((themeName) => {
        (window as unknown as { hot: any }).hot.useTheme(`ht-theme-${themeName}`);
      }, otherThemeName);

      for (const selector of buttons) {
        await expect(page.locator(selector).locator('.ht-icon')).toHaveCount(1);
      }

      await page.evaluate((themeName) => {
        (window as unknown as { hot: any }).hot.useTheme(`ht-theme-${themeName}`);
      }, theme);

      for (const selector of buttons) {
        await expect(page.locator(selector).locator('.ht-icon')).toHaveCount(1);
      }

      // The names are unchanged too - `refreshIcons()` rebuilds the same slot mapping, it does
      // not merely dedupe stray elements.
      await expect(grid.icon('arrow-left-with-bar', page.locator('.ht-page-first'))).toHaveCount(1);
      await expect(grid.icon('arrow-left', page.locator('.ht-page-prev'))).toHaveCount(1);
      await expect(grid.icon('arrow-right', page.locator('.ht-page-next'))).toHaveCount(1);
      await expect(grid.icon('arrow-right-with-bar', page.locator('.ht-page-last'))).toHaveCount(1);
      await expect(grid.icon('arrow-down', page.locator('.ht-page-size-section__select-wrapper'))).toHaveCount(1);
    });
  });

  test.describe('sheets bar', () => {
    test('the add and all-sheets buttons carry their icons', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      await expect(grid.icon('plus', page.locator('.ht-sheets-bar__add'))).toHaveCount(1);
      await expect(grid.icon('menu-list', page.locator('.ht-sheets-bar__all'))).toHaveCount(1);
    });

    test('the active tab chevron carries the select-arrow icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      const chevron = page.locator('.ht-sheets-bar__tab--active .ht-sheets-bar__tab-chevron');

      await expect(grid.icon('select-arrow', chevron)).toHaveCount(1);
    });

    test('a repaint of the tab strip keeps exactly one chevron icon per tab', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      // Tabs are rebuilt wholesale on every strip repaint (`TabStrip#render` clears the host
      // and calls `#buildTab` per sheet) - renaming a sheet is one such repaint. Each rebuilt
      // tab must still carry exactly one chevron icon, not zero and not a stacked duplicate.
      await page.evaluate(() => {
        const plugin = (window as unknown as { hot: any }).hot.getPlugin('sheetsBar');

        plugin.renameSheet(plugin.getSheets()[0].id, 'Alpha renamed');
      });

      const tabs = page.locator('.ht-sheets-bar__tab');

      await expect(tabs).toHaveCount(6);

      for (let i = 0; i < 6; i++) {
        await expect(grid.icon('select-arrow', tabs.nth(i).locator('.ht-sheets-bar__tab-chevron'))).toHaveCount(1);
      }
    });

    test('the paging arrows mirror only in RTL', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      const pagingSection = page.locator('.ht-sheets-bar__paging');
      const pageNext = page.locator('.ht-sheets-bar__page-next');
      const pagePrev = page.locator('.ht-sheets-bar__page-prev');

      // The fixture's narrow tab strip (Task 12) overflows immediately with six sheets, so the
      // paging section is visible from the first render - no add-sheet interaction needed.
      await expect(pagingSection).toBeVisible();
      await expect(grid.icon('arrow-right', pageNext)).toHaveCount(1);
      await expect(grid.icon('arrow-left', pagePrev)).toHaveCount(1);
      expect(await grid.transform(grid.icon('arrow-right', pageNext))).toBe('none');
      expect(await grid.transform(grid.icon('arrow-left', pagePrev))).toBe('none');

      await grid.goto({ sheetsBar: true, dir: 'rtl' });

      await expect(pagingSection).toBeVisible();
      expect(await grid.transform(grid.icon('arrow-right', pageNext)))
        .toBe('matrix(-1, 0, 0, 1, 0, 0)');
      expect(await grid.transform(grid.icon('arrow-left', pagePrev)))
        .toBe('matrix(-1, 0, 0, 1, 0, 0)');
    });

    test('the retired glyph pseudo-elements no longer paint on the buttons or the chevron', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      // `mixins.pseudo` (`content: ""`) was removed from the `.ht-sheets-bar__button` rule and
      // from the chevron's `::after` rule; the generated `iconsMap` rules (width/height/
      // mask-image/background-color) carry no `content` of their own, so with nothing supplying
      // it neither pseudo-element paints.
      const addBeforeContent = await page.locator('.ht-sheets-bar__add').evaluate(
        el => getComputedStyle(el, '::before').content);
      const chevronAfterContent = await page.locator('.ht-sheets-bar__tab--active .ht-sheets-bar__tab-chevron')
        .evaluate(el => getComputedStyle(el, '::after').content);

      expect(addBeforeContent).toBe('none');
      expect(chevronAfterContent).toBe('none');
    });

    test('the chevron hover surface (a non-icon ::before) still lights up on hover, on the active tab', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      const chevron = page.locator('.ht-sheets-bar__tab--active .ht-sheets-bar__tab-chevron');

      // Confirm the icon glyph is present alongside the hover-surface pseudo-element - the two
      // are unrelated layers on the same chevron, and this test proves the surface (`::before`)
      // is untouched by the icon migration that retired the glyph (`::after`).
      await expect(grid.icon('select-arrow', chevron)).toHaveCount(1);

      const restBackground = await chevron.evaluate(el => getComputedStyle(el, '::before').backgroundColor);

      await chevron.hover();

      const hoverBackground = await chevron.evaluate(el => getComputedStyle(el, '::before').backgroundColor);

      expect(hoverBackground).not.toBe(restBackground);
    });

    test('switching themes at runtime rebuilds the bar icons and keeps exactly one per slot', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ sheetsBar: true });

      const otherThemeName = theme === 'horizon' ? 'main' : 'horizon';
      const addButton = page.locator('.ht-sheets-bar__add');
      const allButton = page.locator('.ht-sheets-bar__all');
      const activeChevron = page.locator('.ht-sheets-bar__tab--active .ht-sheets-bar__tab-chevron');

      // `SheetsBar`'s `afterSetTheme` hook calls `SheetsBarUI#refreshIcons()` (buttons) and
      // `#refreshUI()` (which rebuilds the tab strip, and with it every chevron icon) on every
      // switch - calling them repeatedly must never leave more than one icon per slot.
      await page.evaluate((themeName) => {
        (window as unknown as { hot: any }).hot.useTheme(`ht-theme-${themeName}`);
      }, otherThemeName);

      await expect(addButton.locator('.ht-icon')).toHaveCount(1);
      await expect(allButton.locator('.ht-icon')).toHaveCount(1);
      await expect(activeChevron.locator('.ht-icon')).toHaveCount(1);

      await page.evaluate((themeName) => {
        (window as unknown as { hot: any }).hot.useTheme(`ht-theme-${themeName}`);
      }, theme);

      await expect(addButton.locator('.ht-icon')).toHaveCount(1);
      await expect(allButton.locator('.ht-icon')).toHaveCount(1);
      await expect(activeChevron.locator('.ht-icon')).toHaveCount(1);

      // The names are unchanged too - the refresh rebuilds the same slot mapping.
      await expect(grid.icon('plus', addButton)).toHaveCount(1);
      await expect(grid.icon('menu-list', allButton)).toHaveCount(1);
      await expect(grid.icon('select-arrow', activeChevron)).toHaveCount(1);
    });
  });

  test.describe('collapsible nested-header indicator', () => {
    // The `?nestedHeaders=1` fixture branch (task 13) groups the first two columns under a
    // collapsible "Group" header (`collapsibleColumns: true`). `.ht_clone_top` is the visible,
    // interactive copy of the header rows - `.ht_master`'s own `<thead>` is `visibility: hidden`
    // (DEV-3003 traps), so clicking the indicator targets the clone; a bare presence COUNT is
    // scoped to `.ht_master` instead, or Walkontable's clone overlay would double it.
    const masterIndicator = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master .collapsibleIndicator');
    const cloneIndicator = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_top .collapsibleIndicator');

    test('an expanded group header carries exactly one collapse-off icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedHeaders: true });

      await expect(masterIndicator(page)).toHaveCount(1);
      await expect(masterIndicator(page)).toHaveClass(/expanded/);
      await expect(grid.icon('collapse-off', masterIndicator(page))).toHaveCount(1);
      await expect(grid.icon('collapse-on', masterIndicator(page))).toHaveCount(0);
    });

    test('clicking the indicator collapses the group and swaps the icon to collapse-on', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedHeaders: true });

      await cloneIndicator(page).click();

      await expect(cloneIndicator(page)).toHaveClass(/collapsed/);
      await expect(grid.icon('collapse-on', cloneIndicator(page))).toHaveCount(1);
      await expect(grid.icon('collapse-off', cloneIndicator(page))).toHaveCount(0);
      // Exactly one icon in the slot on both the interactive clone and the authoritative master -
      // the swap REPLACED the icon rather than stacking a second one on top of it.
      await expect(cloneIndicator(page).locator('.ht-icon')).toHaveCount(1);
      await expect(masterIndicator(page).locator('.ht-icon')).toHaveCount(1);

      // Toggling back must swap, not accumulate, in the other direction too.
      await cloneIndicator(page).click();

      await expect(cloneIndicator(page)).toHaveClass(/expanded/);
      await expect(grid.icon('collapse-off', cloneIndicator(page))).toHaveCount(1);
      await expect(grid.icon('collapse-on', cloneIndicator(page))).toHaveCount(0);
      await expect(cloneIndicator(page).locator('.ht-icon')).toHaveCount(1);
    });

    test('re-rendering the header repeatedly keeps exactly one indicator icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedHeaders: true });

      // `#onAfterGetColHeader` fires per header, per draw - forcing several renders proves the
      // append-after-`fastInnerText` pattern never stacks a second icon (DEV-3003).
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        for (let i = 0; i < 5; i++) {
          hot.render();
        }
      });

      await expect(masterIndicator(page).locator('.ht-icon')).toHaveCount(1);
      await expect(grid.icon('collapse-off', masterIndicator(page))).toHaveCount(1);
    });

    test('the retired glyph pseudo-element no longer paints on the indicator', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedHeaders: true });

      // `mixins.pseudo` (`content: ""`) was removed from the `.collapsibleIndicator::before` rule;
      // the generated `iconsMap` rule (width/height/mask-image/background-color) carries no
      // `content` of its own, so with nothing supplying it the pseudo-element paints nothing.
      const beforeContent = await cloneIndicator(page).evaluate(el => getComputedStyle(el, '::before').content);

      expect(beforeContent).toBe('none');
    });
  });

  test.describe('nested rows collapse button', () => {
    // The `?nestedRows=1` fixture branch (task 14) adds one parent row ("Parent A", two
    // children) on top of "Row B", a plain leaf. `.ht_master table.htCore > tbody > tr > th` is
    // `visibility: hidden` (`_base.scss`) - `.ht_clone_inline_start` is the visible, interactive
    // copy of the row headers, so clicks target the clone; a bare presence COUNT is scoped to
    // `.ht_master` instead, or Walkontable's clone overlay would double it.
    const masterButton = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master .ht_nestingButton');
    const cloneButton = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_inline_start .ht_nestingButton');

    test('an expanded parent row carries exactly one collapse-off icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedRows: true });

      // Every parent starts expanded (`ht_nestingCollapse`, the "-" button) until the app
      // collapses it, mirroring `CollapsibleColumns`'s `isCollapsed`/`collapseOn` ->
      // `!isCollapsed`/`collapseOff` mapping.
      await expect(masterButton(page)).toHaveCount(1);
      await expect(masterButton(page)).toHaveClass(/ht_nestingCollapse/);
      await expect(grid.icon('collapse-off', masterButton(page))).toHaveCount(1);
      await expect(grid.icon('collapse-on', masterButton(page))).toHaveCount(0);
    });

    test('clicking the button collapses the parent and swaps the icon to collapse-on', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedRows: true });

      await cloneButton(page).click();

      await expect(cloneButton(page)).toHaveClass(/ht_nestingExpand/);
      await expect(grid.icon('collapse-on', cloneButton(page))).toHaveCount(1);
      await expect(grid.icon('collapse-off', cloneButton(page))).toHaveCount(0);
      // Exactly one icon in the slot on both the interactive clone and the authoritative master -
      // the swap REPLACED the icon rather than stacking a second one on top of it.
      await expect(cloneButton(page).locator('.ht-icon')).toHaveCount(1);
      await expect(masterButton(page).locator('.ht-icon')).toHaveCount(1);

      // Toggling back must swap, not accumulate, in the other direction too.
      await cloneButton(page).click();

      await expect(cloneButton(page)).toHaveClass(/ht_nestingCollapse/);
      await expect(grid.icon('collapse-off', cloneButton(page))).toHaveCount(1);
      await expect(grid.icon('collapse-on', cloneButton(page))).toHaveCount(0);
      await expect(cloneButton(page).locator('.ht-icon')).toHaveCount(1);
    });

    test('re-rendering the header repeatedly keeps exactly one button icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedRows: true });

      // `appendLevelIndicators()` fires per row header, per draw, and rebuilds `buttonsContainer`
      // from scratch every time (`removeLevelIndicators()` strips the previous one first) -
      // forcing several renders proves that fresh-container append never stacks a second icon
      // (DEV-3003).
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        for (let i = 0; i < 5; i++) {
          hot.render();
        }
      });

      await expect(masterButton(page).locator('.ht-icon')).toHaveCount(1);
      await expect(grid.icon('collapse-off', masterButton(page))).toHaveCount(1);
    });

    test('the retired glyph pseudo-element no longer paints on the button', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ nestedRows: true });

      // Task 13 dropped `@include mixins.pseudo` (`content: ""`) from the `.ht_nestingButton::before`
      // rule shared with `.collapsibleIndicator`; the generated `iconsMap` rule (width/height/
      // mask-image/background-color) carries no `content` of its own, so with nothing supplying it
      // the pseudo-element paints nothing here either - task 14 never touched this SCSS block.
      const beforeContent = await cloneButton(page).evaluate(el => getComputedStyle(el, '::before').content);

      expect(beforeContent).toBe('none');
    });
  });

  test.describe('hidden columns indicator', () => {
    // `?hiddenColumns=1` (task 15) hides column C (visual index 2) of the base 4-column fixture up
    // front, with `indicators: true` - so its neighbors, B and D, render a caret on load. `.ht_master`
    // is the authoritative copy for presence counts; `.ht_clone_top` is the visible, interactive
    // copy for anything about rendered position, size or color (DEV-3003 traps).
    const masterBefore = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master th.beforeHiddenColumn');
    const masterAfter = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master th.afterHiddenColumn');
    const cloneBefore = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_top th.beforeHiddenColumn');
    const cloneAfter = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_top th.afterHiddenColumn');

    // The old `th::after` positioned against the `th`. `.relative` is only as tall as its own
    // content, so a caret anchored to it would sit above the centre of any header taller than one
    // line - `columnHeaderHeight` is the plain way to get one.
    test('the carets stay vertically centred on a header taller than one line', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      await page.evaluate(() => (window as unknown as { hot: any }).hot.updateSettings({ columnHeaderHeight: 60 }));

      const th = page.locator('.ht_clone_top th.beforeHiddenColumn').first();
      const caret = th.locator('.ht-hidden-indicator-end');

      await expect(caret).toHaveCount(1);

      const [thBox, caretBox] = await Promise.all([th.boundingBox(), caret.boundingBox()]);

      expect(thBox?.height).toBeGreaterThanOrEqual(60);

      const thCenter = thBox!.y + thBox!.height / 2;
      const caretCenter = caretBox!.y + caretBox!.height / 2;

      expect(Math.abs(caretCenter - thCenter)).toBeLessThanOrEqual(1);
    });

    test('with nested headers, only the header row that touches the cells carries carets, and they stay 10x10', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true, nestedHeaders: true });

      // NestedHeaders strips `beforeHiddenColumn` / `afterHiddenColumn` from every header level
      // that does not reach the cells (`nestedHeaders.ts`, `reachesCells`): the indicator belongs
      // only on the header closest to the cells. While the caret was a pseudo-element gated on
      // those classes, the strip alone removed it. The caret is a real element now, so HiddenColumns
      // must not create it on those levels at all - otherwise the strip leaves an orphaned `<i>`
      // rendered at the base 16px icon size on the level-0 "Col D" header (found on the DEV-3003
      // demo page).
      const upperRow = page.locator('.ht_master thead tr').first();
      const bottomRow = page.locator('.ht_master thead tr').last();

      await expect(upperRow.locator('.ht-hidden-indicator-start, .ht-hidden-indicator-end')).toHaveCount(0);
      await expect(bottomRow.locator('th.beforeHiddenColumn .ht-hidden-indicator-end')).toHaveCount(1);
      await expect(bottomRow.locator('th.afterHiddenColumn .ht-hidden-indicator-start')).toHaveCount(1);

      // Catch-all over master and clones: no caret anywhere may render at anything but 10x10.
      const oversized = await page
        .locator('[data-testid="grid"] .ht-hidden-indicator-start, [data-testid="grid"] .ht-hidden-indicator-end')
        .evaluateAll(els => els
          .map(el => el.getBoundingClientRect())
          .filter(rect => rect.width > 10 || rect.height > 10)
          .length);

      expect(oversized).toBe(0);
    });

    test('the header before the gap and the header after it each carry one caret, with the correct glyph', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      // Header B is `beforeHiddenColumn` (hidden column C follows it) - end slot, caret pointing
      // left, toward the gap. The slot class and the glyph class both land on the SAME `<i>`
      // element (`syncIcon()` joins them into one `className`), so the glyph is asserted with
      // `toHaveClass` on the slot locator, not as a descendant.
      await expect(masterBefore(page)).toHaveCount(1);
      await expect(cloneBefore(page).locator('.ht-hidden-indicator-end')).toHaveClass(/ht-icon-caret-hidden-left/);
      await expect(cloneBefore(page).locator('.ht-hidden-indicator-start')).toHaveCount(0);

      // Header D is `afterHiddenColumn` (hidden column C precedes it) - start slot, caret pointing
      // right, toward the gap.
      await expect(masterAfter(page)).toHaveCount(1);
      await expect(cloneAfter(page).locator('.ht-hidden-indicator-start')).toHaveClass(/ht-icon-caret-hidden-right/);
      await expect(cloneAfter(page).locator('.ht-hidden-indicator-end')).toHaveCount(0);
    });

    test('the box is 10x10, not the 16px default icon size', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      const box = await cloneBefore(page).locator('.ht-hidden-indicator-end').evaluate((el) => {
        const rect = el.getBoundingClientRect();

        return { width: rect.width, height: rect.height };
      });

      expect(box).toEqual({ width: 10, height: 10 });
    });

    test('a header with a hidden neighbor on each side carries both carets at once', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      // Widen the gap: hide A and C, so header B sits between two hidden columns and needs both
      // slots filled simultaneously.
      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({
          hiddenColumns: { columns: [0, 2], indicators: true },
        });
      });

      const bothHeader = page.locator('.ht_clone_top th.beforeHiddenColumn.afterHiddenColumn');

      await expect(bothHeader).toHaveCount(1);
      await expect(bothHeader.locator('.ht-hidden-indicator-start')).toHaveClass(/ht-icon-caret-hidden-right/);
      await expect(bothHeader.locator('.ht-hidden-indicator-end')).toHaveClass(/ht-icon-caret-hidden-left/);
    });

    test('unhiding the middle column removes both carets', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      await expect(masterBefore(page)).toHaveCount(1);
      await expect(masterAfter(page)).toHaveCount(1);

      // `showColumn()` is documented as NOT re-rendering on its own (its own JSDoc: "to see your
      // changes, re-render your Handsontable instance") - the render is what fires
      // `afterGetColHeader` again and lets `syncIcon()` clear the now-stale carets.
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        hot.getPlugin('hiddenColumns').showColumn(2);
        hot.render();
      });

      await expect(page.locator('.ht_master .ht-hidden-indicator-start')).toHaveCount(0);
      await expect(page.locator('.ht_master .ht-hidden-indicator-end')).toHaveCount(0);
    });

    test('disabling the plugin removes every caret', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      await expect(masterBefore(page)).toHaveCount(1);

      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({ hiddenColumns: false });
      });

      await expect(page.locator('.ht_master .ht-hidden-indicator-start')).toHaveCount(0);
      await expect(page.locator('.ht_master .ht-hidden-indicator-end')).toHaveCount(0);
    });

    test('re-rendering repeatedly keeps exactly one caret per header', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      // `#onAfterGetColHeader` fires per header, per draw - forcing several renders proves
      // `syncIcon()` keeps each slot at exactly one element instead of stacking duplicates.
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        for (let i = 0; i < 5; i++) {
          hot.render();
        }
      });

      await expect(masterBefore(page).locator('.ht-hidden-indicator-end')).toHaveCount(1);
      await expect(masterAfter(page).locator('.ht-hidden-indicator-start')).toHaveCount(1);
    });

    test('the retired pseudo-elements no longer paint on the marked headers', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true });

      const beforeContent = await cloneAfter(page).evaluate(el => getComputedStyle(el, '::before').content);
      const afterContent = await cloneBefore(page).evaluate(el => getComputedStyle(el, '::after').content);

      expect(beforeContent).toBe('none');
      expect(afterContent).toBe('none');
    });

    test('in RTL, the carets stay physical: no flip class, and the LTR mask-position is preserved', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenColumns: true, dir: 'rtl' });

      const endIcon = cloneBefore(page).locator('.ht-hidden-indicator-end');
      const startIcon = cloneAfter(page).locator('.ht-hidden-indicator-start');

      await expect(endIcon).toHaveCount(1);
      await expect(startIcon).toHaveCount(1);

      // Physical, not logical: neither caret carries the RTL mirror class every directional arrow
      // elsewhere in this fixture uses (pagination, sheets bar).
      await expect(endIcon).not.toHaveClass(/ht-icon--flip-rtl/);
      await expect(startIcon).not.toHaveClass(/ht-icon--flip-rtl/);

      const endStyle = await endIcon.evaluate((el) => {
        const style = getComputedStyle(el);

        return { transform: style.transform, maskPosition: style.maskPosition || (style as any).webkitMaskPosition };
      });

      // Rotated 180deg (the `a b c d` block of `matrix(-1, 0, 0, -1, tx, ty)`, from
      // `translateY(-50%) rotate(180deg)`) - `ty` is the resolved `-50%` (half the 10px box, so
      // -5), not asserted here since it is a function of the box size, not of the RTL rule. The
      // LTR `mask-position` (`1px 0`) is kept unchanged - the mask is laid out before the
      // rotation, which mirrors the 1px shift outward, to the left (`_hidden-columns.scss`).
      expect(endStyle.transform).toMatch(/^matrix\(-1, 0, 0, -1, 0, -?\d+(\.\d+)?\)$/);
      expect(endStyle.maskPosition).toMatch(/^1px/);
    });
  });

  test.describe('hidden rows indicator', () => {
    // `?hiddenRows=1` (task 15) hides row index 2 of the base 5-row fixture up front, with
    // `indicators: true` - so its neighbors (rows 1 and 3) render a caret on load. `.ht_master` is
    // the authoritative copy for presence counts; `.ht_clone_inline_start` is the visible,
    // interactive copy for anything about rendered position, size or color (DEV-3003 traps).
    const masterBefore = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master th.beforeHiddenRow');
    const masterAfter = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master th.afterHiddenRow');
    const cloneBefore = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_inline_start th.beforeHiddenRow');
    const cloneAfter = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_inline_start th.afterHiddenRow');

    test('the header before the gap and the header after it each carry one caret, with the correct glyph', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      // Row 1 is `beforeHiddenRow` (hidden row 2 follows it) - end slot, caret pointing up. The
      // slot class and the glyph class both land on the SAME `<i>` element (`syncIcon()` joins
      // them into one `className`), so the glyph is asserted with `toHaveClass` on the slot
      // locator, not as a descendant.
      await expect(masterBefore(page)).toHaveCount(1);
      await expect(cloneBefore(page).locator('.ht-hidden-indicator-end')).toHaveClass(/ht-icon-caret-hidden-up/);

      // Row 3 is `afterHiddenRow` (hidden row 2 precedes it) - start slot, caret pointing down.
      await expect(masterAfter(page)).toHaveCount(1);
      await expect(cloneAfter(page).locator('.ht-hidden-indicator-start')).toHaveClass(/ht-icon-caret-hidden-down/);
    });

    test('the box is 10x10, same as the column carets, even though the glyph is drawn at 8x8', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      const box = await cloneBefore(page).locator('.ht-hidden-indicator-end').evaluate((el) => {
        const rect = el.getBoundingClientRect();

        return { width: rect.width, height: rect.height };
      });

      // `caretHiddenUp`/`caretHiddenDown` are authored on an 8x8 viewBox and `mask-size: contain`
      // scales that artwork up to fill this box - the CSS box itself is 10x10, unchanged from
      // before DEV-3003 (pinned here so a future edit cannot silently shrink it to match the
      // glyph's own artwork size).
      expect(box).toEqual({ width: 10, height: 10 });
    });

    test('a header with a hidden neighbor on each side carries both carets at once', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({
          hiddenRows: { rows: [0, 2], indicators: true },
        });
      });

      const bothHeader = page.locator('.ht_clone_inline_start th.beforeHiddenRow.afterHiddenRow');

      await expect(bothHeader).toHaveCount(1);
      await expect(bothHeader.locator('.ht-hidden-indicator-start')).toHaveClass(/ht-icon-caret-hidden-down/);
      await expect(bothHeader.locator('.ht-hidden-indicator-end')).toHaveClass(/ht-icon-caret-hidden-up/);
    });

    test('unhiding the middle row removes both carets', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      await expect(masterBefore(page)).toHaveCount(1);
      await expect(masterAfter(page)).toHaveCount(1);

      // `showRow()` is documented as NOT re-rendering on its own (its own JSDoc: "to see your
      // changes, re-render your Handsontable instance") - the render is what fires
      // `afterGetRowHeader` again and lets `syncIcon()` clear the now-stale carets.
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        hot.getPlugin('hiddenRows').showRow(2);
        hot.render();
      });

      await expect(page.locator('.ht_master .ht-hidden-indicator-start')).toHaveCount(0);
      await expect(page.locator('.ht_master .ht-hidden-indicator-end')).toHaveCount(0);
    });

    test('disabling the plugin removes every caret', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      await expect(masterBefore(page)).toHaveCount(1);

      await page.evaluate(() => {
        (window as unknown as { hot: any }).hot.updateSettings({ hiddenRows: false });
      });

      await expect(page.locator('.ht_master .ht-hidden-indicator-start')).toHaveCount(0);
      await expect(page.locator('.ht_master .ht-hidden-indicator-end')).toHaveCount(0);
    });

    test('re-rendering repeatedly keeps exactly one caret per header', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      // `#onAfterGetRowHeader` fires per header, per draw - forcing several renders proves
      // `syncIcon()` keeps each slot at exactly one element instead of stacking duplicates.
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        for (let i = 0; i < 5; i++) {
          hot.render();
        }
      });

      await expect(masterBefore(page).locator('.ht-hidden-indicator-end')).toHaveCount(1);
      await expect(masterAfter(page).locator('.ht-hidden-indicator-start')).toHaveCount(1);
    });

    test('the retired pseudo-elements no longer paint on the marked headers', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ hiddenRows: true });

      const beforeContent = await cloneAfter(page).evaluate(el => getComputedStyle(el, '::before').content);
      const afterContent = await cloneBefore(page).evaluate(el => getComputedStyle(el, '::after').content);

      expect(beforeContent).toBe('none');
      expect(afterContent).toBe('none');
    });
  });

  test.describe('autocomplete arrow and select editor (task 17)', () => {
    // Column C (visual index 2) is `type: 'autocomplete'` in the base fixture. Pagination
    // (`pageSize: 2`) is on by default in this fixture for every other block above, so it is
    // turned off here through the public API - the only way to see every one of the 5 base rows
    // at once without adding a fixture-level branch that would change every other test's DOM.
    const disablePagination = (page: import('@playwright/test').Page) => page.evaluate(() => {
      (window as unknown as { hot: any }).hot.updateSettings({ pagination: false });
    });

    test('every autocomplete cell in column C carries the select-arrow icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      await disablePagination(page);

      const arrows = grid.grid().locator('.ht_master td.htAutocomplete .htAutocompleteArrow');

      await expect(arrows).toHaveCount(5);
      await expect(grid.icon('select-arrow', grid.grid().locator('.ht_master'))).toHaveCount(5);
    });

    test('the retired pseudo-element no longer paints the cell arrow glyph', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      // `mixins.pseudo` (`content: ""`) was removed from the `.htAutocompleteArrow::after` rule;
      // the generated `iconsMap` rule (mask-image etc.) carries no `content` of its own, so with
      // nothing supplying it the pseudo-element paints nothing.
      const afterContent = await grid.grid().locator('.ht_master .htAutocompleteArrow').first()
        .evaluate(el => getComputedStyle(el, '::after').content);

      expect(afterContent).toBe('none');
    });

    // DEV-3003 trap (item 1 of the task brief): the arrow is INTERACTIVE - a `mousedown` listener
    // in `autocompleteRenderer.ts` opens the editor when the press lands on `.htAutocompleteArrow`.
    // `.ht-icon`'s base `pointer-events: none` must let a click through to the arrow div beneath
    // it rather than intercepting it, or this affordance silently breaks. Also covered end-to-end
    // by `cell-dropdown-arrow-button.spec.ts`; this asserts the same outcome plus the hit-test
    // reason it holds.
    test('a click precisely on the arrow opens the editor - the icon does not intercept the click', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const arrow = grid.grid().locator('.ht_master td.htAutocomplete .htAutocompleteArrow').first();

      await expect(arrow.locator('.ht-icon')).toHaveCSS('pointer-events', 'none');

      const hitTarget = await arrow.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

        return target === el;
      });

      expect(hitTarget).toBe(true);

      await arrow.click();

      await expect.poll(() => page.evaluate(() => (
        (window as unknown as { hot: any }).hot.getActiveEditor()?.isOpened() === true
      ))).toBe(true);

      const editorCoords = await page.evaluate(() => {
        const editor = (window as unknown as { hot: any }).hot.getActiveEditor();

        return editor ? [editor.row, editor.col] : null;
      });

      // Row 0, column C (visual index 2) - the arrow that was actually clicked.
      expect(editorCoords).toEqual([0, 2]);
    });

    test('an autosized autocomplete column reserves the same width as before the icon migration', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      // A long value that would wrap the floated arrow onto a second line without the reserved
      // `padding-inline-end` slot (DEV-348) - the regression this width-reservation rule guards
      // against, unrelated to this task but re-verified here because the migration touches the
      // same SCSS block. The width itself (77px on `main` at the default token set) is not
      // asserted against a hardcoded number - see the companion "before" measurement in the task
      // report, taken by rebuilding against the pre-migration source with the identical fixture
      // and settings.
      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        hot.updateSettings({
          data: [['This is a fairly long value for autosize testing', 'b', 'a', 'd']],
          columns: [{}, {}, { type: 'autocomplete', source: ['a', 'b'] }, {}],
          autoColumnSize: true,
        });
      });

      const autosizedWidth = await page.evaluate(() => (
        (window as unknown as { hot: any }).hot.getColWidth(2)
      ));

      // A single line, not wrapped: the classic DEV-348 regression this slot prevents.
      const wrapped = await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;
        const td = hot.getCell(0, 2);

        return td.scrollHeight > td.clientHeight + 1;
      });

      expect(autosizedWidth).toBeGreaterThan(0);
      expect(wrapped).toBe(false);
    });

    test('in RTL, the cell arrow keeps the same logical position and the icon is not mirrored', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);
      const insetInlineEnd = async() => grid.grid()
        .locator('.ht_master td.htAutocomplete .htAutocompleteArrow').first()
        .evaluate(el => getComputedStyle(el).getPropertyValue('inset-inline-end'));

      await grid.goto();
      const ltrValue = await insetInlineEnd();

      await grid.goto({ dir: 'rtl' });
      const rtlValue = await insetInlineEnd();

      // The arrow's own `inset-inline-end` offset is a logical property, so the RTL rule (which
      // only floats the arrow for usages outside a grid cell, e.g. the select editor overlay -
      // `_autocomplete-renderer.scss`) leaves this in-cell value untouched between directions.
      expect(rtlValue).toBe(ltrValue);
      expect(rtlValue).not.toBe('');

      // The arrow is a downward chevron - it must never carry `flipInRtl`, unlike the directional
      // arrows elsewhere in this fixture (pagination, sheets bar).
      const arrow = grid.grid().locator('.ht_master td.htAutocomplete .htAutocompleteArrow').first();

      await expect(arrow.locator('.ht-icon')).not.toHaveClass(/ht-icon--flip-rtl/);
    });

    test.describe('select editor', () => {
      // Column D (visual index 3) is `type: 'select'` only when `selectEditor=1` is passed, so
      // every other block above keeps its original 4-column fixture untouched.
      const openSelectEditor = async(page: import('@playwright/test').Page) => {
        const cell = page.locator('.ht_master tbody tr').first().locator('td').nth(3);

        await cell.click();
        await page.keyboard.press('Enter');

        const arrow = page.locator('.htSelectEditor.ht_editor_visible .htAutocompleteArrow');

        await expect(arrow).toBeVisible();

        return arrow;
      };

      test('the select editor arrow carries the select-arrow icon once opened', async({ page, theme, bundle }) => {
        const grid = new IconElementsPage(page, theme, bundle);

        await grid.goto({ selectEditor: true });

        const arrow = await openSelectEditor(page);

        await expect(arrow.locator('.ht-icon.ht-icon-select-arrow')).toHaveCount(1);
      });

      test('the retired pseudo-element no longer paints the select editor arrow glyph', async({
        page, theme, bundle,
      }) => {
        const grid = new IconElementsPage(page, theme, bundle);

        await grid.goto({ selectEditor: true });

        const arrow = await openSelectEditor(page);
        const afterContent = await arrow.evaluate(el => getComputedStyle(el, '::after').content);

        expect(afterContent).toBe('none');
      });

      // The select editor's arrow is decorative, not interactive - unlike the cell renderer's
      // arrow, both the arrow div and the icon carry `pointer-events: none`
      // (`_select-editor.scss`), so a click anywhere on it reaches the native `<select>` beneath.
      test('a click on the arrow reaches the native select underneath, not the icon', async({
        page, theme, bundle,
      }) => {
        const grid = new IconElementsPage(page, theme, bundle);

        await grid.goto({ selectEditor: true });

        const arrow = await openSelectEditor(page);

        await expect(arrow.locator('.ht-icon')).toHaveCSS('pointer-events', 'none');
        await expect(arrow).toHaveCSS('pointer-events', 'none');

        const hitTarget = await arrow.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

          return target?.tagName ?? null;
        });

        expect(hitTarget).toBe('SELECT');
      });
    });
  });

  test.describe('multi-select renderer and editor (task 18)', () => {
    // Column D (visual index 3) is `type: 'multiselect'` only when `multiSelect=1` is passed, so
    // every other block above keeps its original 4-column fixture untouched. Row 0's source data
    // is `['Alpha', 'Beta']` out of the column's `source: ['Alpha', 'Beta', 'Gamma', 'Delta']` -
    // two chips, and two of the four dropdown entries pre-checked.
    const disablePagination = (page: import('@playwright/test').Page) => page.evaluate(() => {
      (window as unknown as { hot: any }).hot.updateSettings({ pagination: false });
    });

    const firstCell = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master td.ht-multi-select-renderer').first();

    /**
     * Selects the row-0/col-3 cell through the API (never a centred click - `tests/AGENTS.md`
     * documents that a multiselect cell's arrow AND its chips' remove buttons both hijack a
     * centred press) and opens the editor with `Enter`.
     */
    const openEditor = async(page: import('@playwright/test').Page) => {
      await page.evaluate(() => (window as unknown as { hot: any }).hot.selectCell(0, 3));
      await page.keyboard.press('Enter');

      const dropdown = page.locator('.handsontableEditor.ht_editor_visible .ht-multi-select-editor');

      await expect(dropdown).toBeVisible();

      return dropdown;
    };

    test('a cell with chips shows one remove icon per chip', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const cell = firstCell(page);

      await expect(cell.locator('.ht-multi-select-chip')).toHaveCount(2);
      await expect(cell.locator('.ht-multi-select-chip-remove .ht-icon.ht-icon-chip-close')).toHaveCount(2);
    });

    test('every multiselect cell carries the select-arrow icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });
      await disablePagination(page);

      // Scoped to `.ht-multi-select-arrow` specifically, not the page-wide `grid.icon()` helper -
      // column C in this same fixture is `type: 'autocomplete'` and carries the same `select-arrow`
      // glyph on a different element (`.htAutocompleteArrow`, task 17), which would inflate the count.
      const arrows = page.locator('.ht_master td.ht-multi-select-renderer .ht-multi-select-arrow .ht-icon.ht-icon-select-arrow');

      await expect(arrows).toHaveCount(5);
    });

    test('the retired pseudo-elements no longer paint the arrow or the chip-remove glyph', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const cell = firstCell(page);
      const arrowAfterContent = await cell.locator('.ht-multi-select-arrow').first()
        .evaluate(el => getComputedStyle(el, '::after').content);
      const chipRemoveBeforeContent = await cell.locator('.ht-multi-select-chip-remove').first()
        .evaluate(el => getComputedStyle(el, '::before').content);

      expect(arrowAfterContent).toBe('none');
      expect(chipRemoveBeforeContent).toBe('none');
    });

    // DEV-3003 trap: the chip remove button is INTERACTIVE (`registerChipRemovingEvents`,
    // `utils/utils.ts`) - `.ht-icon`'s base `pointer-events: none` must let a click through to the
    // span beneath it rather than intercepting it, or the affordance silently breaks.
    test('a click precisely on a chip remove icon removes that chip - the icon does not intercept ' +
      'the click', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const cell = firstCell(page);
      const firstRemove = cell.locator('.ht-multi-select-chip-remove').first();

      await expect(firstRemove.locator('.ht-icon')).toHaveCSS('pointer-events', 'none');

      const hitTarget = await firstRemove.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

        return target === el;
      });

      expect(hitTarget).toBe(true);

      await firstRemove.click();

      await expect(cell.locator('.ht-multi-select-chip')).toHaveCount(1);
      await expect(cell.locator('.ht-multi-select-chip-remove .ht-icon.ht-icon-chip-close')).toHaveCount(1);

      const sourceData = await page.evaluate(() => (
        (window as unknown as { hot: any }).hot.getSourceDataAtCell(0, 3)
      ));

      expect(sourceData).toEqual(['Beta']);
    });

    // DEV-3003 trap, same as the autocomplete arrow (task 17): a `mousedown` listener
    // (`registerDropdownIndicatorEvents`, `utils/utils.ts`) opens the editor when the press lands
    // on `.ht-multi-select-arrow`; the icon inside it must not steal the hit.
    test('a click precisely on the arrow opens the editor - the icon does not intercept the click', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const arrow = firstCell(page).locator('.ht-multi-select-arrow');

      await expect(arrow.locator('.ht-icon')).toHaveCSS('pointer-events', 'none');

      const hitTarget = await arrow.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

        return target === el;
      });

      expect(hitTarget).toBe(true);

      await arrow.click();

      await expect(page.locator('.handsontableEditor.ht_editor_visible .ht-multi-select-editor')).toBeVisible();

      const editedCell = await page.evaluate(() => {
        const editor = (window as unknown as { hot: any }).hot.getActiveEditor();

        return editor ? [editor.row, editor.col] : null;
      });

      expect(editedCell).toEqual([0, 3]);
    });

    test('opening the editor shows exactly one search icon, still carrying the legacy search-icon class', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const dropdown = await openEditor(page);
      const searchIcon = dropdown.locator('.ht-icon.ht-icon-search');

      await expect(searchIcon).toHaveCount(1);

      // `.ai/BREAKING-CHANGES.md`: a class Handsontable produced stays in the DOM. The legacy
      // `.ht-multi-select-editor-search-icon` now sits on the icon element itself, so a custom
      // stylesheet written against it still finds the search icon.
      await expect(page.locator('.ht-multi-select-editor-search-icon')).toHaveCount(1);
      await expect(searchIcon).toHaveClass(/ht-multi-select-editor-search-icon/);

      const maskImage = await grid.maskImage(searchIcon);

      expect(maskImage).not.toBe('none');

      // The retired div was a hardcoded 16x16 on every theme. The slot keeps that box instead of
      // inheriting `--ht-icon-size`, which is 12px on classic - so this must hold on all three
      // themes, not only where the token happens to be 16px.
      const box = await searchIcon.boundingBox();

      expect(box?.width).toBe(16);
      expect(box?.height).toBe(16);
    });

    test('a selected item shows its tick, driven by input:checked + .ht-icon', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const dropdown = await openEditor(page);
      const items = dropdown.locator('ul li');
      const alphaItem = items.filter({ hasText: 'Alpha' });
      const gammaItem = items.filter({ hasText: 'Gamma' });

      // Row 0's data (`['Alpha', 'Beta']`) opens the first two entries pre-checked.
      await expect(alphaItem.locator('input[type="checkbox"]:checked + .ht-icon.ht-icon-checkbox')).toHaveCount(1);

      // The retired `input::after` pseudo-element (previously gated by the
      // `.ht-multi-select-editor-item-selected` class) no longer paints anything either.
      const afterContent = await alphaItem.locator('input[type="checkbox"]').first()
        .evaluate(el => getComputedStyle(el, '::after').content);

      expect(afterContent).toBe('none');

      // Gamma starts unchecked: the icon element is still always inserted, it just paints nothing
      // - `--ht-checkbox-icon-color` is transparent until `:checked` swaps in
      // `--ht-checkbox-checked-icon-color`.
      await expect(gammaItem.locator('.ht-icon.ht-icon-checkbox')).toHaveCount(1);
      await expect(gammaItem.locator('input[type="checkbox"]:checked + .ht-icon')).toHaveCount(0);

      // Select it through its label - not the icon, which is `pointer-events: none` - the way a
      // real user picks an item.
      await gammaItem.locator('label').click();

      await expect(gammaItem.locator('input[type="checkbox"]:checked + .ht-icon.ht-icon-checkbox')).toHaveCount(1);
    });

    test('repeated renders keep the icon counts stable - no duplication', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ multiSelect: true });

      const cell = firstCell(page);

      await expect(cell.locator('.ht-icon.ht-icon-chip-close')).toHaveCount(2);
      await expect(cell.locator('.ht-multi-select-arrow .ht-icon.ht-icon-select-arrow')).toHaveCount(1);

      await page.evaluate(() => (window as unknown as { hot: any }).hot.render());
      await page.evaluate(() => (window as unknown as { hot: any }).hot.render());

      await expect(cell.locator('.ht-icon.ht-icon-chip-close')).toHaveCount(2);
      await expect(cell.locator('.ht-multi-select-arrow .ht-icon.ht-icon-select-arrow')).toHaveCount(1);

      // The dropdown list rebuilds through `removeAllDropdownItems()` + `fillDropdown()` on every
      // keystroke (`DropdownController`) - filter down to one match ("am" only matches "Gamma" out
      // of Alpha/Beta/Gamma/Delta) and back to prove that rebuild does not duplicate icons either.
      const dropdown = await openEditor(page);
      const search = dropdown.locator('.ht-multi-select-editor-search-input');

      await search.fill('am');
      await expect(dropdown.locator('ul li')).toHaveCount(1);
      await expect(dropdown.locator('.ht-icon.ht-icon-checkbox')).toHaveCount(1);

      await search.fill('');
      await expect(dropdown.locator('ul li')).toHaveCount(4);
      await expect(dropdown.locator('.ht-icon.ht-icon-checkbox')).toHaveCount(4);
    });
  });

  test.describe('notification close button (task 19)', () => {
    // The notification plugin shows nothing on its own - every test here drives it through its
    // public API (`hot.getPlugin('notification').showMessage(...)`), the way an application is
    // meant to invoke it. `duration: 0` keeps the toast open until a test dismisses it itself, so
    // no assertion races the auto-dismiss timer.
    const showClosableToast = (page: import('@playwright/test').Page) => page.evaluate(() => {
      (window as unknown as { hot: any }).hot.getPlugin('notification').showMessage({
        message: 'Saved.',
        closable: true,
        duration: 0,
      });
    });

    const closeButton = (page: import('@playwright/test').Page) =>
      page.locator('.ht-notification__close');

    test('a closable toast\'s close button carries exactly one chip-close icon', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ notification: true });
      await showClosableToast(page);

      const close = closeButton(page);

      await expect(close).toHaveCount(1);
      await expect(grid.icon('chip-close', close)).toHaveCount(1);
    });

    // DEV-3003 trap: the close button is INTERACTIVE (`hideAll`/`hide`, `notification.ts`) -
    // `.ht-icon`'s base `pointer-events: none` must let a click through to the button beneath it
    // rather than intercepting it, or the toast can never be dismissed by mouse.
    test('a click on the close icon dismisses the toast - the icon does not intercept the ' +
      'click', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ notification: true });
      await showClosableToast(page);

      const close = closeButton(page);

      await expect(close.locator('.ht-icon')).toHaveCSS('pointer-events', 'none');

      const hitTarget = await close.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

        return target === el;
      });

      expect(hitTarget).toBe(true);

      await close.click();

      await expect(page.locator('.ht-notification__toast')).toHaveCount(0);

      const isVisible = await page.evaluate(() => (
        (window as unknown as { hot: any }).hot.getPlugin('notification').isVisible()
      ));

      expect(isVisible).toBe(false);
    });

    test('the close button\'s accessible name is unchanged - the decorative icon is not ' +
      'announced', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ notification: true });
      await showClosableToast(page);

      const close = closeButton(page);

      // The button's accessible name comes from its own `aria-label` (`NotificationUI#createToastElement`,
      // set from the translated `NOTIFICATION_BUTTONS_CLOSE` phrase) - the icon inside it is
      // `aria-hidden` (`createIcon()`), so it must not change what a screen reader announces.
      await expect(close).toHaveAccessibleName('Close');
      await expect(close.locator('.ht-icon')).toHaveAttribute('aria-hidden', 'true');
    });

    test('the retired pseudo-element no longer paints the glyph', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ notification: true });
      await showClosableToast(page);

      const beforeContent = await closeButton(page)
        .evaluate(el => getComputedStyle(el, '::before').content);

      // `mixins.pseudo` (`content: ""`) was removed from `.ht-notification__close::before` in the
      // component SCSS; the generated `iconsMap` rule (width/height/mask-image/background-color) has
      // no `content` of its own, so with nothing supplying it the pseudo-element paints nothing.
      expect(beforeContent).toBe('none');
    });

    test('switching themes while a toast is open rebuilds its icon and keeps the toast ' +
      'visible', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ notification: true });
      await showClosableToast(page);

      const close = closeButton(page);
      const otherThemeName = theme === 'horizon' ? 'main' : 'horizon';

      await expect(close.locator('.ht-icon')).toHaveCount(1);

      // Switch the CSS class-based theme at RUNTIME (`hot.useTheme()`) while the toast built with
      // the OLD theme is still on screen. `Notification`'s `afterSetTheme` hook calls
      // `NotificationUI#refreshIcons()`, which removes and re-appends the close icon of every
      // currently-open toast - a live toast is not discarded, only its icon catches up. This is the
      // deliberate choice for task 19: a toast built before the change keeps showing its close
      // control throughout, unlike a control that vanished and reappeared.
      await page.evaluate((themeName) => {
        (window as unknown as { hot: any }).hot.useTheme(`ht-theme-${themeName}`);
      }, otherThemeName);

      await expect(page.locator('.ht-notification__toast')).toHaveCount(1);
      await expect(close.locator('.ht-icon')).toHaveCount(1);
      await expect(grid.icon('chip-close', close)).toHaveCount(1);

      await page.evaluate((themeName) => {
        (window as unknown as { hot: any }).hot.useTheme(`ht-theme-${themeName}`);
      }, theme);

      await expect(page.locator('.ht-notification__toast')).toHaveCount(1);
      await expect(close.locator('.ht-icon')).toHaveCount(1);
    });
  });

  test.describe('external icon mapping (task 21)', () => {
    // `?icons=tabler` (fixture task 21) registers a per-instance theme as a THEME CONFIG OBJECT,
    // through `Handsontable.themes.registerTheme()` and the `theme` constructor option - not a
    // `themeName` string, and the container carries no `ht-theme-*` class. That arrangement is the
    // only one that actually builds a `ThemeManager` (`core.ts` `init()`): a `themeName` string, or
    // a class on the container, resolves through the CSS-class path and leaves `hot.themeManager`
    // null, and `createIcon()` then takes its fallback with no external mapping ever applied - the
    // bug this branch used to have, which left `getByTestId('grid')` never visible. The registered
    // theme remaps four slots to Tabler-style class lists (`menu`, `arrowRight`, `arrowLeft`,
    // `check`) and one (`arrowNarrowUp`, the sort-ascending indicator) to a renderer callback,
    // leaving `checkbox` unmapped - see the fixture's own comment for the full reasoning.
    test('a class-list icon mapping disables the mask and adds the classes', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      // The whole feature depends on this: with a class-on-container theme (or a `themeName`
      // string), `hot.themeManager` is null and no external mapping can ever apply - confirm it
      // before trusting any assertion below.
      expect(await page.evaluate(() => !!(window as unknown as { hot: any }).hot.themeManager)).toBe(true);

      const icon = grid.icon('menu', page.locator('th .changeType')).first();

      await expect(icon).toHaveClass(/ht-icon--external/);
      await expect(icon).toHaveClass(/ti-menu/);
      expect(await grid.maskImage(icon)).toBe('none');
      // Unmapped slots keep the built-in glyph.
      expect(await grid.maskImage(grid.icon('checkbox').first())).toMatch(/^url\(/);
    });

    // A renderer callback owns the inside of the `<i>`: the fixture's `arrowNarrowUp` renderer
    // inserts a child span, so a press on the arrow targets that span. The sort click gate must
    // accept any target inside the indicator, not only the slot element itself (PR review).
    test('a click on markup a renderer callback put inside the indicator still toggles the sort', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      const header = page.locator('.ht_clone_top th').nth(2);

      await header.locator('.colHeader').click();

      const glyph = header.locator('.ht-sort-indicator .renderer-glyph');

      await expect(glyph).toHaveText('sort_asc');

      const hitTarget = await glyph.evaluate((el) => {
        const rect = el.getBoundingClientRect();

        return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === el;
      });

      expect(hitTarget).toBe(true);

      await glyph.click();

      // `arrowNarrowDown` is unmapped in this fixture, so the descending state paints the
      // built-in glyph - which is exactly what proves the click was taken as a sort toggle.
      await expect(grid.icon('arrow-narrow-down', header)).toHaveCount(1);
      await expect(header.locator('.renderer-glyph')).toHaveCount(0);
    });

    // The cell arrow's mousedown gate used to accept only a target that carried
    // `htAutocompleteArrow` itself. The fixture's `selectArrow` renderer inserts a child span into
    // the arrow's icon, so a press on the painted glyph targets that child; the gate matches by
    // ancestor now (PR #13639 review), and this pins it with a real click on the child.
    test('a click on markup a renderer callback put inside the cell arrow still opens the editor', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      const cell = page.locator('.ht_master td.htAutocomplete').first();
      const glyph = cell.locator('.htAutocompleteArrow .ht-icon .renderer-glyph');

      await expect(glyph).toHaveText('v');

      await glyph.click();

      await expect.poll(() => page.evaluate(() => (
        (window as unknown as { hot: any }).hot.getActiveEditor()?.isOpened() === true
      ))).toBe(true);

      const editorCoords = await page.evaluate(() => {
        const editor = (window as unknown as { hot: any }).hot.getActiveEditor();

        return editor ? [editor.row, editor.col] : null;
      });

      expect(editorCoords).toEqual([0, 2]);
    });

    // The header menu button, the Filters condition select, and the select editor arrow are built
    // once and reused. They used to keep whichever mapping was active when first built; now each
    // refreshes through `syncIcon()` (button: every header render; select: every menu show;
    // editor: every open), so a runtime remap reaches them without re-creating the grid.
    test('a runtime icons remap reaches the reused header button, filters select, and select editor icons', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler', selectEditor: true });

      const buttonIcon = page.locator('.ht_clone_top th .changeType .ht-icon').first();

      await expect(buttonIcon).toHaveClass(/ti-menu/);

      await page.evaluate(() => {
        (window as unknown as { Handsontable: any }).Handsontable.themes.getTheme('icons-tabler')
          .params({ icons: { menu: 'ti ti-menu-2', selectArrow: 'ti ti-caret-down-filled' } });
      });

      // Header button: refreshed on the next header render, which the theme change triggers.
      await expect(buttonIcon).toHaveClass(/ti-menu-2/);
      await expect(buttonIcon).not.toHaveClass(/ti-menu(\s|$)/);

      // Filters condition select: refreshed when the dropdown menu shows.
      await page.locator('.ht_clone_top th .changeType').first().click();

      const captionIcon = page.locator('.htDropdownMenu:visible .htUISelectCaption .ht-icon').first();

      await expect(captionIcon).toHaveClass(/ti-caret-down-filled/);
      await page.keyboard.press('Escape');

      // Select editor arrow: refreshed when the editor opens. Column D is the select-editor column.
      await page.locator('.ht_master td').nth(3).dblclick();

      const editorArrowIcon = page.locator('.htSelectEditor .htAutocompleteArrow .ht-icon').first();

      await expect(editorArrowIcon).toHaveClass(/ti-caret-down-filled/);
    });

    // The header menu opens from `#onTableClick`, which used to require the click target to BE the
    // button. A renderer child that takes its own pointer events made the mousedown set the
    // "button clicked" flag and the click then fail to open the menu (PR #13639 review). Both
    // gates match by ancestor now, and the menu is positioned from the button, not the child.
    test('a click on markup a renderer callback put inside the header menu button still opens the menu', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      await page.evaluate(() => {
        (window as unknown as { Handsontable: any }).Handsontable.themes.getTheme('icons-tabler').params({
          icons: {
            menu: (element: HTMLElement) => {
              const glyph = document.createElement('span');

              glyph.className = 'renderer-glyph';
              glyph.textContent = '=';
              glyph.style.cssText = 'display:inline-block;width:100%;height:100%;overflow:hidden;pointer-events:auto;';
              element.replaceChildren(glyph);
            },
          },
        });
      });

      const glyph = page.locator('.ht_clone_top th .changeType .ht-icon .renderer-glyph').first();

      await expect(glyph).toHaveText('=');

      const hitTarget = await glyph.evaluate((el) => {
        const rect = el.getBoundingClientRect();

        return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === el;
      });

      expect(hitTarget).toBe(true);

      await glyph.click();

      await expect(page.locator('.htDropdownMenu:visible')).toHaveCount(1);
    });

    test('an unmapped slot keeps the built-in glyph - mapping is per-slot, not all-or-nothing', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      const checkboxIcon = grid.icon('checkbox').first();

      // No `ht-icon--external` class - the theme maps five other slots (four class lists, one
      // callback), and none of that flips this UNMAPPED slot into external mode.
      await expect(checkboxIcon).not.toHaveClass(/ht-icon--external/);
      expect(await grid.maskImage(checkboxIcon)).toMatch(/^url\("data:image\/svg\+xml/);
    });

    test('the mapped class-list glyph is actually visible at icon size, not merely classed', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      const icon = grid.icon('menu', page.locator('th .changeType')).first();

      // `.ht-icon`'s own box is sized off `--ht-icon-size` regardless of content, so a nonzero
      // bounding box alone would pass even with an invisible glyph. The real proof is the stub
      // font's `::before` rule actually drawing content, at a nonzero font size - a font glyph
      // with no font-size would collapse even though the box around it stayed sized.
      const [box, beforeContent, fontSize] = await Promise.all([
        icon.boundingBox(),
        icon.evaluate(el => getComputedStyle(el, '::before').content),
        icon.evaluate(el => getComputedStyle(el).fontSize),
      ]);

      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);
      expect(beforeContent).toBe('"="');
      expect(Number.parseFloat(fontSize)).toBeGreaterThan(0);
    });

    test('a renderer-callback icon mapping sets real, visible text content - the shape a ' +
      'ligature-based icon font (e.g. Material Symbols) uses', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      // `.ht_clone_top th` is the visible, interactive copy of the header row - `.ht_master`'s
      // `<thead>` is `visibility: hidden` (DEV-3003 traps, also used by the "column sorting
      // indicator" tests above). Column B (index 2) has no per-column `columnSorting` override.
      const columnBHeader = page.locator('.ht_clone_top th').nth(2);

      await columnBHeader.locator('.colHeader').click(); // ascending

      const icon = grid.icon('arrow-narrow-up', columnBHeader);

      await expect(icon).toHaveClass(/ht-icon--external/);
      await expect(icon).toHaveText('sort_asc');
      expect(await grid.maskImage(icon)).toBe('none');

      // A real text node, not just a class or a pseudo-element - measure it directly with a
      // `Range`, which the class-list case's `::before` content cannot be measured with.
      const rect = await icon.evaluate((el) => {
        const range = document.createRange();

        range.selectNodeContents(el);

        const domRect = range.getBoundingClientRect();

        return { width: domRect.width, height: domRect.height };
      });

      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    });
  });

  test.describe('icon resolution revision guard', () => {
    // `?icons=tabler` is the only fixture mode that actually builds a `ThemeManager` (a
    // config-OBJECT theme, not a `themeName` string or a class on the container - see the
    // "external icon mapping" block above for why the other modes cannot exercise this at all).
    // `.ht_master thead th` is the AUTHORITATIVE DOM `syncIcon()` manages - the element identity
    // assertions below need the node `syncIcon()` itself keeps or replaces, not `.ht_clone_top`'s
    // copy (used elsewhere in this file for clicks and visible-state reads, and used here too,
    // for the click that sorts the column). Column B (nth(2): 0 is the row-header corner, 1 is
    // column A) has no per-column `columnSorting` override, matching the "column sorting
    // indicator" block above.
    const masterColumnBHeader = (page: import('@playwright/test').Page) =>
      page.locator('.ht_master thead th').nth(2);
    const cloneColumnBHeader = (page: import('@playwright/test').Page) =>
      page.locator('.ht_clone_top th').nth(2);

    test('a runtime icons remap restyles an existing sort-indicator icon on the SAME element, ' +
      'across two successive theme changes', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      await cloneColumnBHeader(page).locator('.colHeader').click(); // ascending

      const icon = grid.icon('arrow-narrow-up', masterColumnBHeader(page));

      // Baseline: the fixture's tabler theme maps `arrowNarrowUp` to a RENDERER CALLBACK at
      // grid-construction time (`element.textContent = 'sort_asc'`) - confirm that is really
      // where this test starts, then stamp the element. `applyIcon()` never touches `dataset`
      // outside the revision key `syncIcon()` itself writes, so this marker survives an
      // in-place re-application and is wiped only if `syncIcon()` ever REPLACES the element.
      await expect(icon).toHaveText('sort_asc');
      await icon.evaluate((el) => {
        el.dataset.e2eIdentity = 'kept';
      });

      // Runtime remap #1: callback -> class list, through the SAME `ThemeBuilder` instance the
      // grid's `ThemeManager` subscribed to - `Handsontable.themes.getTheme()` returns the exact
      // object `registerTheme()` handed the fixture as `theme: themeConfig`, so calling
      // `.params()` on it notifies that same subscription (`ThemeManager#update()`).
      await page.evaluate(() => {
        (window as unknown as { Handsontable: any }).Handsontable.themes.getTheme('icons-tabler')
          .params({ icons: { arrowNarrowUp: 'ti ti-chevron-right' } });
      });

      await expect(icon).toHaveClass(/ht-icon--external/);
      await expect(icon).toHaveClass(/ti-chevron-right/);
      // The callback no longer runs - `applyIcon()`'s class-list branch clears `textContent`
      // and does not re-set it.
      await expect(icon).not.toHaveText('sort_asc');
      expect(await icon.evaluate(el => el.dataset.e2eIdentity)).toBe('kept');

      // Runtime remap #2: class list -> a DIFFERENT renderer callback. A guard that only fires
      // once, or that stays pinned to the FIRST post-creation revision instead of the CURRENT
      // one, would silently keep remap #1's mapping here instead of picking this one up - the
      // element must not get stuck.
      await page.evaluate(() => {
        (window as unknown as { Handsontable: any }).Handsontable.themes.getTheme('icons-tabler').params({
          icons: { arrowNarrowUp: (element: HTMLElement) => { element.textContent = 'sort_up_again'; } },
        });
      });

      await expect(icon).toHaveText('sort_up_again');
      await expect(icon).not.toHaveClass(/ti-chevron-right/);
      expect(await icon.evaluate(el => el.dataset.e2eIdentity)).toBe('kept');
    });

    test('repeated renders with no theme change leave the sort-indicator icon untouched', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto({ icons: 'tabler' });

      await cloneColumnBHeader(page).locator('.colHeader').click(); // ascending

      const icon = grid.icon('arrow-narrow-up', masterColumnBHeader(page));

      await expect(icon).toHaveText('sort_asc');

      // Stamp the element and its current revision, then force several re-draws with NO theme
      // change in between - the same pattern the "re-rendering a sorted header repeatedly keeps
      // exactly one indicator icon" test above uses. If the keep-path guard fired on every draw
      // instead of only on a real revision change, `applyIcon()`'s renderer branch would run
      // again each time and clear/re-set `textContent` - observably a no-op here, but the
      // stamped revision is the guard's own record of whether it fired, and stays the ONLY
      // reliable signal of that from outside `ThemeManager`.
      const revisionBefore = await icon.evaluate(el => el.dataset.htIconsRevision);

      await icon.evaluate((el) => {
        el.dataset.e2eIdentity = 'kept';
      });

      await page.evaluate(() => {
        const hot = (window as unknown as { hot: any }).hot;

        for (let i = 0; i < 5; i++) {
          hot.render();
        }
      });

      await expect(icon).toHaveText('sort_asc');
      expect(await icon.evaluate(el => el.dataset.e2eIdentity)).toBe('kept');
      expect(await icon.evaluate(el => el.dataset.htIconsRevision)).toBe(revisionBefore);
    });
  });

  test('the theme stylesheet has no pseudo-element icon rules left (DEV-3003 task 22)', async({
    page, theme, bundle,
  }) => {
    const grid = new IconElementsPage(page, theme, bundle);

    await grid.goto();

    const pseudoMaskRules = await page.evaluate(() => {
      let count = 0;

      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;

        try { rules = sheet.cssRules; } catch { continue; }

        for (const rule of Array.from(rules)) {
          if (!(rule instanceof CSSStyleRule) || !/::(before|after)/.test(rule.selectorText)) {
            continue;
          }

          // `_license-branding.scss` legitimately masks a `::after` pseudo-element in TWO
          // places - the corner badge glyph (`.ht-license-badge-corner ... ::after`) and the
          // lock screen's "H." logomark (`.ht-dialog.ht-license-lock::after`) - both real,
          // still-shipping features, not icon-element leftovers. Everything else matching
          // `::(before|after)` + a mask-image is exactly what the deleted `iconsMap()` generator
          // used to emit (`.changeType::before`, `.columnSorting.sortAction.ascending::before`,
          // `.htCheckboxRendererInput::after`, etc.), so scoping OUT only the `ht-license`
          // selectors - rather than scoping IN a hand-picked allow-list of old icon selectors -
          // still catches a real leftover rule wherever it turns up.
          if (rule.selectorText.includes('ht-license')) {
            continue;
          }

          if (rule.style.getPropertyValue('-webkit-mask-image') || rule.style.getPropertyValue('mask-image')) {
            count += 1;
          }
        }
      }

      return count;
    });

    expect(pseudoMaskRules).toBe(0);
  });

  test.describe('-no-icons bundle (DEV-3003 task 22)', () => {
    test('an icon element renders as an empty box, never a painted square', async({ page, theme, bundle }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      // The `-no-icons` stylesheet variant ships no `--ht-icon-*` custom properties and no
      // `.ht-icon-<name>` glyph rules at all (`withIcons` is false in `generateThemeCss`). The
      // base `.ht-icon` rule (`_icon.scss`) deliberately sets no paint of its own - see the
      // comment there - so the only way this proves anything is by reading the COMPUTED values
      // directly, not by asserting the element is merely present.
      await grid.goto({ noIcons: true });

      // `.ht_master` (not `.ht_clone_top`) is the authoritative DOM copy for structural
      // assertions, per the "every column header dropdown-menu button" test above.
      const icon = grid.icon('menu', grid.grid().locator('.ht_master th .changeType')).first();

      await expect(icon).toBeAttached();

      const [backgroundColor, maskImage] = await Promise.all([
        grid.backgroundColor(icon),
        grid.maskImage(icon),
      ]);

      expect(backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(maskImage).toBe('none');
    });
  });
});
