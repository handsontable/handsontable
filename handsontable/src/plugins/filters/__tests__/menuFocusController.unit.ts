import { createMenuFocusController } from 'handsontable/plugins/filters/menu/focusController';

type SelectionHook = (selectedItem: Record<string, unknown> | null) => void;

/**
 * Builds the controller on a stand-in menu that only records its local hooks, and moves the focus
 * navigator to the second element, so a hook that clears the navigator (back to the first element)
 * is told apart from one that leaves it alone.
 *
 * @returns {object} The controller and the recorded `afterSelectionChange` hook.
 */
function setup() {
  const hooks: Record<string, (...args: unknown[]) => void> = {};
  const menu = {
    addLocalHook: (name: string, callback: (...args: unknown[]) => void) => {
      hooks[name] = callback;
    },
  };
  const elements = [{ focus: jest.fn() }, { focus: jest.fn() }];
  const controller = createMenuFocusController(menu as never, elements);

  controller.setCurrentPage(1);

  return { controller, afterSelectionChange: hooks.afterSelectionChange as SelectionHook };
}

describe('Filters menu focus controller', () => {
  describe('afterSelectionChange', () => {
    it('should clear the focus navigator when a menu item without the filter prefix is selected', () => {
      const { controller, afterSelectionChange } = setup();

      afterSelectionChange({ key: 'clear_column' });

      expect(controller.getCurrentPage()).toBe(0);
    });

    it('should keep the focus navigator when a filter component is selected', () => {
      const { controller, afterSelectionChange } = setup();

      afterSelectionChange({ key: 'filter_by_value' });

      expect(controller.getCurrentPage()).toBe(1);
    });

    it('should not throw and should clear the focus navigator when the item key is a number', () => {
      // A keyless entry of an array `items` list, such as a separator, gets its array index as the key.
      const { controller, afterSelectionChange } = setup();

      expect(() => afterSelectionChange({ key: 3 })).not.toThrow();
      expect(controller.getCurrentPage()).toBe(0);
    });

    it('should not throw and should clear the focus navigator when the item has no key', () => {
      const { controller, afterSelectionChange } = setup();

      expect(() => afterSelectionChange({})).not.toThrow();
      expect(controller.getCurrentPage()).toBe(0);
    });

    it('should not throw and should clear the focus navigator when no item is selected', () => {
      const { controller, afterSelectionChange } = setup();

      expect(() => afterSelectionChange(null)).not.toThrow();
      expect(controller.getCurrentPage()).toBe(0);
    });
  });
});
