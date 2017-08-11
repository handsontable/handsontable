/**
 * Authors: Wojciech Szymański
 * Last updated: 11.08.2017
 *
 * Description: Definition file for English language.
 */

import {registerDefinition} from '../localeRegisterer';
import {PLUGINS, CONTEXT_MENU, FILTERS, FILTERS_CONDITIONS, FILTERS_LABELS, FILTER_BUTTONS} from '../namespaces';

export const LANGUAGE_CODE = 'en';

export const phraseDefinitions = {
  [PLUGINS]: {
    [CONTEXT_MENU]: {
      ALIGN: 'Alignment',
      ROW_ABOVE: 'Insert row above'
    },
    [FILTERS]: {
      [FILTERS_CONDITIONS]: {
        NONE: 'None',
        EMPTY: 'IS_EMPTY'
      },
      [FILTERS_LABELS]: {
        FILTER_BY_CONDITION: 'Filter by condition:',
        FILTER_BY_VALUE: 'Filter by value:'
      },
      [FILTER_BUTTONS]: {
        OK: 'OK',
        CANCEL: 'Cancel'
      }
    }
  }
};

registerDefinition(LANGUAGE_CODE, phraseDefinitions);
