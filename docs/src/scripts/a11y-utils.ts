/**
 * Shared accessibility utilities for the docs site.
 *
 * - createFocusTrap: traps Tab / Shift+Tab within a container.
 * - attachDropdownKeyboardNav: adds Arrow, Home/End, Enter, Escape to
 *   any trigger + menu dropdown pair.
 */

// ── Focus trap ──────────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trap Tab / Shift+Tab within `container`. Returns a cleanup function
 * that removes the listener.
 */
export function createFocusTrap(container: HTMLElement): () => void {
  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter((el) => el.offsetParent !== null); // visible only

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeydown);
  return () => container.removeEventListener('keydown', handleKeydown);
}

// ── Dropdown keyboard navigation ────────────────────────────────────────

export interface DropdownKeyboardOptions {
  /** Selector for focusable items within the menu (default: 'a[role="menuitem"], li[role="menuitem"]') */
  itemSelector?: string;
  /** Called to open the menu. Defaults to setting menu.hidden = false */
  onOpen?: () => void;
  /** Called to close the menu. Defaults to setting menu.hidden = true */
  onClose?: () => void;
  /** Returns true when the menu is open */
  isOpen?: () => boolean;
}

/**
 * Attach Arrow Up/Down, Home/End, Enter, and Escape keyboard navigation
 * to a dropdown trigger + menu pair.
 */
export function attachDropdownKeyboardNav(
  trigger: HTMLElement,
  menu: HTMLElement,
  options: DropdownKeyboardOptions = {}
): void {
  const {
    itemSelector = 'a[role="menuitem"], li[role="menuitem"]',
    onOpen,
    onClose,
    isOpen = () => !menu.hidden,
  } = options;

  function getItems(): HTMLElement[] {
    return Array.from(menu.querySelectorAll<HTMLElement>(itemSelector));
  }

  function focusItem(index: number) {
    const items = getItems();
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    items[clamped].focus();
  }

  function currentIndex(): number {
    const items = getItems();
    return items.indexOf(document.activeElement as HTMLElement);
  }

  trigger.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Down') {
      e.preventDefault();
      if (!isOpen()) {
        onOpen?.();
      }
      focusItem(0);
    } else if (e.key === 'ArrowUp' || e.key === 'Up') {
      e.preventDefault();
      if (!isOpen()) {
        onOpen?.();
      }
      const items = getItems();
      focusItem(items.length - 1);
    }
  });

  menu.addEventListener('keydown', (e: KeyboardEvent) => {
    const items = getItems();
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'Down': {
        e.preventDefault();
        const idx = currentIndex();
        focusItem(idx < items.length - 1 ? idx + 1 : 0);
        break;
      }
      case 'ArrowUp':
      case 'Up': {
        e.preventDefault();
        const idx = currentIndex();
        focusItem(idx > 0 ? idx - 1 : items.length - 1);
        break;
      }
      case 'Home': {
        e.preventDefault();
        focusItem(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        focusItem(items.length - 1);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        onClose?.();
        trigger.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        if (e.key === ' ') e.preventDefault();
        const active = document.activeElement as HTMLElement;
        if (active?.tagName === 'A') {
          // Focus is on an <a> menuitem — click it directly
          active.click();
        } else if (active?.tagName === 'LI') {
          // Focus is on a <li> menuitem — find the inner <a> and click it
          const link = active.querySelector('a');
          if (link) {
            link.click();
          }
        }
        onClose?.();
        trigger.focus();
        break;
      }
    }
  });
}
