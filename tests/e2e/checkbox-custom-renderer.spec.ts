import { test, expect } from '../fixtures/test';
import { CheckboxCustomRendererPage } from '../fixtures/pages/CheckboxCustomRendererPage';

/**
 * Regression for handsontable/dev-handsontable#342 (DEV-185): a checkbox column overwritten by a
 * custom renderer that chains the built-in checkbox renderer and then rebuilds the cell with
 * `td.innerHTML += ...`. The `innerHTML` assignment re-serializes and re-parses the cell, so the
 * checkbox's checked state only survives because the renderer now emits the reflected `checked`
 * attribute (not just the IDL property). Both cases go red on the unfixed renderer.
 */
test.describe('Checkbox column overwritten by a custom renderer', () => {
  test('renders a truthy cell as checked after the initial draw', async({ page, theme, bundle }) => {
    const grid = new CheckboxCustomRendererPage(page, theme, bundle);

    await grid.goto();

    // The custom renderer ran and appended its content, so this is a re-parsed checkbox.
    await expect(grid.cell(0, 0)).toContainText('( TEST )');
    await expect(grid.checkbox(0, 0)).toBeChecked();
    await expect(grid.checkbox(1, 0)).not.toBeChecked();
  });

  test('shows the box checked after clicking an unchecked cell', async({ page, theme, bundle }) => {
    const grid = new CheckboxCustomRendererPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.checkbox(1, 0)).not.toBeChecked();

    await grid.clickCheckbox(1, 0);

    // The click toggles the data, which triggers a re-render through the custom renderer.
    await expect.poll(() => grid.dataAt(1, 0)).toBe(true);

    // Before the fix the re-render dropped the checked state on every draw, so the box stayed
    // visually unchecked even though its data was true.
    await expect(grid.checkbox(1, 0)).toBeChecked();
  });
});
