// @ts-check
const { test, expect } = require('@playwright/test');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));

test('remove content from cell, copy content from one cell to another', async({ page }, workerInfo) => {
  // below is based on Playwright's documentation: https://playwright.dev/docs/api/class-keyboard

  // on Windows and Linux
  // await page.keyboard.press('Control+A');
  // on macOS
  // await page.keyboard.press('Meta+A');

  const isMac = workerInfo.project.name === 'webkit';
  const modifier = isMac ? 'Meta' : 'Control';
  let cell = {};
  let box;

  // open given URL
  await page.goto('https://handsontable.com/demo');

  // Expect a title
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  // find HOT element on page and wait for it
  const table = page.locator('#hot');

  await table.waitFor();

  // find .wtHolder and .wtSpreader element - it is needed to scroll the table
  // const wtHolder = table.locator('> .ht_master.handsontable > .wtHolder');
  const wtSpreader = await table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  const tbody = await wtSpreader.locator('table tbody');

  // We use `thead` from cloned table here - otherwise Playwright won't click the dropdownMenu expander,
  // cause original table is covered by layer with the cloned one and marked by Playwright as `hidden`.
  const thead = await table.locator('> .ht_clone_top.handsontable > .wtHolder > .wtHider .wtSpreader table thead');
  const pageScrollTop = 200;

  // scroll entire page down
  await page.mouse.wheel(0, pageScrollTop);

  // issue: probably cause of smooth scroll in Chromium screenshot is broken
  // we have to be sure if page has been scrolled indeed or find a way to turn of the smooth scroll
  // or just wait X seconds
  await page.waitForFunction(`window.scrollY >= ${pageScrollTop}`);
  // await sleep(1);
  await page.screenshot({ path: `snapshots/mousewheel-test-1-${workerInfo.project.name}.png` });

  // find table coordinates and dimensions
  box = await tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  // move mouse over the table
  // @ts-ignore
  await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));

  // scroll HOT content
  // value of this function is not expected position of page, but how many pixels should be moved
  // if we want to move up, we should use negative values
  await page.mouse.wheel(0, 270);
  // wait one second cause of smooth scroll
  await sleep(1);

  // take screenshot of scrolled table
  await page.screenshot({ path: `snapshots/mousewheel-test-2-${workerInfo.project.name}.png` });

  // value of this function is not expected position of page, but how many pixels should be moved
  // if we want to move up, we should use negative values
  await page.mouse.wheel(0, -270);
  await sleep(1);

  await page.screenshot({ path: `snapshots/mousewheel-test-3-${workerInfo.project.name}.png` });

  // find and click cell 2B by left mouse button
  cell = tbody.locator('> tr:nth-child(2) > td:nth-child(3)');
  // ` { button: 'left' }` is default and not mandatory
  // I added it here just to show, that we can define which button should be used - guys had asked me about this opportunity
  // await cell.click();
  await cell.click({ button: 'left' });

  // make screenshot
  // issue: firefox is scrolling page to keep clicked 2B element in center
  await page.screenshot({ path: `snapshots/select-cell-2B-${workerInfo.project.name}.png` });

  // copy content of 2B cell to clipboard
  await page.keyboard.press(`${modifier}+c`);

  // remove content from 2B by adding empty space
  await cell.type(' ');

  // find and click cell 3B by left mouse button
  cell = tbody.locator('> tr:nth-child(3) > td:nth-child(3)');
  // await cell.click();
  // let's try double click this time
  await cell.dblclick();

  // type something in cell 3B (add new string, not replace existing one)
  await cell.type('-test');

  // find and click cell 4B by left mouse button
  cell = tbody.locator('> tr:nth-child(4) > td:nth-child(3)');
  await cell.click();

  // remove content from 4B
  await page.keyboard.press('Delete');

  // one more time find and click cell 3B by left mouse button
  cell = tbody.locator('> tr:nth-child(3) > td:nth-child(3)');
  await cell.click();

  // let's make new screenshot
  await page.screenshot({ path: `snapshots/empty2B-and-4B-modified-3B-${workerInfo.project.name}.png` });

  // `down` means "press and hold until `up`".
  // press and hold CTRL button (and its Mac equivalent stored in ${modifier} variable)
  await page.keyboard.down(`${modifier}`);

  // `press` means just "press once and do not hold"
  // press V button and try to paste value from 2B
  await page.keyboard.press('v');

  // make one more screenshot
  await page.screenshot({ path: `snapshots/3B-modified-again-by-paste-${workerInfo.project.name}.png` });

  // stop holding CTRL button (and its mac equivalent)
  await page.keyboard.up(`${modifier}`);

  // find button in column `name` and try to expand the menu
  // note: we are looking for button in clone of table, not in the original one
  // button in original table is not visible for Playwright and marked as `hidden`
  const changeTypeButton = thead.locator('th:nth-child(4) button.changeType');

  // it is possible to force Playwright to click hidden elements by adding parameter { force: true }
  // await changeTypeButton.click({ button: 'left', force: true });
  await changeTypeButton.click({ button: 'left' });

  // find dropdown menu
  const dropdownMenu = page.locator('.htMenu.htDropdownMenu.handsontable');

  // take screenshot of page with open dropdown menu and dropdown menu only
  await page.screenshot({ path: `snapshots/page-with-dropdownmenu-${workerInfo.project.name}.png` });
  await dropdownMenu.screenshot({ path: `snapshots/dropdownmenu-${workerInfo.project.name}.png` });

  // find and click button "clear column" - by the text this time

  await dropdownMenu.locator('"Clear column"').click({ button: 'left' });

  // await dropdownMenuButton.screenshot({ path: `snapshots/dropdownmenuButton-${workerInfo.project.name}.png` });

  await page.screenshot({ path: `snapshots/table-with-empty-column-${workerInfo.project.name}.png` });

  // zoom entire page - we've tried CTRL+, but looks like it doesn't work, so we have to make the `transform(scale)` trick
  // eslint-disable-next-line no-restricted-globals
  // await page.evaluate(() => { document.body.style.transform = 'scale(2)'; });

  // make one more screenshot
  // await page.screenshot({ path: `snapshots/page-after-zoom-${workerInfo.project.name}.png` });

  // find cell 2A, hold down left mouse button and move mouse to make few cells selected
  cell = tbody.locator('> tr:nth-child(2) > td:nth-child(2)');
  box = await cell.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  // @ts-ignore
  await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
  await page.mouse.down();
  // @ts-ignore
  await page.mouse.move(box.x + (box.width / 2) + 100, box.y + (box.height / 2) + 100);
  await page.mouse.up();
  await page.screenshot({ path: `snapshots/selected-cells-${workerInfo.project.name}.png` });

  // select entire row 5
  cell = tbody.locator('> tr:nth-child(5) > th:nth-child(1)');

  // Without coordinates `click` works on the middle of element,
  // what means that in this case it will deselect checkbox.
  // We do not want it, so we should define coordinates out of checkbox - here it can be { 1, 1 }.
  // We have to use `{ force: true }` to force click,
  // cause button is marked by Playwright as `hidden` (it is covered by another layer)
  await cell.click({ position: { x: 1, y: 1 }, force: true });
  await page.screenshot({ path: `snapshots/selected-row-${workerInfo.project.name}.png` });

  // let's change the order of rows
  // move mouse to the given row, click first cell to select it and move up
  box = await cell.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };
  await page.mouse.move(box.x + 1, box.y + 1);
  await page.mouse.down();
  await page.mouse.move(box.x + 1, box.y - 50);
  await page.mouse.up();
  await page.screenshot({ path: `snapshots/changed-order-of-rows-${workerInfo.project.name}.png` });
});
