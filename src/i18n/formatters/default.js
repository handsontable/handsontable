import {registerGlobal} from '../formattersController';

registerGlobal((phrases) => {
  if (Array.isArray(phrases)) {
    // Just return first option
    return phrases[0];
  }

  return phrases;
});
