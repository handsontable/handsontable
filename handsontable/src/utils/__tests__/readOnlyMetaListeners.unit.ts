import Handsontable from 'handsontable/base';
import { Hooks } from 'handsontable/core/hooks';
import { hasOnlyReadOnlyMetaListeners, markReadOnlyMetaListener } from 'handsontable/utils/readOnlyMetaListeners';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

// A hook of the test's own, so it owns every listener on it.
const HOOK = 'readOnlyMetaListenersTestHook';

Hooks.getSingleton().register(HOOK);

describe('readOnlyMetaListeners', () => {
  let hot: Handsontable;

  beforeEach(() => {
    hot = new Handsontable(document.createElement('div'), { licenseKey: TEST_LICENSE_KEY });
  });

  afterEach(() => {
    hot.destroy();
  });

  it('should answer `true` for a hook without listeners', () => {
    expect(hasOnlyReadOnlyMetaListeners(hot, HOOK)).toBe(true);
  });

  it('should answer `true` when every listener, local and global, is marked', () => {
    const local = markReadOnlyMetaListener(() => {});
    const global = markReadOnlyMetaListener(() => {});

    hot.addHook(HOOK, local);
    Hooks.getSingleton().add(HOOK, global);

    try {
      expect(hasOnlyReadOnlyMetaListeners(hot, HOOK)).toBe(true);
    } finally {
      Hooks.getSingleton().remove(HOOK, global);
    }
  });

  it('should answer `false` when an instance listener is not marked', () => {
    hot.addHook(HOOK, markReadOnlyMetaListener(() => {}));
    hot.addHook(HOOK, () => {});

    expect(hasOnlyReadOnlyMetaListeners(hot, HOOK)).toBe(false);
  });

  it('should answer `false` when a global listener is not marked', () => {
    const global = () => {};

    Hooks.getSingleton().add(HOOK, global);

    try {
      expect(hasOnlyReadOnlyMetaListeners(hot, HOOK)).toBe(false);
    } finally {
      Hooks.getSingleton().remove(HOOK, global);
    }
  });

  it('should return the listener it marks', () => {
    const listener = () => {};

    expect(markReadOnlyMetaListener(listener)).toBe(listener);
  });
});
