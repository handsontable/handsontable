import { type Page, type ConsoleMessage, expect } from '@playwright/test';

/**
 * Collects the console warnings of a page, and lets a spec wait until every warning logged so far
 * has arrived.
 *
 * `matching` holds only the warnings that contain `needle`, so unrelated console noise (a license
 * notice, say) cannot make an assertion pass on its own. The listener is removed when the page
 * closes, so it cannot outlive the spec that asked for it.
 *
 * Console events reach the test over CDP independently of the calls that caused them. A negative
 * assertion ("nothing was logged") therefore needs `flush()` first: the events arrive in order, so
 * once the flush marker has arrived, every earlier warning has arrived too.
 */
export class ConsoleWarnings {
  /** The warnings that contain the needle, in the order the console delivered them. */
  readonly matching: string[] = [];

  private readonly seen: string[] = [];

  constructor(private readonly page: Page, needle: string) {
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== 'warning') {
        return;
      }

      this.seen.push(message.text());

      if (message.text().includes(needle)) {
        this.matching.push(message.text());
      }
    };

    page.on('console', onConsole);
    page.once('close', () => page.off('console', onConsole));
  }

  /** Waits until every warning the page logged before this call is in `matching`. */
  async flush(): Promise<void> {
    const marker = `console-warnings-flush-${Date.now()}-${Math.random()}`;

    await this.page.evaluate((text) => {
      // eslint-disable-next-line no-console
      console.warn(text);
    }, marker);

    await expect.poll(() => this.seen.includes(marker)).toBe(true);
  }
}
