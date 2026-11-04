import { expect, type Locator } from '@playwright/test';
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

  /**
   * Whether the grid left the last `keydown` of this key with its default action cancelled.
   */
  async lastKeydownWasPrevented(key: string): Promise<boolean> {
    return this.page.evaluate((expectedKey) => {
      const keydowns = (window as any).__keydowns as { key: string; defaultPrevented: boolean }[];

      return keydowns.filter(entry => entry.key.toLowerCase() === expectedKey.toLowerCase()).at(-1)!.defaultPrevented;
    }, key);
  }

  /**
   * Removes a default clipboard shortcut from the grid context, the way an application would.
   */
  async removeShortcut(key: ClipboardKey): Promise<void> {
    await this.page.evaluate((letter) => {
      (window as any).hot.getShortcutManager().getContext('grid').removeShortcutsByKeys(['Control/Meta', letter]);
    }, key);
  }

  /**
   * Whether the grid context holds a shortcut for the key.
   */
  async hasShortcut(key: ClipboardKey): Promise<boolean> {
    return this.page.evaluate((letter) => {
      return (window as any).hot.getShortcutManager().getContext('grid').hasShortcut(['Control/Meta', letter]);
    }, key);
  }

  /**
   * Registers the shortcut again, with a callback that does nothing. Pass `false` as `preventDefault`
   * to let the browser run the key.
   */
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

  /**
   * The public API paste, which builds its own event and never goes through the keyboard.
   */
  async pasteThroughApi(text: string): Promise<void> {
    await this.page.evaluate(value => (window as any).hot.getPlugin('copyPaste').paste(value), text);
  }

  /**
   * Writes a value into a cell through the API, so a copy of that cell puts a value of this run on the clipboard.
   */
  async setData(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(([r, c, v]) => (window as any).hot.setDataAtCell(r, c, v), [row, col, value] as const);
  }

  /**
   * Copies a cell with the real keyboard shortcut, which puts its value on the browser clipboard.
   */
  async copyCellWithKeyboard(row: number, col: number): Promise<void> {
    await this.selectCell(row, col);
    await this.page.keyboard.press('ControlOrMeta+c');
  }

  /**
   * Gives a cell an editor that extends `BaseEditor` with an empty `<input>` and nothing else. Like many custom
   * editors, it never switches the shortcut context to `editor`, so the grid context stays active while it is open.
   */
  async useInputEditor(row: number, col: number): Promise<Locator> {
    await this.page.evaluate(([r, c]) => {
      const w = window as any;

      class InputEditor extends w.Handsontable.editors.BaseEditor {
        init() {
          this.input = document.createElement('input');
          this.input.setAttribute('data-testid', 'input-editor');
          this.input.style.display = 'none';
          this.hot.rootElement.appendChild(this.input);
        }

        getValue() {
          return this.input.value;
        }

        setValue() {
          this.input.value = '';
        }

        open() {
          const rect = this.TD.getBoundingClientRect();

          Object.assign(this.input.style, {
            display: 'block',
            position: 'fixed',
            zIndex: '1000',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          });
        }

        close() {
          this.input.style.display = 'none';
        }

        focus() {
          this.input.focus();
        }
      }

      w.hot.setCellMeta(r, c, 'editor', InputEditor);
    }, [row, col]);

    return this.page.getByTestId('input-editor');
  }

  /**
   * Selects a cell, then shows the empty data state overlay over the drawn cells, the way a DataProvider fetch
   * does. The overlay's own shortcut context falls back to the grid's, so the grid shortcuts keep working
   * under it.
   */
  async coverGridWithEmptyDataState(row: number, col: number): Promise<void> {
    await this.selectCell(row, col);
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.updateSettings({ emptyDataState: true });
      hot.runHooks('beforeDataProviderFetch', {});
    });
    await expect(this.page.locator('.ht-empty-data-state').locator('visible=true')).toBeVisible();
  }

  /**
   * Adds an input that is not part of the grid, focuses it from code, and leaves the grid listening, so the grid
   * hears the keys typed into the application's own field.
   */
  async focusInputOutsideGrid(): Promise<Locator> {
    await this.page.evaluate(() => {
      const input = document.createElement('input');

      input.setAttribute('data-testid', 'outside-input');
      document.body.appendChild(input);
      input.focus();
      (window as any).hot.listen();
    });

    const input = this.page.getByTestId('outside-input');

    await expect(input).toBeFocused();
    expect(await this.page.evaluate(() => (window as any).hot.isListening())).toBe(true);

    return input;
  }

  /**
   * The name of the shortcut context the manager currently runs.
   */
  async activeShortcutContext(): Promise<string> {
    return this.page.evaluate(() => (window as any).hot.getShortcutManager().getActiveContextName());
  }

  /**
   * Applies setting overrides to the live grid.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(overrides => (window as any).hot.updateSettings(overrides), settings);
  }
}
