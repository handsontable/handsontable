import { createMenuNavigator } from './navigator';
import { SelectUI } from '../ui/select';

const SHORTCUTS_MENU_CONTEXT = 'filters';
const SHORTCUTS_CONTEXT = `menu:${SHORTCUTS_MENU_CONTEXT}`;

/**
 * Creates navigator controller for filter subcomponents in the menu.
 *
 * @param {Menu} menu The Menu instance.
 * @param {Map<string, object>} filterComponents The list of the subcomponents of the filters plugin to paginate to.
 * @returns {Paginator}
 */
export function createMenuNavigatorCtrl(menu, filterComponents) {
  const componentElements = Array.from(filterComponents)
    .map(([, component]) => component.getElements())
    .flat();
  const componentIds = Array.from(filterComponents)
    .map(([, component]) => component.id);
  const navigator = createMenuNavigator(componentElements);
  const updateNavigatorPosition = element => () => navigator.setCurrentPage(componentElements.indexOf(element));
  let lastSelectedMenuIndex;

  // update navigator position to element that was recently clicked or focused
  componentElements.forEach((element) => {
    element.addLocalHook('focus', updateNavigatorPosition(element));
    element.addLocalHook('click', updateNavigatorPosition(element));
    element.addLocalHook('afterClose', updateNavigatorPosition(element));
  });

  menu.addLocalHook('afterSelectionChange', (selectedItem) => {
    if (!componentIds.includes(selectedItem.key)) {
      navigator.clear();
    }
  });

  menu.addLocalHook('afterOpen', () => {
    menu.addShortcuts([{
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event) => {
        menu.getNavigator().clear();

        if (event.shiftKey) {
          navigator.toPreviousItem();
        } else {
          navigator.toNextItem();
        }
      },
    }, {
      keys: [['Enter'], ['Space']],
      preventDefault: false,
      callback: (event) => {
        const element = componentElements[navigator.getCurrentPage()];

        if (element instanceof SelectUI) {
          element.openOptions();
          event.preventDefault();
        }
      }
    }, {
      keys: [['Escape']],
      callback: () => {
        if (Number.isInteger(lastSelectedMenuIndex) && lastSelectedMenuIndex !== -1) {
          menu.getNavigator().setCurrentPage(lastSelectedMenuIndex);
        } else {
          menu.getNavigator().toFirstItem();
        }

        menu.focus();
      }
    }], SHORTCUTS_MENU_CONTEXT);

    menu.addShortcuts([{
      keys: [['Tab'], ['Shift', 'Tab']],
      forwardToContext: menu.getShortcutManager().getContext(SHORTCUTS_CONTEXT),
      callback: () => {
        lastSelectedMenuIndex = menu.getNavigator().getCurrentPage();
        menu.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT);
      },
    }]);
  });

  return navigator;
}
