import { test, expect } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { columnsCount } from '../../src/page-helpers';

test('Test column moving', async({ tablePage }) => {
  expect(await columnsCount()).toBe(9);

  await tablePage.getByRole('columnheader', { name: 'Company name' }).click();
  await tablePage
    .getByRole('columnheader', { name: 'Company name' })
    .locator('div')
    .hover({ position: { x: 50, y: 0 } });
  await tablePage.mouse.down();
  await tablePage.getByRole('columnheader', { name: 'Rating' }).hover({ position: { x: 50, y: 0 } });
  await tablePage.mouse.up();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
