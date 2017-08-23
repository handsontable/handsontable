import {registerGlobal as registerGlobalFormatter} from '../formattersController';

function defaultFormatter(phrases) {
  if (Array.isArray(phrases)) {
    // Just return first option
    return phrases[0];
  }

  return phrases;
}

registerGlobalFormatter(defaultFormatter);
