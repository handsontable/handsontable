import { GridPage } from './GridPage';

type ClipboardKey = 'C' | 'X' | 'V';

type HookCalls = {
  beforeCopy: number;
  afterCopy: number;
  beforeCut: number;
  afterCut: number;
  beforePaste: number;
  afterPaste: number;
};

/**
 * Page Object for the default grid fixture with the clipboard hooks counted, so a test can tell a
 * keyboard copy, cut or paste that was stopped from one that ran and wrote nothing.
 */
export class ClipboardShortcutsPage extends GridPage {
  /**
   * Counts every clipboard hook the grid runs, and every `keydown` of a letter key that reached the
   * `document` with the verdict the grid left on it.
   */
  async trackClipboard(): Promise<void> {
    await this.page.evaluate(() => {
      const w = window as any;
      const calls = { beforeCopy: 0, afterCopy: 0, beforeCut: 0, afterCut: 0, beforePaste: 0, afterPaste: 0 };

      w.__clipboardCalls = calls;
      w.__keydowns = [];

      (Object.keys(calls) as (keyof typeof calls)[]).forEach((name) => {
        w.hot.addHook(name, () => {
          calls[name] += 1;
        });
      });
      document.addEventListener('keydown', (event) => {
        w.__keydowns.push({ key: event.key, defaultPrevented: event.defaultPrevented });
      });
    });
  }

  async hookCalls(): Promise<HookCalls> {
    return this.page.evaluate(() => ({ ...(window as any).__clipboardCalls }));
  }

  /** Whether the grid left the last `keydown` of this key with its default action cancelled. */
  async lastKeydownWasPrevented(key: string): Promise<boolean> {
    return this.page.evaluate((expectedKey) => {
      const keydowns = (window as any).__keydowns as { key: string; defaultPrevented: boolean }[];

      return keydowns.filter(entry => entry.key.toLowerCase() === expectedKey.toLowerCase()).at(-1)!.defaultPrevented;
    }, key);
  }

  /** Removes a default clipboard shortcut from the grid context, the way an application would. */
  async removeShortcut(key: ClipboardKey): Promise<void> {
    await this.page.evaluate((letter) => {
      (window as any).hot.getShortcutManager().getContext('grid').removeShortcutsByKeys(['Control/Meta', letter]);
    }, key);
  }

  /** Whether the grid context holds a shortcut for the key. */
  async hasShortcut(key: ClipboardKey): Promise<boolean> {
    return this.page.evaluate((letter) => {
      return (window as any).hot.getShortcutManager().getContext('grid').hasShortcut(['Control/Meta', letter]);
    }, key);
  }

  /** Registers the shortcut again, with a callback that does nothing and the default `preventDefault`. */
  async addShortcut(key: ClipboardKey, preventDefault = true): Promise<void> {
    await this.page.evaluate(({ letter, prevent }) => {
      (window as any).hot.getShortcutManager().getContext('grid').addShortcut({
        keys: [['Control/Meta', letter]],
        group: 'test',
        callback: () => {},
        preventDefault: prevent,
      });
    }, { letter: key, prevent: preventDefault });
  }

  /** The public API paste, which builds its own event and never goes through the keyboard. */
  async pasteThroughApi(text: string): Promise<void> {
    await this.page.evaluate(value => (window as any).hot.getPlugin('copyPaste').paste(value), text);
  }
}
