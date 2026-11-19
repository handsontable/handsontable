import { type Page } from '@playwright/test';

/**
 * The variants a check builds a catalog page in, beyond what the fixture's own query takes.
 */

/**
 * Builds every theme class the page writes as its dark form, before the fixture runs.
 *
 * @param page The page.
 */
export async function installDarkScheme(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const darken = (value: unknown) => (typeof value === 'string'
      ? value.replace(/\bht-theme-(main|horizon|classic)\b(?!-dark)/g, 'ht-theme-$1-dark')
      : value);
    const className = Object.getOwnPropertyDescriptor(Element.prototype, 'className')!;
    const setAttribute = Element.prototype.setAttribute;
    const add = DOMTokenList.prototype.add;

    Object.defineProperty(Element.prototype, 'className', {
      ...className,
      set(value: string) {
        className.set!.call(this, darken(value) as string);
      },
    });
    Element.prototype.setAttribute = function(name: string, value: string) {
      return setAttribute.call(this, name, name === 'class' ? darken(value) as string : value);
    };
    DOMTokenList.prototype.add = function(...tokens: string[]) {
      return add.apply(this, tokens.map(token => darken(token) as string));
    };
  });
}

/**
 * Whether the dark scheme reached the grid: its root wrapper, or the element that carries its theme
 * class, has a `ht-theme-<name>-dark` class. A class the init script cannot see (one in the static
 * markup, one set with `classList.toggle()`) leaves the grid light, and a dark record of it would be a
 * light measurement.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns Whether the grid is dark.
 */
export async function darkSchemeApplied(page: Page, root: string): Promise<boolean> {
  return page.evaluate((selector) => {
    const wrapper = document.querySelector(selector)?.querySelector('.ht-root-wrapper');

    return !!wrapper && /ht-theme-\w+-dark/.test(`${wrapper.className} ${wrapper.closest('[class*="ht-theme-"]')?.className ?? ''}`);
  }, root);
}
