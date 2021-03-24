import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

class ChangesObserver {
  #mapNamesIgnoreList = [];

  constructor({ mapNamesIgnoreList }) {
    this.#mapNamesIgnoreList = mapNamesIgnoreList;
  }

  write(changesChunk) {
    const { changes, callerMapName } = changesChunk;

    if (!this.#mapNamesIgnoreList.includes(callerMapName)) {
      this.runLocalHooks('change', changes);
    }

    return this;
  }

  subscribe(callback) {
    this.addLocalHook('change', callback);

    return this;
  }

  unsubscribe() {
    this.runLocalHooks('unsubscribe');
    this.clearLocalHooks();

    return this;
  }
}

mixin(ChangesObserver, localHooks);

export default ChangesObserver;
