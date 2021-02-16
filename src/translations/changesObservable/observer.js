import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

class ChangesObserver {
  #mapsToExclude = [];

  constructor({ mapsToExclude }) {
    this.#mapsToExclude = mapsToExclude;
  }

  write(changes) {
    this.runLocalHooks('change', changes);
  }

  destroy() {
    this.runLocalHooks('destroy');

    this.#mapsToExclude = null;
    this.clearLocalHooks();
  }
}

mixin(ChangesObserver, localHooks);

export default ChangesObserver;
