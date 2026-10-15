import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { awaitBundle, BUNDLE_POLLING_MS, type Bundle } from '../fixtures/bundle';

/**
 * The classic theme declares a zero transition, so it never animates. These cases load an
 * animated theme on the classic legs as well.
 */
function animatedThemeOf(theme: string): string {
  return theme === 'classic' ? 'main' : theme;
}

/**
 * A CSS transition as the page reports it.
 */
interface TransitionTiming {
  property: string;
  pseudo: string | null;
  delay: number;
  duration: number;
}

/**
 * Opens the fixture and freezes the page clock, so the switch keeps its phase until the test
 * advances time. The CSS transitions run on real time, so the cases pause and seek them instead.
 */
async function open(page: Page, theme: string, bundle: Bundle): Promise<void> {
  await page.clock.install();
  await page.goto(`/tests/fixtures/demo/sheets-bar-switch-styles.html?theme=${theme}&bundle=${bundle}`);
  await awaitBundle(page);
  await page.waitForFunction(() => {
    const win = window as never as { hot?: any, htFixtureError?: string };

    if (win.htFixtureError) {
      throw new Error(win.htFixtureError);
    }

    return win.hot?.rootElement.querySelector('.ht_master td') !== null
      && document.querySelector('.ht-sheets-bar__tab') !== null;
  }, null, { polling: BUNDLE_POLLING_MS });
  await page.clock.pauseAt(Date.now() + 60_000);
}

/**
 * Switches to a sheet through the API.
 */
async function switchTo(page: Page, name: string): Promise<void> {
  await page.evaluate(sheet => (window as never as { hot: any }).hot.getPlugin('sheetsBar').setActiveSheet(sheet), name);
}

/**
 * The switch state the grid element carries, or `null` when it carries none.
 */
async function switchState(page: Page): Promise<string | null> {
  return page.evaluate(() => (window as never as { hot: any }).hot.rootGridElement.getAttribute('data-ht-sheet-switch'));
}

/**
 * Runs the page clock past every phase of the switch and every CSS transition and animation of the
 * grid to its end.
 */
async function settle(page: Page): Promise<void> {
  await page.clock.runFor(10_000);
  await page.evaluate(() => {
    (window as never as { hot: any }).hot.rootGridElement.getAnimations({ subtree: true })
      .forEach((animation: Animation) => animation.finish());
  });

  expect(await switchState(page)).toBeNull();
}

/**
 * Switches away to Beta and back to Alpha, so the selection made on Alpha is restored by a switch
 * that is now in its swap.
 */
async function returnToAlpha(page: Page): Promise<void> {
  await switchTo(page, 'Beta');
  await settle(page);
  await switchTo(page, 'Alpha');

  expect(await switchState(page)).toBe('pending');
}

/**
 * Advances the page clock in small steps until the swap ends and the reveal starts. The reveal's
 * CSS transitions run on real time and can end before the next read, so they are paused in the
 * same task that starts the reveal, at their first frame: `getAnimations()` updates the style
 * first, which is what creates them.
 */
async function runToReveal(page: Page): Promise<void> {
  await page.evaluate(() => {
    const grid = (window as never as { hot: any }).hot.rootGridElement as HTMLElement;
    const observer = new MutationObserver(() => {
      if (grid.getAttribute('data-ht-sheet-switch') === 'reveal') {
        observer.disconnect();
        grid.getAnimations({ subtree: true }).forEach(animation => animation.pause());
      }
    });

    observer.observe(grid, { attributes: true, attributeFilter: ['data-ht-sheet-switch'] });
  });

  for (let step = 0; step < 400 && await switchState(page) === 'pending'; step += 1) {
    await page.clock.runFor(5);
  }

  expect(await switchState(page)).toBe('reveal');
}

/**
 * Resolves a value of the grid's theme by applying it to a probe element inside the grid root.
 */
async function resolved(page: Page, property: string, value: string): Promise<string> {
  return page.evaluate(([name, expression]) => {
    const root = (window as never as { hot: any }).hot.rootElement as HTMLElement;
    const probe = document.createElement('div');

    probe.style.setProperty(name, expression);
    root.appendChild(probe);

    const result = getComputedStyle(probe).getPropertyValue(name);

    probe.remove();

    return result;
  }, [property, value]);
}

/**
 * Reads a computed style of the first element a selector matches inside the grid root, or of
 * one of its pseudo-elements.
 */
async function styleOf(page: Page, selector: string, property: string, pseudo?: string): Promise<string> {
  return page.evaluate(([target, name, pseudoElement]) => {
    const element = (window as never as { hot: any }).hot.rootElement.querySelector(target);

    if (element === null) {
      throw new Error(`Nothing matches ${target}`);
    }

    return getComputedStyle(element, pseudoElement || null).getPropertyValue(name);
  }, [selector, property, pseudo ?? ''] as const);
}

/**
 * Reads the class list of the first element a selector matches inside the grid root.
 */
async function classesOf(page: Page, selector: string): Promise<string[]> {
  return page.evaluate(target => Array.from((window as never as { hot: any }).hot.rootElement
    .querySelector(target)?.classList ?? []), selector);
}

/**
 * Pauses the CSS transitions that run on an element and its subtree, and answers their timing.
 */
async function pausedTransitions(page: Page, selector: string): Promise<TransitionTiming[]> {
  return page.evaluate((target) => {
    const element = (window as never as { hot: any }).hot.rootElement.querySelector(target) as HTMLElement;

    return element.getAnimations({ subtree: true })
      .filter(animation => animation instanceof CSSTransition)
      .map((animation) => {
        const transition = animation as CSSTransition;
        const effect = transition.effect as KeyframeEffect;
        const timing = effect.getTiming();

        transition.pause();

        return {
          property: transition.transitionProperty,
          pseudo: effect.pseudoElement,
          delay: Number(timing.delay ?? 0),
          duration: Number(timing.duration ?? 0),
        };
      });
  }, selector);
}

/**
 * Seeks the paused CSS transitions of an element and its subtree to a fraction of their run.
 */
async function seekTransitions(page: Page, selector: string, fraction: number): Promise<void> {
  await page.evaluate(([target, progress]) => {
    const element = (window as never as { hot: any }).hot.rootElement.querySelector(target) as HTMLElement;

    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = Number(animation.effect?.getComputedTiming().endTime ?? 0) * progress;
    });
  }, [selector, fraction] as const);
}

/**
 * The theme's base transition, `--ht-table-transition`, in milliseconds.
 */
async function transitionMs(page: Page): Promise<number> {
  return page.evaluate(() => {
    const value = getComputedStyle((window as never as { hot: any }).hot.rootElement)
      .getPropertyValue('--ht-table-transition').trim();
    const amount = Number.parseFloat(value);

    return value.endsWith('ms') ? amount : amount * 1000;
  });
}

const COLUMN_HEADER = (col: number) => `.ht_clone_top [data-testid="col-header-${col}"]`;
const ROW_HEADER = (row: number) => `.ht_clone_inline_start [data-testid="row-header-${row}"]`;

test.describe('sheets bar switch animation – header decorations', () => {
  test('a filtered selected column header keeps its filter tint while the switch hides the selection', async ({
    page, theme, bundle,
  }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;
      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'not_empty', []);
      filters.filter();
      hot.selectColumns(1, 2);
    });

    const filterTint = await resolved(page, 'background-color', 'var(--ht-header-filter-background-color)');
    const plain = await resolved(page, 'background-color', 'var(--ht-header-background-color)');
    const selected = await styleOf(page, COLUMN_HEADER(1), 'background-color');

    expect(filterTint).not.toBe(plain);
    expect(selected).not.toBe(filterTint);

    await returnToAlpha(page);

    expect(await classesOf(page, COLUMN_HEADER(1))).toEqual(expect.arrayContaining(['htFiltersActive', 'ht__active_highlight']));
    expect(await classesOf(page, COLUMN_HEADER(2))).toContain('ht__active_highlight');
    expect(await classesOf(page, COLUMN_HEADER(2))).not.toContain('htFiltersActive');
    expect(await styleOf(page, COLUMN_HEADER(1), 'background-color')).toBe(filterTint);
    expect(await styleOf(page, COLUMN_HEADER(2), 'background-color')).toBe(plain);

    await runToReveal(page);
    await settle(page);

    expect(await styleOf(page, COLUMN_HEADER(1), 'background-color')).toBe(selected);
  });

  test('the hidden-column caret and the menu button of a selected header look unselected while the switch hides the selection', async ({
    page, theme, bundle,
  }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.getPlugin('hiddenColumns').hideColumn(2);
      hot.render();
      hot.selectColumns(1);
    });

    const caret = `${COLUMN_HEADER(1)} > .ht-hidden-indicator-end`;
    const menuIcon = `${COLUMN_HEADER(1)} .changeType .ht-icon`;
    const plainCaret = await resolved(page, 'color', 'var(--ht-hidden-indicator-color)');
    const plainIcon = await resolved(page, 'color', 'var(--ht-icon-button-icon-color)');
    const selectedCaret = await styleOf(page, caret, 'color');
    const selectedIcon = await styleOf(page, menuIcon, 'color');

    expect(selectedCaret).not.toBe(plainCaret);
    expect(selectedIcon).not.toBe(plainIcon);

    await returnToAlpha(page);

    expect(await classesOf(page, COLUMN_HEADER(1))).toEqual(expect.arrayContaining(['beforeHiddenColumn', 'ht__active_highlight']));
    expect(await styleOf(page, caret, 'color')).toBe(plainCaret);
    expect(await styleOf(page, menuIcon, 'color')).toBe(plainIcon);

    await runToReveal(page);

    expect((await pausedTransitions(page, caret)).map(fade => fade.property)).toEqual(['color']);
    expect((await pausedTransitions(page, menuIcon)).map(fade => fade.property)).toEqual(['color']);

    await settle(page);

    expect(await styleOf(page, caret, 'color')).toBe(selectedCaret);
    expect(await styleOf(page, menuIcon, 'color')).toBe(selectedIcon);
  });

  test('the header accent line grows back with the header on the reveal', async ({ page, bundle }) => {
    await open(page, 'horizon', bundle);
    await page.evaluate(() => (window as never as { hot: any }).hot.selectCell(1, 1));

    const accent = `${COLUMN_HEADER(1)} .relative`;
    const accentHeight = await styleOf(page, accent, 'height', '::after');

    expect(Number.parseFloat(accentHeight)).toBeGreaterThan(0);

    await returnToAlpha(page);

    expect(await styleOf(page, accent, 'height', '::after')).toBe('0px');

    await runToReveal(page);

    const growth = (await pausedTransitions(page, COLUMN_HEADER(1)))
      .filter(fade => fade.pseudo === '::after' && fade.property === 'height');

    expect(growth).toHaveLength(1);
    expect(growth[0].duration).toBeCloseTo(await transitionMs(page));

    await seekTransitions(page, COLUMN_HEADER(1), 0);

    expect(await styleOf(page, accent, 'height', '::after')).toBe('0px');

    await seekTransitions(page, COLUMN_HEADER(1), 0.5);

    const midway = Number.parseFloat(await styleOf(page, accent, 'height', '::after'));

    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(Number.parseFloat(accentHeight));

    await seekTransitions(page, COLUMN_HEADER(1), 1);

    expect(await styleOf(page, accent, 'height', '::after')).toBe(accentHeight);
  });
});

test.describe('sheets bar switch animation – focused header', () => {
  test('a focused row header loses its focus ring during the swap and fades it in with the selection', async ({
    page, theme, bundle,
  }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => (window as never as { hot: any }).hot.selectCell(1, -1));

    const ring = await styleOf(page, ROW_HEADER(1), 'box-shadow');

    expect(await classesOf(page, ROW_HEADER(1))).toContain('current');
    expect(ring).not.toBe('none');

    await returnToAlpha(page);

    expect(await classesOf(page, ROW_HEADER(1))).toContain('current');
    expect(await styleOf(page, ROW_HEADER(1), 'box-shadow')).toBe('none');

    await runToReveal(page);

    const transition = await transitionMs(page);
    const fades = (await pausedTransitions(page, ROW_HEADER(1)))
      .filter(fade => fade.pseudo === null && fade.property === 'box-shadow');

    expect(fades).toHaveLength(1);
    expect(fades[0].delay).toBeCloseTo(transition / 3);
    expect(fades[0].duration).toBeCloseTo((transition * 2) / 3);

    await seekTransitions(page, ROW_HEADER(1), 1);

    expect(await styleOf(page, ROW_HEADER(1), 'box-shadow')).toBe(ring);
  });

  test('a switch waiting for rows keeps the focused header\'s ring, and a swap hides it', async ({ page, theme, bundle }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => (window as never as { hot: any }).hot.selectCell(1, -1));

    const ring = await styleOf(page, ROW_HEADER(1), 'box-shadow');
    const stateTo = (state: string) => page.evaluate(value => (window as never as { hot: any }).hot
      .rootGridElement.setAttribute('data-ht-sheet-switch', value), state);

    expect(ring).not.toBe('none');

    await stateTo('awaiting');

    expect(await styleOf(page, ROW_HEADER(1), 'box-shadow')).toBe(ring);

    await stateTo('pending');

    expect(await styleOf(page, ROW_HEADER(1), 'box-shadow')).toBe('none');
  });
});

test.describe('sheets bar switch animation – cell and header marks in the copies', () => {
  /**
   * Answers, for each listed text a copy of one side of the swap draws, whether that copy draws
   * the comment mark, and the color of that mark. A column of single-line cells is drawn as one
   * copy, so a text is looked up among its lines.
   */
  async function copyMarks(page: Page, side: 'in' | 'out', texts: string[]): Promise<Record<string, { marked: boolean, color: string }>> {
    return page.evaluate(([sideName, wanted]) => {
      const marks: Record<string, { marked: boolean, color: string }> = {};

      document.querySelectorAll(`.ht-sheet-switch__${sideName} .ht-sheet-switch__cell`).forEach((copy) => {
        const after = getComputedStyle(copy, '::after');

        (copy.textContent ?? '').split('\n').filter(text => wanted.includes(text)).forEach((text) => {
          marks[text] = { marked: after.content !== 'none', color: after.borderTopColor };
        });
      });

      return marks;
    }, [side, texts] as const);
  }

  test('a commented cell\'s copies carry its comment mark through the swap, both leaving and arriving', async ({
    page, theme, bundle,
  }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('comments').setCommentAtCell(1, 1, 'Alpha note'));

    const markColor = await page.evaluate(() => getComputedStyle((window as never as { hot: any }).hot.getCell(1, 1), '::after')
      .borderTopColor);

    await switchTo(page, 'Beta');
    await settle(page);
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('comments').setCommentAtCell(2, 2, 'Beta note'));
    await switchTo(page, 'Alpha');
    await settle(page);
    await switchTo(page, 'Beta');

    expect(await switchState(page)).toBe('pending');
    expect(await copyMarks(page, 'out', ['A1-1', 'A1-2'])).toEqual({
      'A1-1': { marked: true, color: markColor },
      'A1-2': { marked: false, color: expect.any(String) },
    });
    expect(await copyMarks(page, 'in', ['B2-2', 'B1-1'])).toEqual({
      'B2-2': { marked: true, color: markColor },
      'B1-1': { marked: false, color: expect.any(String) },
    });
  });

  test('a sorted header\'s leaving copy draws the sort indicator and the menu button where the header drew them', async ({
    page, theme, bundle,
  }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' }));

    const boxOf = (selector: string) => page.evaluate((target) => {
      const element = document.querySelector(target);

      if (element === null) {
        throw new Error(`Nothing matches ${target}`);
      }

      const { left, top, width, height } = element.getBoundingClientRect();

      return { left, top, width, height };
    }, selector);
    const drawn = await boxOf(`${COLUMN_HEADER(2)} .ht-sort-indicator`);
    const drawnButton = await boxOf(`${COLUMN_HEADER(2)} .changeType`);

    expect(drawn.width).toBeGreaterThan(0);
    expect(drawnButton.width).toBeGreaterThan(0);

    await switchTo(page, 'Beta');
    await page.evaluate(() => {
      document.querySelectorAll('.ht-sheet-switch__out').forEach(side => side.getAnimations().forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      }));
    });

    const copied = await boxOf('.ht-sheet-switch__out .ht-sort-indicator');
    const copiedButton = await page.evaluate((left) => {
      const buttons = Array.from(document.querySelectorAll('.ht-sheet-switch__out .changeType'))
        .map(button => button.getBoundingClientRect())
        .sort((first, second) => Math.abs(first.left - left) - Math.abs(second.left - left));

      return { left: buttons[0].left, top: buttons[0].top, width: buttons[0].width, height: buttons[0].height };
    }, drawnButton.left);

    [[copied, drawn], [copiedButton, drawnButton]].forEach(([copy, source]) => {
      expect(Math.abs(copy.left - source.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(copy.top - source.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(copy.width - source.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(copy.height - source.height)).toBeLessThanOrEqual(1);
    });
  });
});

test.describe('sheets bar switch animation – timing and stacking', () => {
  test('the selection fade reads its delay and duration from the grid element', async ({ page, theme, bundle }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await page.evaluate(() => (window as never as { hot: any }).hot.selectCell(1, 1));
    await returnToAlpha(page);

    const transition = await transitionMs(page);
    const timing = await page.evaluate(() => {
      const { style } = (window as never as { hot: any }).hot.rootGridElement as HTMLElement;

      return [
        style.getPropertyValue('--ht-private-sheet-switch-mark-delay'),
        style.getPropertyValue('--ht-private-sheet-switch-mark-duration'),
      ];
    });

    expect(timing.map(value => Number.parseFloat(value))).toEqual([
      expect.closeTo(transition / 3, 3),
      expect.closeTo((transition * 2) / 3, 3),
    ]);

    await runToReveal(page);

    const fades = await page.evaluate(() => Array.from((window as never as { hot: any }).hot.rootElement
      .querySelectorAll(':scope > .ht_master .wtBorder.current'))
      .filter(border => (border as HTMLElement).getClientRects().length > 0)
      .flatMap(border => (border as HTMLElement).getAnimations())
      .filter(animation => animation instanceof CSSTransition && animation.transitionProperty === 'opacity')
      .map((animation) => {
        const timingOf = (animation.effect as KeyframeEffect).getTiming();

        animation.pause();

        return [Number(timingOf.delay), Number(timingOf.duration)];
      }));

    expect(fades.length).toBeGreaterThan(0);
    fades.forEach(([delay, duration]) => {
      expect(delay).toBeCloseTo(transition / 3);
      expect(duration).toBeCloseTo((transition * 2) / 3);
    });
  });

  test('the swap layer stacks at the topmost frozen corner\'s level, after it, and never above it', async ({
    page, theme, bundle,
  }) => {
    await open(page, animatedThemeOf(theme), bundle);
    await switchTo(page, 'Beta');

    const stacking = await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;
      const layer = hot.rootGridElement.querySelector(':scope > .ht-sheet-switch') as HTMLElement;
      const clones = Array.from(hot.rootElement.querySelectorAll(':scope > [class*="ht_clone_"]')) as HTMLElement[];

      return {
        layer: Number(getComputedStyle(layer).zIndex),
        clones: clones.map(clone => Number(getComputedStyle(clone).zIndex)),
        isLast: hot.rootGridElement.lastElementChild === layer,
      };
    });

    expect(stacking.clones.length).toBeGreaterThan(0);
    expect(stacking.layer).toBe(Math.max(...stacking.clones));
    expect(stacking.isLast).toBe(true);
  });
});
