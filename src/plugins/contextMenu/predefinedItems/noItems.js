import * as C from './../../../i18n/constants';

export const KEY = 'no-items';

export default function noItemsItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_NO_OPTIONS);
    },
    disabled: true,
    isCommand: false,
  };
}
