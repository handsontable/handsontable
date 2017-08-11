/**
 * Authors: Wojciech Szymański
 * Last updated: 11.08.2017
 *
 * Description: Definition file for Polish language.
 */

import {registerDefinition} from '../localeRegisterer';
import {PLUGINS, CONTEXT_MENU, FILTERS, FILTERS_CONDITIONS, FILTERS_LABELS, FILTER_BUTTONS} from '../namespaces';

export const LANGUAGE_CODE = 'pl';

export const phraseDefinitions = {
  [PLUGINS]: {
    [CONTEXT_MENU]: {
      ALIGN: 'Wyśrodkuj',
      ROW_ABOVE: 'Umieść wiersz poniżej'
    },
    [FILTERS]: {
      [FILTERS_CONDITIONS]: {
        NONE: 'Brak',
        EMPTY: 'Jest pusty'
      },
      [FILTERS_LABELS]: {
        FILTER_BY_CONDITION: 'Filtruj na podstawie warunku:',
        FILTER_BY_VALUE: 'Filtruj na podstawie wartości:'
      },
      [FILTER_BUTTONS]: {
        OK: 'OK',
        CANCEL: 'Anuluj'
      }
    }
  }
};

registerDefinition(LANGUAGE_CODE, phraseDefinitions);
