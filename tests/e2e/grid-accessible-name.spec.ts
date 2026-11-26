import { test, expect } from '../fixtures/test';
import { GridAccessibleNamePage } from '../fixtures/pages/GridAccessibleNamePage';

/**
 * The `ariaLabel`, `ariaLabelledby`, and `ariaDescribedby` options name and describe the grid's
 * root element, which carries `role="treegrid"`. The grid writes only what an option sets, removes
 * only what it wrote, and writes nothing while `ariaTags` is off.
 */
test.describe('grid accessible name and description', () => {
  let grid: GridAccessibleNamePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridAccessibleNamePage(page, theme, bundle);
    await grid.goto();
  });

  test('names the grid with ariaLabel', async() => {
    await grid.build({ ariaLabel: 'Sales grid' });

    await expect(grid.treegridNamed('Sales grid')).toBeVisible();
    await expect(grid.root).toHaveAttribute('aria-label', 'Sales grid');
  });

  test('names the grid with the text of the elements ariaLabelledby points at', async() => {
    await grid.build({ ariaLabelledby: 'sales-title sales-region' });

    await expect(grid.treegridNamed('Quarterly sales North region')).toBeVisible();
    await expect(grid.root).toHaveAttribute('aria-labelledby', 'sales-title sales-region');
  });

  test('describes the grid with the text of the elements ariaDescribedby points at', async() => {
    await grid.build({ ariaLabel: 'Sales grid', ariaDescribedby: 'sales-help sales-note' });

    await expect(grid.root).toHaveAccessibleDescription('Amounts in US dollars. Press Enter to edit a cell.');
    await expect(grid.root).toHaveAttribute('aria-describedby', 'sales-help sales-note');
  });

  test('writes no name or description for a grid that sets none of the options', async() => {
    await grid.build();

    await expect(grid.root).toHaveAttribute('role', 'treegrid');
    await expect(grid.root).not.toHaveAttribute('aria-label');
    await expect(grid.root).not.toHaveAttribute('aria-labelledby');
    await expect(grid.root).not.toHaveAttribute('aria-describedby');
    await expect(grid.root).toHaveAccessibleName('');
  });

  test('follows a value changed through updateSettings', async() => {
    await grid.build({ ariaLabel: 'Sales grid', ariaDescribedby: 'sales-help' });

    await grid.updateSettings({ ariaLabel: 'Costs grid', ariaDescribedby: 'sales-note' });

    await expect(grid.treegridNamed('Costs grid')).toBeVisible();
    await expect(grid.root).toHaveAccessibleDescription('Press Enter to edit a cell.');

    await grid.updateSettings({ ariaLabelledby: 'sales-title' });

    await expect(grid.treegridNamed('Quarterly sales')).toBeVisible();
  });

  test('adds a name through updateSettings to a grid built without one', async() => {
    await grid.build();

    await grid.updateSettings({ ariaLabel: 'Sales grid' });

    await expect(grid.treegridNamed('Sales grid')).toBeVisible();
  });

  test('keeps the name when updateSettings names none of the options', async() => {
    await grid.build({ ariaLabel: 'Sales grid' });

    await grid.updateSettings({ rowHeaders: false });

    await expect(grid.root).toHaveAttribute('aria-label', 'Sales grid');
  });

  test('removes what it wrote when updateSettings passes an empty string, undefined, or null', async() => {
    await grid.build({
      ariaLabel: 'Sales grid',
      ariaLabelledby: 'sales-title',
      ariaDescribedby: 'sales-help',
    });

    await grid.updateSettings({ ariaLabel: '' });
    await expect(grid.root).not.toHaveAttribute('aria-label');
    await expect(grid.root).toHaveAttribute('aria-labelledby', 'sales-title');

    await grid.updateSettings({ ariaLabelledby: undefined });
    await expect(grid.root).not.toHaveAttribute('aria-labelledby');
    await expect(grid.root).toHaveAttribute('aria-describedby', 'sales-help');

    await grid.updateSettings({ ariaDescribedby: null });
    await expect(grid.root).not.toHaveAttribute('aria-describedby');
    await expect(grid.root).toHaveAccessibleName('');
  });

  test('leaves a name and description the app wrote itself while the options are unset', async() => {
    await grid.build({}, { 'aria-label': 'App container' });
    await grid.writeRootAttribute('aria-label', 'App grid');
    await grid.writeRootAttribute('aria-describedby', 'sales-help');

    await expect(grid.treegridNamed('App grid')).toBeVisible();
    await expect(grid.root).toHaveAccessibleDescription('Amounts in US dollars.');

    await grid.updateSettings({ ariaLabel: '', ariaDescribedby: undefined });

    await expect(grid.treegridNamed('App grid')).toBeVisible();
    await expect(grid.root).toHaveAccessibleDescription('Amounts in US dollars.');
    await expect(grid.grid).toHaveAttribute('aria-label', 'App container');
  });

  test('writes nothing while ariaTags is off', async() => {
    await grid.build({
      ariaTags: false,
      ariaLabel: 'Sales grid',
      ariaLabelledby: 'sales-title',
      ariaDescribedby: 'sales-help',
    });

    await expect(grid.root).not.toHaveAttribute('role');
    await expect(grid.root).not.toHaveAttribute('aria-label');
    await expect(grid.root).not.toHaveAttribute('aria-labelledby');
    await expect(grid.root).not.toHaveAttribute('aria-describedby');

    await grid.updateSettings({ ariaLabel: 'Costs grid' });

    await expect(grid.root).not.toHaveAttribute('aria-label');
  });
});
