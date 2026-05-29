import { CONTEXTMENU_ITEMS_NO_ITEMS } from '../../../i18n/constants';

export const KEY = 'no_items';

/**
 * @returns {object}
 */
export default function noItemsItem() {
  return {
    key: KEY,
    name(): string {
      const phrase: string = this.getTranslatedPhrase(CONTEXTMENU_ITEMS_NO_ITEMS);

      return phrase;
    },
    disabled: true,
    isCommand: false,
  };
}
