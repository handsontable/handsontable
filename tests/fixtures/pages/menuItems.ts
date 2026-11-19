import { type Page, type Locator, expect } from '@playwright/test';
import { ConsoleWarnings } from '../consoleWarnings';

/**
 * The substring every unresolved menu key warning contains.
 */
const UNRESOLVED_KEY_WARNING = 'does not match any available';

/**
 * The menu that is currently on screen.
 *
 * Menus render into a body-level `div.ht-portal`, one per grid, so they cannot be scoped to a grid
 * container. Handsontable removes the inner table when a menu closes, so filtering on visibility
 * resolves to the single open menu. The child combinator matters: the Filters value list is itself a
 * Handsontable, so a descendant match finds that nested grid's table too and trips strict mode.
 */
export function openMenu(page: Page, menuSelector: string): Locator {
  return page.locator(`${menuSelector} > .ht_master:visible`);
}

/**
 * One visible menu row, matched on its whole label.
 *
 * The match is anchored because Playwright's `hasText` string form is a case-insensitive substring
 * match, and "Unfreeze column" contains "freeze column", so the plain form would click unfreeze when
 * asked for freeze.
 */
export function menuItem(page: Page, menuSelector: string, label: string): Locator {
  const exact = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

  return page.locator(`${menuSelector} td:visible`).filter({ hasText: exact }).first();
}

/**
 * Picks one entry from the open menu by its whole label and waits for the menu to close.
 */
export async function clickMenuItem(page: Page, menuSelector: string, label: string): Promise<void> {
  await menuItem(page, menuSelector, label).click();
  await expect(openMenu(page, menuSelector)).toBeHidden();
}

/**
 * The labels of the menu's own rows that have a box.
 *
 * A hidden item stays in the DOM with zero height and a separator has no text, so neither is
 * reported. The child chain stops at the menu's own table: the Filters value list is a nested grid
 * inside one of these cells, and a descendant selector would return its rows as menu entries.
 */
export async function visibleItemsOf(page: Page, menuSelector: string): Promise<string[]> {
  return page.evaluate((selector) => {
    const ownTable = document.querySelector(`${selector} > .ht_master table.htCore`);

    if (!ownTable) {
      return [];
    }

    return Array.from(ownTable.querySelectorAll(':scope > tbody > tr > td'))
      .filter(cell => cell.getBoundingClientRect().height > 0)
      .map(cell => (cell.textContent ?? '').trim())
      .filter(label => label.length > 0);
  }, menuSelector);
}

/**
 * Starts collecting the unresolved-key console warnings and returns the collector.
 *
 * The list is filtered to the unresolved-key warning, so unrelated console noise cannot make an
 * assertion pass on its own.
 */
export function collectUnresolvedKeyWarnings(page: Page): ConsoleWarnings {
  return new ConsoleWarnings(page, UNRESOLVED_KEY_WARNING);
}
