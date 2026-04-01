import Handsontable from 'handsontable/base';
import { registerPlugin, BasePlugin } from 'handsontable/plugins';
import { registerConflict } from '../conflictRegistry';

const OWNER_SETTING = 'hardConflictOwnerOnUpdateTest';
const BLOCKED_SETTING = 'hardConflictBlockedOnUpdateTest';

class ConflictOwnerOnUpdateTestPlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return OWNER_SETTING;
  }

  static get PLUGIN_PRIORITY() {
    return 960;
  }

  isEnabled() {
    return this.hot.getSettings()[OWNER_SETTING] === true;
  }
}

class ConflictBlockedOnUpdateTestPlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return BLOCKED_SETTING;
  }

  static get PLUGIN_PRIORITY() {
    return 961;
  }

  isEnabled() {
    return this.hot.getSettings()[BLOCKED_SETTING] === true;
  }

  enablePlugin() {
    if (this.isHardConflictBlocked()) {
      return;
    }

    super.enablePlugin();
  }

  disablePlugin() {
    super.disablePlugin();
  }
}

// Blocked plugin key first; second key is the incompatible top-level setting (truthy => conflict).
registerConflict(BLOCKED_SETTING, OWNER_SETTING);

registerPlugin(ConflictOwnerOnUpdateTestPlugin);
registerPlugin(ConflictBlockedOnUpdateTestPlugin);

describe('BasePlugin#onUpdateSettings hard conflict', () => {
  it('should disable an enabled blocked plugin when the owner activates without the blocked key in the payload', () => {
    const hot = new Handsontable(document.createElement('div'), {
      [BLOCKED_SETTING]: true,
    });
    const blocked = hot.getPlugin(BLOCKED_SETTING);

    expect(blocked.enabled).toBe(true);

    hot.updateSettings({
      [OWNER_SETTING]: true,
    });

    expect(blocked.enabled).toBe(false);

    hot.destroy();
  });
});
