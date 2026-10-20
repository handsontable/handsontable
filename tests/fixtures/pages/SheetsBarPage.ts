import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the sheets-bar fixture (fixtures/demo/sheets-bar.html).
 */
export class SheetsBarPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly bar: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.bar = page.getByTestId('sheets-bar');
  }

  async goto(options: {
    rtl?: boolean,
    filters?: boolean,
    loadSwitches?: boolean,
    barOff?: boolean,
  } = {}): Promise<void> {
    const rtlParam = options.rtl ? '&rtl=1' : '';
    const filtersParam = [
      options.filters ? '&filters=1' : '',
      options.loadSwitches ? '&loadSwitches=1' : '',
      options.barOff ? '&barOff=1' : '',
    ].join('');
    // A script error on the fixture leaves the page with no test ids at all, which surfaces as
    // an unexplained ten-second timeout on the first locator. Collecting the errors turns that
    // into the actual cause — this suite has seen rare page-load failures whose artifacts
    // carried no page state to explain them.
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar.html?theme=${this.theme}&bundle=${this.bundle}${rtlParam}${filtersParam}`);

    await expect(
      options.barOff ? this.cell(0, 0) : this.tab(0),
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  tab(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-${index}`);
  }

  tabByName(name: string): Locator {
    // The tab itself carries the button role now, and its accessible name is the sheet name —
    // the trigger glyph inside it is hidden from the accessibility tree.
    return this.bar.getByRole('button', { name, exact: true });
  }

  chevron(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-chevron-${index}`);
  }

  chevronByName(name: string): Locator {
    return this.tabByName(name).locator('.ht-sheets-bar__tab-chevron');
  }

  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header, scoped to the top overlay so the match is unambiguous.
   */
  columnHeader(col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`);
  }

  /**
   * The sorting label inside a column header.
   */
  sortLabel(col: number): Locator {
    return this.columnHeader(col).locator('span.colHeader');
  }

  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (window as never as { hot: any }).hot.getSelected() ?? null);
  }

  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!(window as never as { hot: any }).hot.getActiveEditor()?.isOpened());
  }

  async dataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as never as { hot: any }).hot.getDataAtCell(r, c), [row, col]);
  }

  async clickTab(index: number): Promise<void> {
    await this.tab(index).locator('.ht-sheets-bar__tab-label').click();
  }

  async expectActiveTab(index: number): Promise<void> {
    // The tab is the control, so the state lives on the tab rather than on the label inside it.
    await expect(this.tab(index)).toHaveAttribute('aria-current', 'true');
  }

  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  menuItem(label: string): Locator {
    return this.page.locator('.htMenu:visible td', { hasText: label }).first();
  }

  get addButton(): Locator {
    return this.page.getByTestId('sheets-bar-add');
  }

  get allButton(): Locator {
    return this.page.getByTestId('sheets-bar-all');
  }

  get renameInput(): Locator {
    return this.page.locator('.ht-sheets-bar__tab-rename');
  }

  get pagePrev(): Locator {
    return this.page.getByTestId('sheets-bar-page-prev');
  }

  get pageNext(): Locator {
    return this.page.getByTestId('sheets-bar-page-next');
  }

  get pagingSection(): Locator {
    return this.page.locator('.ht-sheets-bar__paging');
  }

  /**
   * The temporary element that slides the active tab marker during a sheet switch.
   */
  get indicator(): Locator {
    return this.bar.locator('.ht-sheets-bar__tab-indicator');
  }

  /**
   * The tab strip, the scrolling container the indicator lives in.
   */
  get strip(): Locator {
    return this.bar.locator('.ht-sheets-bar__tabs');
  }

  /**
   * Records, from before the fixture's first script runs, every trace of the bar's motion: a tab
   * marker inserted into the strip, and a tab carrying the entrance class. Call it before
   * `goto()`, so the observer watches the grid's construction too.
   */
  async recordMotionFromStart(): Promise<void> {
    await this.page.addInitScript(() => {
      const record = { indicators: 0, entrances: 0 };
      const isEntering = (node: Node) => node instanceof Element
        && (node.classList.contains('ht-sheets-bar__tab--entering')
          || node.querySelector('.ht-sheets-bar__tab--entering') !== null);
      const countAdded = (node: Node) => {
        if (!(node instanceof Element)) {
          return;
        }

        record.indicators += node.matches('.ht-sheets-bar__tab-indicator')
          ? 1
          : node.querySelectorAll('.ht-sheets-bar__tab-indicator').length;
        record.entrances += isEntering(node) ? 1 : 0;
      };

      (window as never as { htMotionRecord: typeof record }).htMotionRecord = record;
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(countAdded);
          } else if (isEntering(mutation.target)) {
            record.entrances += 1;
          }
        });
      }).observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    });
  }

  /**
   * Reads what `recordMotionFromStart()` recorded so far. Mutation records are delivered as
   * microtasks, so everything a finished evaluation did is counted.
   */
  async motionRecord(): Promise<{ indicators: number, entrances: number }> {
    return this.page.evaluate(() => ({
      ...(window as never as { htMotionRecord: { indicators: number, entrances: number } }).htMotionRecord,
    }));
  }

  /**
   * Opens the fixture with the page clock installed, waits until the bar's motion gate is open, and
   * then freezes the clock, so the timers that end a slide only run when the test advances time.
   * The gate opens in the second animation frame after the first render, and a frame requested
   * while the clock is paused never fires, so pausing before the gate opened leaves every motion
   * instant for the rest of the test.
   */
  async gotoWithPausedClock(options: Parameters<SheetsBarPage['goto']>[0] = {}): Promise<void> {
    await this.page.clock.install();
    await this.goto(options);
    await this.waitForFrames();
    await this.page.clock.pauseAt(Date.now() + 60_000);
  }

  /**
   * Waits for two animation frames of the page, so the grid has been painted at least once
   * since the last task the test ran.
   */
  async waitForFrames(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * Starts counting every indicator element the page inserts from now on.
   */
  async recordIndicators(): Promise<void> {
    await this.page.evaluate(() => {
      const target = window as never as { htIndicatorsAdded: number };

      target.htIndicatorsAdded = 0;
      new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('ht-sheets-bar__tab-indicator')) {
              target.htIndicatorsAdded += 1;
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    });
  }

  /**
   * How many indicator elements the page inserted since `recordIndicators()`. Mutation records
   * are delivered as microtasks, so they are all in by the time this evaluation runs.
   */
  async indicatorsAdded(): Promise<number> {
    return this.page.evaluate(() => (window as never as { htIndicatorsAdded: number }).htIndicatorsAdded);
  }

  /**
   * Pauses, from now on, every CSS transition of the tab marker the moment it starts, so a later
   * seek reads it from its start. The transitions run on real time, which the page clock does not
   * control: left running, they can end before a slow run reads them, and a finished transition
   * is gone from `getAnimations()`. Mutation records are delivered as microtasks, so the
   * transitions a switch starts are paused before any frame is drawn.
   */
  async holdTransitions(): Promise<void> {
    await this.page.evaluate(() => {
      const hold = () => document.getAnimations().forEach((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;

        if (
          animation instanceof CSSTransition && animation.playState === 'running'
          && target instanceof Element && target.closest('.ht-sheets-bar__tab-indicator') !== null
        ) {
          animation.pause();
        }
      });

      new MutationObserver(hold).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    });
  }

  /**
   * Pauses the indicator's CSS transitions at a fraction of their run and returns its viewport
   * box at that point, with the number of transitions it carries.
   */
  async indicatorBoxAt(progress: number): Promise<{ left: number, width: number, transitions: number }> {
    return this.page.evaluate((fraction) => {
      const indicator = document.querySelector('.ht-sheets-bar__tab-indicator');

      if (!(indicator instanceof HTMLElement)) {
        throw new Error('No indicator to measure');
      }

      const animations = indicator.getAnimations();

      animations.forEach((animation) => {
        const end = Number(animation.effect?.getComputedTiming().endTime ?? 0);

        animation.pause();
        animation.currentTime = end * fraction;
      });

      const rect = indicator.getBoundingClientRect();

      return { left: rect.left, width: rect.width, transitions: animations.length };
    }, progress);
  }

  /**
   * The name of the last sheet in the workbook, which is where a new sheet lands.
   */
  async lastSheetName(): Promise<string> {
    return this.page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').getSheets().at(-1).name);
  }

  /**
   * Starts recording every tab element the page inserts from now on: its sheet name, whether it
   * wears the entrance class, and its inline `animation-delay`. CSS animations run on real time,
   * which the page clock does not control, so the recorder also pauses each inserted tab's
   * entrance where it starts, before any frame is drawn, for `tabEntranceBoxAt()` to seek.
   */
  async recordTabEntrances(): Promise<void> {
    await this.page.evaluate(() => {
      const target = window as never as { htTabsAdded: Array<{ name: string, entering: boolean, delay: string }> };

      target.htTabsAdded = [];
      new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('ht-sheets-bar__tab')) {
              target.htTabsAdded.push({
                name: node.querySelector('.ht-sheets-bar__tab-label')?.textContent ?? '',
                entering: node.classList.contains('ht-sheets-bar__tab--entering'),
                delay: node.style.animationDelay,
              });
              node.getAnimations().forEach(animation => animation.pause());
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    });
  }

  /**
   * The tab elements `recordTabEntrances()` saw inserted, optionally only those of one sheet.
   * Mutation records are delivered as microtasks, so they are all in by the time this
   * evaluation runs.
   */
  async tabsAdded(name?: string): Promise<Array<{ name: string, entering: boolean, delay: string }>> {
    const added: Array<{ name: string, entering: boolean, delay: string }> = await this.page.evaluate(
      () => (window as never as { htTabsAdded: any[] }).htTabsAdded,
    );

    return name === undefined ? added : added.filter(entry => entry.name === name);
  }

  /**
   * The entrance state of the tab now shown for a sheet: whether it wears the entrance class, and
   * its inline `animation-delay`.
   */
  async tabEntrance(name: string): Promise<{ entering: boolean, delay: string }> {
    return this.page.evaluate((sheetName) => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(tab instanceof HTMLElement)) {
        throw new Error(`No tab for ${sheetName}`);
      }

      return {
        entering: tab.classList.contains('ht-sheets-bar__tab--entering'),
        delay: tab.style.animationDelay,
      };
    }, name);
  }

  /**
   * Pauses a sheet tab's CSS animations at a fraction of their run and returns its viewport box
   * and opacity at that point, its resting left edge (the box without the transform), and the
   * number of animations it carries. Seek below 1: an animation paused at its end no longer
   * applies, and no later call finds it.
   */
  async tabEntranceBoxAt(name: string, progress: number): Promise<{
    left: number,
    restLeft: number,
    width: number,
    opacity: number,
    animations: number,
  }> {
    return this.page.evaluate(({ sheetName, fraction }) => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(tab instanceof HTMLElement)) {
        throw new Error(`No tab for ${sheetName}`);
      }

      const animations = tab.getAnimations().filter(animation => animation instanceof CSSAnimation);

      animations.forEach((animation) => {
        const timing = animation.effect?.getComputedTiming();
        const start = Number(timing?.delay ?? 0);
        const active = Number(timing?.activeDuration ?? 0);

        animation.pause();
        animation.currentTime = start + (active * fraction);
      });

      const rect = tab.getBoundingClientRect();
      const style = getComputedStyle(tab);

      return {
        left: rect.left,
        restLeft: rect.left - new DOMMatrix(style.transform).m41,
        width: rect.width,
        opacity: Number(style.opacity),
        animations: animations.length,
      };
    }, { sheetName: name, fraction: progress });
  }

  /**
   * The computed background color of a tab.
   */
  async tabBackground(index: number): Promise<string> {
    return this.tab(index).evaluate(tab => getComputedStyle(tab).backgroundColor);
  }

  /**
   * Re-sends the `sheetsBar` setting with the same `sheets` array, the way the React, Vue, and
   * Angular wrappers do on every render of the component that holds the grid.
   */
  async resendSheetsSetting(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.updateSettings({ sheetsBar: { sheets: hot.getSettings().sheetsBar.sheets } });
    });
  }

  /**
   * Sets the bar's `animation` option through `updateSettings()`, re-sending the same `sheets`
   * array, so the round trip keeps the workbook.
   */
  async setAnimation(animation: boolean | Record<string, boolean>): Promise<void> {
    await this.page.evaluate((value) => {
      const hot = (window as never as { hot: any }).hot;

      hot.updateSettings({ sheetsBar: { sheets: hot.getSettings().sheetsBar.sheets, animation: value } });
    }, animation);
  }

  /**
   * How many `transform` transitions the tabs carry now, running or held: the motion of a tab
   * slide.
   */
  async runningTabSlides(): Promise<number> {
    return this.strip.evaluate(strip => strip.getAnimations({ subtree: true })
      .filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;

        return animation instanceof CSSTransition && animation.transitionProperty === 'transform'
          && target instanceof Element && target.classList.contains('ht-sheets-bar__tab');
      })
      .length);
  }

  /**
   * Presses a sheet's tab and drags it until its centre passes the centre of the tab of
   * `pastName`, without releasing it, so the strip pushes that tab aside. Release with
   * `page.mouse.up()`.
   */
  async dragTabPast(name: string, pastName: string): Promise<void> {
    const dragged = await this.tabByName(name).boundingBox();
    const past = await this.tabByName(pastName).boundingBox();

    if (dragged === null || past === null) {
      throw new Error(`The tabs of ${name} and ${pastName} are not rendered`);
    }

    const startX = dragged.x + (dragged.width / 2);
    const y = dragged.y + (dragged.height / 2);
    const shift = (past.x + (past.width / 2)) - startX;

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + Math.sign(shift) * 5, y, { steps: 2 });
    await this.page.mouse.move(startX + shift + Math.sign(shift) * 6, y, { steps: 6 });
  }

  /**
   * The duration a sheet's tab gives its `transform` transition, in milliseconds.
   */
  async tabTransformDurationMs(name: string): Promise<number> {
    return this.tabByName(name).evaluate((tab) => {
      const style = getComputedStyle(tab);
      const properties = style.transitionProperty.split(',').map(value => value.trim());
      const durations = style.transitionDuration.split(',').map(value => value.trim());
      const index = properties.findIndex(property => property === 'transform' || property === 'all');
      const duration = index === -1 ? '0s' : durations[index % durations.length];

      return Math.round(duration.endsWith('ms') ? parseFloat(duration) : parseFloat(duration) * 1000);
    });
  }

  /**
   * How far the tab strip is scrolled from its start, and how far it can scroll. Under RTL the
   * strip scrolls into negative `scrollLeft`, so the distance is its magnitude.
   */
  async stripScroll(): Promise<{ travelled: number, total: number }> {
    return this.strip.evaluate(strip => ({
      travelled: Math.abs(strip.scrollLeft),
      total: strip.scrollWidth - strip.clientWidth,
    }));
  }

  /**
   * The color the page shows at a point inside a tab: near its inline-start edge, halfway down,
   * where neither the label nor the active line draws. Read from a one-pixel screenshot, so it
   * is what the user sees whichever layer paints it.
   */
  async tabSurfaceColor(index: number): Promise<string> {
    const box = await this.tab(index).boundingBox();

    if (box === null) {
      throw new Error(`Tab ${index} is not rendered`);
    }

    const png = await this.page.screenshot({
      clip: { x: Math.round(box.x) + 2, y: Math.round(box.y + (box.height / 2)), width: 1, height: 1 },
    });

    return this.page.evaluate(async (base64) => {
      const image = new Image();

      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const canvas = document.createElement('canvas');

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d') as CanvasRenderingContext2D;

      context.drawImage(image, 0, 0);

      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

      return `rgb(${red}, ${green}, ${blue})`;
    }, png.toString('base64'));
  }

  /**
   * Pauses, from now on, every CSS transition and animation inside the tab strip the moment it
   * starts, so a later seek reads it from its start. Both run on real time, which the page clock
   * does not control. Mutation records are delivered as microtasks, so the motion a move or a
   * removal starts is paused before any frame is drawn. The observer watches the whole page and
   * looks the strip up on every record, because a settings update that rebuilds the bar
   * replaces the strip element.
   */
  async holdStripMotion(): Promise<void> {
    await this.page.evaluate(() => {
      if (document.querySelector('.ht-sheets-bar__tabs') === null) {
        throw new Error('No tab strip to hold');
      }

      const hold = () => document.querySelector('.ht-sheets-bar__tabs')?.getAnimations({ subtree: true })
        .forEach((animation) => {
          if (animation.playState === 'running') {
            animation.pause();
          }
        });

      new MutationObserver(hold).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    });
  }

  /**
   * Starts recording, from now on, whether the strip ever wore the sliding class and how many
   * leaving copies of removed tabs it received.
   */
  async recordStripMotion(): Promise<void> {
    await this.page.evaluate(() => {
      const strip = document.querySelector('.ht-sheets-bar__tabs');
      const record = { sliding: false, ghosts: 0 };

      if (strip === null) {
        throw new Error('No tab strip to record');
      }

      (window as never as { htStripMotion: typeof record }).htStripMotion = record;
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            record.sliding ||= strip.classList.contains('ht-sheets-bar__tabs--sliding');
          }

          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element && node.classList.contains('ht-sheets-bar__tab-ghost')) {
              record.ghosts += 1;
            }
          });
        });
      }).observe(strip, { childList: true, attributes: true, attributeFilter: ['class'] });
    });
  }

  /**
   * What `recordStripMotion()` recorded so far, with the number of CSS transitions and
   * animations running inside the strip now.
   */
  async stripMotionRecord(): Promise<{ sliding: boolean, ghosts: number, animations: number }> {
    return this.page.evaluate(() => ({
      ...(window as never as { htStripMotion: { sliding: boolean, ghosts: number } }).htStripMotion,
      animations: document.querySelector('.ht-sheets-bar__tabs')?.getAnimations({ subtree: true }).length ?? 0,
    }));
  }

  /**
   * The leaving copy of a removed tab.
   */
  get ghost(): Locator {
    return this.bar.locator('.ht-sheets-bar__tab-ghost');
  }

  /**
   * Pauses the CSS transitions and animations of a sheet's tab, or of the leaving copy of a
   * removed tab when `name` is `null`, at a fraction of their run, and returns its viewport box,
   * its resting left edge (the box without the transform), its opacity, and the active duration
   * of each. Seek below 1: a transition paused at its end no longer applies.
   */
  async stripMotionAt(name: string | null, progress: number): Promise<{
    left: number,
    restLeft: number,
    width: number,
    opacity: number,
    durations: number[],
  }> {
    return this.page.evaluate(({ sheetName, fraction }) => {
      const element = sheetName === null
        ? document.querySelector('.ht-sheets-bar__tab-ghost')
        : Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
          .find(tab => tab.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(element instanceof HTMLElement)) {
        throw new Error(`No element for ${sheetName ?? 'the leaving tab'}`);
      }

      const animations = element.getAnimations();

      animations.forEach((animation) => {
        const timing = animation.effect?.getComputedTiming();

        animation.pause();
        animation.currentTime = Number(timing?.delay ?? 0) + (Number(timing?.activeDuration ?? 0) * fraction);
      });

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return {
        left: rect.left,
        restLeft: rect.left - new DOMMatrix(style.transform).m41,
        width: rect.width,
        opacity: Number(style.opacity),
        durations: animations.map(animation => Number(animation.effect?.getComputedTiming().activeDuration ?? 0)),
      };
    }, { sheetName: name, fraction: progress });
  }

  /**
   * Starts recording, from now on, every CSS transition that starts on a tab: the tab's sheet
   * name and the transitioned property. `transitionrun` fires when a transition is created, so
   * the record does not depend on how long the transition runs.
   */
  async recordTabTransitions(): Promise<void> {
    await this.page.evaluate(() => {
      const record: Array<{ name: string, property: string }> = [];

      (window as never as { htTabTransitions: typeof record }).htTabTransitions = record;
      document.querySelector('.ht-sheets-bar__tabs')!.addEventListener('transitionrun', (event) => {
        const tab = (event.target as Element).closest('.ht-sheets-bar__tab');

        if (tab !== null) {
          record.push({
            name: tab.querySelector('.ht-sheets-bar__tab-label')?.textContent ?? '',
            property: (event as TransitionEvent).propertyName,
          });
        }
      });
    });
  }

  /**
   * The tab transitions `recordTabTransitions()` saw start, optionally only those of one
   * property.
   */
  async tabTransitions(property?: string): Promise<Array<{ name: string, property: string }>> {
    const record: Array<{ name: string, property: string }> = await this.page.evaluate(
      () => (window as never as { htTabTransitions: Array<{ name: string, property: string }> }).htTabTransitions,
    );

    return property === undefined ? record : record.filter(entry => entry.property === property);
  }

  /**
   * A sheet tab's computed text and background colors, the duration its `transition` gives each
   * of them, in milliseconds (`0` when the list does not name it), and the number of transitions
   * of each it runs now.
   */
  async tabColorMotion(name: string): Promise<{
    color: string,
    background: string,
    colorDurationMs: number,
    backgroundDurationMs: number,
    runningColor: number,
    runningBackground: number,
  }> {
    return this.page.evaluate((sheetName) => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(tab instanceof HTMLElement)) {
        throw new Error(`No tab for ${sheetName}`);
      }

      const style = getComputedStyle(tab);
      const properties = style.transitionProperty.split(',').map(value => value.trim());
      const durations = style.transitionDuration.split(',').map(value => value.trim());
      const durationOf = (target: string) => {
        const index = properties.findIndex(property => property === target || property === 'all');
        const duration = index === -1 ? '0s' : durations[index % durations.length];
        const seconds = duration.endsWith('ms') ? parseFloat(duration) / 1000 : parseFloat(duration);

        return Math.round(seconds * 1000);
      };
      const runningOf = (target: string) => tab.getAnimations()
        .filter(animation => animation instanceof CSSTransition && animation.transitionProperty === target)
        .length;

      return {
        color: style.color,
        background: style.backgroundColor,
        colorDurationMs: durationOf('color'),
        backgroundDurationMs: durationOf('background-color'),
        runningColor: runningOf('color'),
        runningBackground: runningOf('background-color'),
      };
    }, name);
  }

  /**
   * The tab names in strip order.
   */
  async tabNames(): Promise<string[]> {
    return this.page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab .ht-sheets-bar__tab-label'),
    ).map(label => label.textContent ?? ''));
  }

  /**
   * A tab's viewport box.
   */
  async tabBox(index: number): Promise<{ left: number, width: number }> {
    const box = await this.tab(index).boundingBox();

    if (box === null) {
      throw new Error(`Tab ${index} is not rendered`);
    }

    return { left: box.x, width: box.width };
  }
}
