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

      it('should pass focusSource to the scope `onActivate` callback when `activateScope` is called with a second argument', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
        });

        let receivedFocusSource;

        createUIWithFocusScope('before', {
          id: 'top',
          shortcutsContextName: 'myPlugin',
          onActivate(focusSource) {
            receivedFocusSource = focusSource;
          },
        });

        getFocusScopeManager().activateScope('top', 'tab_from_above');

        expect(receivedFocusSource).toBe('tab_from_above');
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

  describe('shortcuts context fallback', () => {
    it('should throw when a scope falls back to its own shortcuts context', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      // `shortcutsContextName` defaults to 'grid', so declaring only the fallback names 'grid' twice.
      expect(() => {
        createUIWithFocusScope('before', {
          id: 'selfLoop',
          fallbackShortcutsContextName: 'grid',
        });
      }).toThrowError(/falls back to its own shortcuts context/);
    });

    it('should keep a shared context\'s fallback while another scope still declares it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const gridContext = getShortcutManager().getContext('grid');

      createUIWithFocusScope('before', {
        id: 'first',
        shortcutsContextName: 'plugin:shared',
        fallbackShortcutsContextName: 'grid',
      });
      createUIWithFocusScope('after', {
        id: 'second',
        shortcutsContextName: 'plugin:shared',
        fallbackShortcutsContextName: 'grid',
      });

      const sharedContext = getShortcutManager().getContext('plugin:shared');

      expect(sharedContext.getFallbackContext()).toBe(gridContext);

      // The fallback lives on the CONTEXT, which both scopes share, so removing one must not take it.
      getFocusScopeManager().unregisterScope('first');

      expect(sharedContext.getFallbackContext()).toBe(gridContext);

      getFocusScopeManager().unregisterScope('second');

      expect(sharedContext.getFallbackContext()).toBe(null);
    });

    it('should throw when scopes sharing a context declare different fallbacks', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      getShortcutManager().addContext('plugin:other');

      createUIWithFocusScope('before', {
        id: 'first',
        shortcutsContextName: 'plugin:shared',
        fallbackShortcutsContextName: 'grid',
      });

      // The fallback is a property of the CONTEXT, so the second registration would quietly replace
      // the first one's, and unregistering 'first' would then clear a fallback 'second' still needs.
      expect(() => {
        createUIWithFocusScope('after', {
          id: 'second',
          shortcutsContextName: 'plugin:shared',
          fallbackShortcutsContextName: 'plugin:other',
        });
      }).toThrowError(/declares a different `fallbackShortcutsContextName`/);

      // The refused scope leaves nothing behind - the first scope's fallback is untouched.
      expect(getShortcutManager().getContext('plugin:shared').getFallbackContext())
        .toBe(getShortcutManager().getContext('grid'));
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
      // Deactivating through the API rolls the shortcuts context back to what the scope displaced.
      // It used to stay on the scope's own name, which left the grid listening with every shortcut
      // dead until a later focus or click event happened to reach `processScopes()` (DEV-2917).
      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      getFocusScopeManager().deactivateScope('top');

      expect(isListening()).toBe(true);
      expect(onActivate).not.toHaveBeenCalled();
      expect(onDeactivate).toHaveBeenCalledTimes(1);
      expect(getShortcutManager().getActiveContextName()).toBe('grid');
    });

    it('should not roll back to its own context after focus left the scope and returned', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const container = createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPlugin',
      });
      const outsideInput = document.createElement('input');

      document.body.appendChild(outsideInput);

      await listen();

      container.querySelector('.text-input').focus();

      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      // A focus event moving the user away deliberately leaves the context alone. A scope may stand
      // aside while the user is still working inside it - `sheetsBar` disables its own scope while its
      // menu is open - and rolling back there takes the keyboard from that menu.
      outsideInput.focus();

      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      container.querySelector('.text-input').focus();

      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      // The re-activation above read 'myPlugin' as the current context. Recording that as the context
      // it displaced would make this rollback a no-op and pin the plugin's context forever, which is
      // DEV-2917 again by another route - so a scope never records its own name.
      getFocusScopeManager().deactivateScope('top');

      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      outsideInput.remove();
    });

    it('should leave the inner scope owning the context when `onActivate` activates another', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      createUIWithFocusScope('after', {
        id: 'inner',
        shortcutsContextName: 'myInnerPlugin',
      });
      createUIWithFocusScope('before', {
        id: 'outer',
        shortcutsContextName: 'myOuterPlugin',
        onActivate: () => getFocusScopeManager().activateScope('inner'),
      });

      await listen();

      getFocusScopeManager().activateScope('outer');

      // The outer scope used to switch the context AFTER `activate()` returned, so it overwrote the
      // scope its own `onActivate` had just handed the keyboard to - the active scope and the active
      // context then disagreed, and the outer scope had recorded the inner one's name as "displaced".
      expect(getFocusScopeManager().getActiveScopeId()).toBe('inner');
      expect(getShortcutManager().getActiveContextName()).toBe('myInnerPlugin');

      getFocusScopeManager().deactivateScope('inner');

      expect(getShortcutManager().getActiveContextName()).toBe('grid');
    });

    it('should keep the context it first displaced across a focus-leave and a re-activation', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      getShortcutManager().addContext('myOtherPlugin');

      const container = createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPlugin',
      });
      const outsideInput = document.createElement('input');

      document.body.appendChild(outsideInput);

      await listen();
      getShortcutManager().setActiveContextName('myOtherPlugin');

      container.querySelector('.text-input').focus();

      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      // Focus leaves and comes back. The context stays on 'myPlugin' throughout, so the re-activation
      // reads the scope's own name - and must keep what it recorded the first time rather than
      // replacing it with the default.
      outsideInput.focus();
      container.querySelector('.text-input').focus();

      getFocusScopeManager().deactivateScope('top');

      expect(getShortcutManager().getActiveContextName()).toBe('myOtherPlugin');

      outsideInput.remove();
    });

    it('should restore the context when a scope is unregistered after focus left it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const container = createUIWithFocusScope('before', {
        id: 'top',
        shortcutsContextName: 'myPlugin',
      });
      const outsideInput = document.createElement('input');

      document.body.appendChild(outsideInput);

      await listen();

      container.querySelector('.text-input').focus();

      expect(getShortcutManager().getActiveContextName()).toBe('myPlugin');

      // The focus event drops the scope but keeps the context, so by the time the plugin is disabled
      // this scope is no longer the active one. Unregistering must still hand the keyboard back, or the
      // manager is left on a context whose shortcuts and fallback are both gone with it.
      outsideInput.focus();
      getFocusScopeManager().unregisterScope('top');

      expect(getShortcutManager().getActiveContextName()).toBe('grid');

      outsideInput.remove();
    });

    it('should not take a shared context from another scope that holds the keyboard', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const first = createUIWithFocusScope('before', {
        id: 'first',
        shortcutsContextName: 'plugin:shared',
      });
      const second = createUIWithFocusScope('after', {
        id: 'second',
        shortcutsContextName: 'plugin:shared',
      });
      const outsideInput = document.createElement('input');

      document.body.appendChild(outsideInput);

      await listen();

      first.querySelector('.text-input').focus();

      expect(getFocusScopeManager().getActiveScopeId()).toBe('first');

      // Focus leaves: 'first' is dropped but keeps the name it displaced. Then 'second', which shares
      // the context, takes the keyboard.
      outsideInput.focus();
      second.querySelector('.text-input').focus();

      expect(getFocusScopeManager().getActiveScopeId()).toBe('second');
      expect(getShortcutManager().getActiveContextName()).toBe('plugin:shared');

      // Tearing 'first' down must leave the context with 'second'. Comparing context names alone reads
      // 'plugin:shared' as proof that 'first' still owns it.
      getFocusScopeManager().unregisterScope('first');

      expect(getFocusScopeManager().getActiveScopeId()).toBe('second');
      expect(getShortcutManager().getActiveContextName()).toBe('plugin:shared');

      outsideInput.remove();
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
