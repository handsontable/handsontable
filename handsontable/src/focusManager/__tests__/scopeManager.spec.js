describe('ScopeManager', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    Array.from(document.querySelectorAll('.focus-scope-container'))
      .map(el => el.remove());

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function createUIWithFocusScope(place, scopeOptions) {
    const container = document.createElement('div');

    container.classList.add('focus-scope-container');
    container.innerHTML = `<input type="text" class="text-input" placeholder="${scopeOptions.id} focus scope"/>`;

    hot().rootGridElement[place](container);

    getFocusScopeManager().registerScope(scopeOptions.id, container, {
      ...scopeOptions,
    });

    return container;
  }

  describe('`registerScope` method', () => {
    it('should throw an error if the scope is already registered', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      createUIWithFocusScope('before', {
        id: 'top',
      });

      expect(() => {
        createUIWithFocusScope('before', {
          id: 'top',
        });
      }).toThrowError('Scope with id "top" already registered');
    });

    it('should install focus detectors', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const container = createUIWithFocusScope('before', {
        id: 'top',
      });

      expect(container.querySelector('.htFocusCatcher')).toBeDefined();
      expect(container.querySelector('.htFocusCatcher')).toBeDefined();
    });

    describe('`shortcutsContextName` option', () => {
      it('should use the default shortcuts context name if not provided', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
        });

        createUIWithFocusScope('before', {
          id: 'top',
        });

        expect(getShortcutManager().getActiveContextName()).toBe('grid');

        getFocusScopeManager().activateScope('top');

        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');
        expect(getShortcutManager().getActiveContextName()).toBe('grid');
      });

      it('should be possible to provide a custom shortcuts context name', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
        });

        createUIWithFocusScope('before', {
          id: 'top',
          shortcutsContextName: 'myPlugin',
        });

        expect(getShortcutManager().getContext('myPlugin')).toBeDefined();
        expect(getShortcutManager().getActiveContextName()).toBe('grid');

        getFocusScopeManager().activateScope('top');

        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');
        expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');
      });
    });

    describe('`type` option', () => {
      it('should create a scope with the `modal` type', async() => {
        const input = $('<input type="text" placeholder="external input"/>');

        spec().$container.after(input);

        handsontable({
          data: createSpreadsheetData(10, 10),
          tabNavigation: false,
        });

        const topContainer = createUIWithFocusScope('before', {
          id: 'top',
          shortcutsContextName: 'myPluginTop',
          type: 'modal',
          onActivate() {
            topContainer.querySelector('.text-input').focus();
          },
        });
        const top2Container = createUIWithFocusScope('before', {
          id: 'top2',
          shortcutsContextName: 'myPluginTop2',
          onActivate() {
            top2Container.querySelector('.text-input').focus();
          },
        });

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

        await keyDownUp('tab');

        expect(isListening()).toBe(false);
        expect(getFocusScopeManager().getActiveScopeId()).toBe(null);
        expect(document.activeElement).toBe(input[0]);

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

        input.remove();
      });
    });

    describe('`runOnlyIf` option', () => {
      it('should ignore the scope if the option returns false', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          tabNavigation: false,
        });

        const topContainer = createUIWithFocusScope('before', {
          id: 'top',
          shortcutsContextName: 'myPluginTop',
          onActivate() {
            topContainer.querySelector('.text-input').focus();
          },
        });
        const top2Container = createUIWithFocusScope('before', {
          id: 'top2',
          shortcutsContextName: 'myPluginTop2',
          onActivate() {
            top2Container.querySelector('.text-input').focus();
          },
          runOnlyIf: () => false,
        });

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

        await keyDownUp('tab');

        expect(isListening()).toBe(false);
        expect(getFocusScopeManager().getActiveScopeId()).toBe(null);

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('grid');

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(false);
        expect(getFocusScopeManager().getActiveScopeId()).toBe(null);

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');
      });
    });

    describe('`contains` option', () => {
      it('should be possible to provide a custom `contains` function', async() => {
        const customContainer = $(`
          <div id="custom-container">
            <input type="text" class="text-input" placeholder="custom container input"/>
          </div>
        `);

        spec().$container.after(customContainer);

        handsontable({
          data: createSpreadsheetData(10, 10),
          tabNavigation: false,
        });

        const topContainer = createUIWithFocusScope('before', {
          id: 'top',
          shortcutsContextName: 'myPluginTop',
          onActivate() {
            topContainer.querySelector('.text-input').focus();
          },
        });
        const top2Container = createUIWithFocusScope('before', {
          id: 'top2',
          shortcutsContextName: 'myPluginTop2',
          contains: (target) => {
            return top2Container.contains(target) || customContainer[0].contains(target);
          },
          onActivate() {
            if (top2Container.contains(document.activeElement)) {
              top2Container.querySelector('.text-input').focus();
            } else {
              customContainer[0].querySelector('.text-input').focus();
            }
          },
        });

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top2');

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('grid');

        await keyDownUp('tab');

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top2');

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('grid');

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top2');

        await keyDownUp(['shift', 'tab']);

        expect(isListening()).toBe(true);
        expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

        customContainer.remove();
      });
    });
  });

  describe('`unregisterScope` method', () => {
    it('should throw an error if the scope was not registered', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      expect(() => {
        getFocusScopeManager().unregisterScope('top');
      }).toThrowError('Scope with id "top" not found');
    });

    it('should be able to register the scope again', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      createUIWithFocusScope('before', {
        id: 'top',
      });

      getFocusScopeManager().unregisterScope('top');

      expect(() => {
        createUIWithFocusScope('before', {
          id: 'top',
        });
      }).not.toThrowError();
    });
  });

  describe('`activateScope` method', () => {
    it('should throw an error if the scope is not registered', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      expect(() => {
        getFocusScopeManager().activateScope('top');
      }).toThrowError('Scope with id "top" not found');
    });

    it('should activate the scope (activation changed by API calls)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const onActivate = jasmine.createSpy('onActivate');
      const onDeactivate = jasmine.createSpy('onDeactivate');

      createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPlugin',
        onActivate,
        onDeactivate,
      });

      getFocusScopeManager().activateScope('top');

      expect(isListening()).toBe(false);
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith('unknown');
      expect(onDeactivate).not.toHaveBeenCalled();
      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      getFocusScopeManager().activateScope('top');

      expect(isListening()).toBe(false);
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith('unknown');
      expect(onDeactivate).not.toHaveBeenCalled();
      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');
    });

    it('should activate the scope (activation changed by events)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        tabNavigation: false,
      });

      const onTopActivate = jasmine.createSpy('onTopActivate');
      const onBottomActivate = jasmine.createSpy('onBottomActivate');

      const topContainer = createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPluginTop',
        onActivate(...args) {
          topContainer.querySelector('.text-input').focus();
          onTopActivate(...args);
        },
      });
      const bottomContainer = createUIWithFocusScope('after', {
        id: 'bottom',
        shortcutsContextName: 'myPluginBottom',
        onActivate(...args) {
          bottomContainer.querySelector('.text-input').focus();
          onBottomActivate(...args);
        },
      });

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
      expect(onTopActivate).toHaveBeenCalledTimes(1);
      expect(onBottomActivate).toHaveBeenCalledTimes(0);
      expect(getShortcutManager().getActiveContextName()).toBe('myPluginTop');

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
      expect(onTopActivate).toHaveBeenCalledTimes(1);
      expect(onBottomActivate).toHaveBeenCalledTimes(0);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
      expect(onTopActivate).toHaveBeenCalledTimes(1);
      expect(onBottomActivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('myPluginBottom');

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(true);
      expect(onTopActivate).toHaveBeenCalledTimes(1);
      expect(onBottomActivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(true);
      expect(onTopActivate).toHaveBeenCalledTimes(2);
      expect(onBottomActivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('myPluginTop');
    });
  });

  describe('`deactivateScope` method', () => {
    it('should throw an error if the scope is not registered', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      expect(() => {
        getFocusScopeManager().deactivateScope('top');
      }).toThrowError('Scope with id "top" not found');
    });

    it('should deactivate the scope (deactivation changed by API calls)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const onActivate = jasmine.createSpy('onActivate');
      const onDeactivate = jasmine.createSpy('onDeactivate');

      createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPlugin',
        onActivate,
        onDeactivate,
      });

      await listen();

      getFocusScopeManager().activateScope('top');

      expect(isListening()).toBe(true);

      onActivate.calls.reset();
      onDeactivate.calls.reset();

      getFocusScopeManager().deactivateScope('top');

      expect(isListening()).toBe(true);
      expect(onActivate).not.toHaveBeenCalled();
      expect(onDeactivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      getFocusScopeManager().deactivateScope('top');

      expect(isListening()).toBe(true);
      expect(onActivate).not.toHaveBeenCalled();
      expect(onDeactivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');
    });

    it('should deactivate the scope (deactivation changed by events)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        tabNavigation: false,
      });

      const onTopDeactivate = jasmine.createSpy('onTopDeactivate');
      const onBottomDeactivate = jasmine.createSpy('onBottomDeactivate');

      const topContainer = createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPluginTop',
        onActivate() {
          topContainer.querySelector('.text-input').focus();
        },
        onDeactivate: onTopDeactivate,
      });
      const bottomContainer = createUIWithFocusScope('after', {
        id: 'bottom',
        shortcutsContextName: 'myPluginBottom',
        onActivate() {
          bottomContainer.querySelector('.text-input').focus();
        },
        onDeactivate: onBottomDeactivate,
      });

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
      expect(onTopDeactivate).toHaveBeenCalledTimes(0);
      expect(onBottomDeactivate).toHaveBeenCalledTimes(0);
      expect(getShortcutManager().getActiveContextName()).toBe('myPluginTop');

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
      expect(onTopDeactivate).toHaveBeenCalledTimes(1);
      expect(onBottomDeactivate).toHaveBeenCalledTimes(0);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
      expect(onTopDeactivate).toHaveBeenCalledTimes(1);
      expect(onBottomDeactivate).toHaveBeenCalledTimes(0);
      expect(getShortcutManager().getActiveContextName()).toBe('myPluginBottom');

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(true);
      expect(onTopDeactivate).toHaveBeenCalledTimes(1);
      expect(onBottomDeactivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(true);
      expect(onTopDeactivate).toHaveBeenCalledTimes(1);
      expect(onBottomDeactivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('myPluginTop');
    });
  });

  describe('`getActiveScopeId` method', () => {
    it('should return the ID of the active scope (scopes changed by API calls)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const onActivate = jasmine.createSpy('onActivate');
      const onDeactivate = jasmine.createSpy('onDeactivate');

      createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPlugin',
        onActivate,
        onDeactivate,
      });

      expect(getFocusScopeManager().getActiveScopeId()).toBe(null);

      getFocusScopeManager().activateScope('top');

      expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

      getFocusScopeManager().deactivateScope('top');

      expect(getFocusScopeManager().getActiveScopeId()).toBe(null);
    });

    it('should return the ID of the active scope (scopes changed by events)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        tabNavigation: false,
      });

      const topContainer = createUIWithFocusScope('before', {
        id: 'top',
        onActivate() {
          topContainer.querySelector('.text-input').focus();
        },
      });
      const middleContainer = createUIWithFocusScope('before', {
        id: 'middle',
        onActivate() {
          middleContainer.querySelector('.text-input').focus();
        },
      });
      const bottomContainer = createUIWithFocusScope('after', {
        id: 'bottom',
        onActivate() {
          bottomContainer.querySelector('.text-input').focus();
        },
      });

      await keyDownUp('tab');

      expect(getFocusScopeManager().getActiveScopeId()).toBe('top');

      await keyDownUp('tab');

      expect(getFocusScopeManager().getActiveScopeId()).toBe('middle');

      await keyDownUp('tab');

      expect(getFocusScopeManager().getActiveScopeId()).toBe('grid');

      await keyDownUp('tab');

      expect(getFocusScopeManager().getActiveScopeId()).toBe('bottom');

      await keyDownUp(['shift', 'tab']);

      expect(getFocusScopeManager().getActiveScopeId()).toBe('grid');

      await keyDownUp(['shift', 'tab']);

      expect(getFocusScopeManager().getActiveScopeId()).toBe('middle');

      await keyDownUp(['shift', 'tab']);

      expect(getFocusScopeManager().getActiveScopeId()).toBe('top');
    });
  });
});
