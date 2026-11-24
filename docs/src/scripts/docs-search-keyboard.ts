/**
 * Keyboard behavior of the docs search (DocSearch, through `@astrojs/starlight-docsearch`).
 *
 * - **No `/` shortcut (WCAG 2.1.4).** DocSearch opens on a bare `/` pressed outside a field, and
 *   3.9.0 has no option to turn that off. A slip of the keyboard or a speech command then opens a
 *   dialog. DocSearch listens on `window` in the bubble phase, and this module adds its own listener
 *   there first, so stopping the event there reaches DocSearch only: every element already had the
 *   key, and the default action (typing a `/`) is never prevented. Ctrl+K (Cmd+K on macOS) still opens
 *   the search.
 * - **Focus return (WCAG 2.4.3).** DocSearch closes without moving the focus anywhere, so it lands on
 *   `<body>`. This module remembers the control that opened the search, and when the search closes
 *   with the focus on `<body>`, it focuses that control again. A control that is gone or hidden
 *   gives way to the visible search button.
 *
 * The search renders in production builds only (`Header.astro`); without it this module changes
 * nothing. The site has no Astro `<ClientRouter />`, so each page load runs the module once.
 */

const SEARCH_BUTTONS_SELECTOR = 'sl-doc-search .DocSearch-Button, .mobile-search-btn';
const OPEN_CLASS = 'DocSearch--active';

let opener: HTMLElement | null = null;

/**
 * Tells whether a key event comes from a field that takes text, the same test DocSearch makes.
 *
 * @param event The key event.
 * @returns `true` for a field.
 */
function isFromField(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}

/**
 * Tells whether the search is open.
 *
 * @returns `true` while the search dialog is shown.
 */
function isSearchOpen(): boolean {
  return document.body.classList.contains(OPEN_CLASS);
}

/**
 * Tells whether an element can take the focus back: it is in the page and shown.
 *
 * @param element The element.
 * @returns `true` when it can.
 */
function canTakeFocus(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element?.isConnected && element.checkVisibility() && !element.closest('[inert]'));
}

/**
 * Remembers the element that has the focus as the one to return it to.
 */
function rememberFocusedElement(): void {
  const focused = document.activeElement;

  opener = focused instanceof HTMLElement && focused !== document.body ? focused : null;
}

/**
 * Gives the focus back after the search closed, when nothing else took it.
 */
function returnFocus(): void {
  const remembered = opener;

  opener = null;

  if (document.activeElement && document.activeElement !== document.body) {
    return;
  }

  const target = canTakeFocus(remembered)
    ? remembered
    : [...document.querySelectorAll<HTMLElement>(SEARCH_BUTTONS_SELECTOR)].find(canTakeFocus);

  target?.focus();
}

window.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isFromField(event)) {
    event.stopImmediatePropagation();
  }
});

window.addEventListener('keydown', (event) => {
  if (isSearchOpen()) {
    return;
  }

  const isShortcut = event.key?.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
  const typesIntoSearch = /^[a-zA-Z0-9]$/.test(event.key)
    && event.target instanceof Element && event.target.closest(SEARCH_BUTTONS_SELECTOR) !== null;

  if (isShortcut || typesIntoSearch) {
    rememberFocusedElement();
  }
}, { capture: true });

document.addEventListener('click', (event) => {
  if (!event.isTrusted || isSearchOpen() || !(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest<HTMLElement>(SEARCH_BUTTONS_SELECTOR);

  if (button) {
    opener = button;
  }
}, { capture: true });

let wasOpen = isSearchOpen();

new MutationObserver(() => {
  const open = isSearchOpen();

  if (wasOpen && !open) {
    returnFocus();
  }
  wasOpen = open;
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
