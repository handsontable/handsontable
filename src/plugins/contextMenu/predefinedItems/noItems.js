import { CONTEXTMENU_ITEMS_NO_ITEMS } from './../../../i18n/constants';

export const KEY = 'no_items';

export default function noItemsItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_NO_ITEMS);
    },
    disabled: true,
    isCommand: false,
  };
}
