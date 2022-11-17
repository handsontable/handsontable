// @ts-check
const { test, expect } = require('@playwright/test');

test('remove content from cell, copy content from one cell to another', async({ page }, workerInfo) => {
  // below is based on Playwright's documentation: https://playwright.dev/docs/api/class-keyboard

  // on Windows and Linux
  // await page.keyboard.press('Control+A');
  // on macOS
  // await page.keyboard.press('Meta+A');

  const isMac = workerInfo.project.name === 'webkit';
  const modifier = isMac ? 'Meta' : 'Control';

  // open given URL
  await page.goto('https://handsontable.com/demo');

  // Expect a title
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  // find HOT element on page and wait for it
  const table = page.locator('#hot');

  await table.waitFor();

  // find .wtHolder and .wtSpreader element - it is needed to scroll the table
  const wtHolder = table.locator('> .ht_master.handsontable > .wtHolder');
  const wtSpreader = table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  const thead = table.locator('> .ht_clone_top.handsontable > .wtHolder > .wtHider .wtSpreader table thead');

  // scroll entire page down 200px from top
  // eslint-disable-next-line no-restricted-globals
  await page.evaluate(() => { window.scrollTo(0, 200); });

  // scroll HOT content 300px from top

  await wtHolder.evaluate((e) => { e.scrollTop = 300; });

  // help playwright scroll HOT content 300px from top

  await wtSpreader.evaluate((e) => { e.style.top = '300px'; });

  // scroll HOT content 10px from top
  await wtHolder.evaluate((e) => { e.scrollTop = 10; });

  // help playwright scroll HOT content 10px from top
  await wtSpreader.evaluate((e) => { e.style.top = '10px'; });

  let cell;

  // find and click cell 2B by left mouse button
  cell = table.locator('tbody > tr:nth-child(2) > td:nth-child(3)');
  await cell.click({ button: 'left' });

  // make screenshot
  await page.screenshot({ path: `snapshots/1-${workerInfo.project.name}.png` });

  // copy content of 2B cell to clipboard
  await page.keyboard.press(`${modifier}+c`);

  // remove content from 2B by adding empty space
  await cell.type(' ');

  // find and click cell 3B by left mouse button
  cell = table.locator('tbody > tr:nth-child(3) > td:nth-child(3)');
  // await cell.click({button: "left"});
  // let's try double click this time
  await cell.dblclick({ button: 'left' });

  // type something in cell 3B (add new string, not replace existing one)
  await cell.type('-test');

  // find and click cell 4B by left mouse button
  cell = table.locator('tbody > tr:nth-child(4) > td:nth-child(3)');
  await cell.click({ button: 'left' });

  // remove content from 4B
  await page.keyboard.press('Delete');

  // one more time find and click cell 3B by left mouse button
  cell = table.locator('tbody > tr:nth-child(3) > td:nth-child(3)');
  await cell.click({ button: 'left' });

  // let's make new screenshot
  await page.screenshot({ path: `snapshots/2-${workerInfo.project.name}.png` });

  // press and hold CTRL button (and its Mac equivalent stored in ${modifier} variable)
  await page.keyboard.down(`${modifier}`);

  // press V button and try to paste value from 2B
  await page.keyboard.press('v');

  // issue: without line below Firefox will scroll entire page up - check snapshot number 3
  // await page.evaluate(() => window.scrollTo(0, 200));

  // make one more screenshot
  await page.screenshot({ path: `snapshots/3-${workerInfo.project.name}.png` });

  // stop holding CTRL button (and its mac equivalent)
  await page.keyboard.up(`${modifier}`);

  // find button in column `name` and try to expand the menu
  const changeTypeButton = thead.locator('th:nth-child(4) button.changeType');

  await changeTypeButton.click({ button: 'left' });
  // await page.screenshot({ path: `snapshots/page-with-visible-dropdownMenu-${workerInfo.project.name}.png` });

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
  await page.evaluate(() => { document.body.style.transform = 'scale(2)'; });

  // make one more screenshot
  await page.screenshot({ path: `snapshots/page-after-zoom-${workerInfo.project.name}.png` });
});
