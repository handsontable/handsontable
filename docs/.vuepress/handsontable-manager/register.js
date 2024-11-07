/* global Handsontable, ReactDOM, ng */
/**
 * Returns a function that will destroy the demo resources.
 *
 * @param {string} presetType The demo preset name.
 * @param {object} resources The resources connected with a demo.
 * @param {HTMLElement} resources.rootExampleElement The root DOM element, container for the demo.
 * @param {Handsontable} resources.hotInstance The Handsontable instance.
 * @returns {Function}
 */
function createDestroyableResource(presetType, { rootExampleElement, hotInstance }) {
  return () => {
    const resource = {
      destroy: () => {
        if (presetType.startsWith('vue3')) {
          rootExampleElement.firstChild.__vue_app__.unmount();

        } else if (presetType.startsWith('vue')) {
          rootExampleElement.firstChild.__vue__.$root.$destroy();

        } else if (presetType.startsWith('react')) {
          ReactDOM.unmountComponentAtNode(rootExampleElement.firstChild);

        } else if (presetType.startsWith('angular')) {
          ng.core.getPlatform().destroy();

        } else if (!hotInstance.isDestroyed) {
          // Skip internal HoT-based components (e.g. context menu, dropdown menu). They
          // are managed by the HoT itself.
          hotInstance.destroy();
        }
      },
      hotInstance
    };

    return resource;
  };
}

/**
 * Creates registerer for demo instances.
 *
 * @returns {object} Returns an object with `listen` and `destroyAll` methods.
 */
function createRegister() {
  if (typeof window === 'undefined') {
    return;
  }

  const domMatches = Element.prototype.matches ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;

  /**
   * Polyfill (IE9+) for DOM.closest method (https://developer.mozilla.org/en-US/docs/Web/API/Element/closest).
   *
   * @param {Element} element The element the traversing begins from.
   * @param {string} selector The selector list.
   * @returns {Element|null}
   */
  function closest(element, selector) {
    let el = element;

    do {
      if (domMatches.call(el, selector)) {
        return el;
      }

      el = el.parentElement || el.parentNode;

    } while (el !== null && el.nodeType === Node.ELEMENT_NODE);

    return null;
  }

  const register = new Map();

  const listen = () => {
    try {
      if (typeof Handsontable !== 'undefined' && Handsontable._instanceRegisterInstalled === undefined) {
        Handsontable._instanceRegisterInstalled = true;
        Handsontable.hooks.add('afterInit', function() {
          const rootExampleElement = closest(this.rootElement, '[data-preset-type]');

          if (rootExampleElement) {
            const examplePresetType = rootExampleElement.getAttribute('data-preset-type');
            const exampleId = rootExampleElement.getAttribute('data-example-id');
            const currentEntry = register.get(exampleId);
            const currentHotInstance =
              typeof currentEntry === 'function' ?
                register.get(exampleId)()?.hotInstance :
                null;

            register.set(exampleId, createDestroyableResource(examplePresetType, {
              rootExampleElement,
              hotInstance: currentHotInstance || this,
            }));
          }
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('handsontableInstancesRegister initialization failed', e);
    }
  };

  const destroyAll = () => {
    register.forEach(instanceResource => instanceResource().destroy());
    register.clear();
  };

  const destroyExample = (exampleId) => {
    if (register.has(exampleId)) {
      register.get(exampleId)().destroy();
      register.delete(exampleId);
    }
  };

  const abortControllers = new Set();

  const initPage = () => {
    abortControllers.forEach(ctrl => ctrl.abort());
    abortControllers.add(new AbortController());

    destroyAll();
  };

  const switchExamplesTheme = () => {
    const version = localStorage.getItem('handsontable/docs::color-scheme');

    register.forEach((instanceResource) => {
      const instanceRes = instanceResource();
      const currentThemeName = instanceRes.hotInstance.getCurrentThemeName();

      // Remove the '-auto' suffix from the theme name.
      const newThemeName = currentThemeName.replace('-auto', '');
      const isCurrentlyDark = newThemeName.includes('dark');

      switch (version) {
        case 'dark':
          instanceRes.hotInstance.useTheme(isCurrentlyDark ? newThemeName : `${newThemeName}-dark`);
          break;
        case 'light':
          instanceRes.hotInstance.useTheme(isCurrentlyDark ? newThemeName.replace('-dark', '') : newThemeName);
          break;
        default:
      }

      instanceRes.hotInstance.render();
    });
  };

  const getAbortSignal = () => {
    const controllers = Array.from(abortControllers);

    return controllers[controllers.length - 1].signal;
  };

  return {
    initPage,
    listen,
    destroyAll,
    destroyExample,
    getAbortSignal,
    switchExamplesTheme,
  };
}

module.exports = {
  register: createRegister()
};
