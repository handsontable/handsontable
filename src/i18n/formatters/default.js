import {register as registerFormatter} from '../formattersController';

function defaultFormatter(phrases) {
  if (Array.isArray(phrases)) {
    // Just return first option
    return phrases[0];
  }

  return phrases;
}

registerFormatter(defaultFormatter);
