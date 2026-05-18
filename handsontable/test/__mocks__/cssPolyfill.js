/**
 * CSS Polyfill for jsdom to support modern CSS features.
 * This polyfill patches jsdom's CSS parsing to handle:
 * - light-dark() function.
 * - CSS custom properties in computed styles.
 * - Other modern CSS features that jsdom doesn't support.
 */

// Memoize preprocessModernCSS — the same rule/string always produces the same output.
// Avoids re-running 4 regexes on the same 133 KB handsontableStyles string 644×
// (once per insertRule call when jsdom parses the style element).
const preprocessCache = new Map();

/**
 * Patches CSSStyleSheet.prototype.insertRule to handle modern CSS features.
 */
function patchCSSStyleSheet() {
  if (typeof window === 'undefined' || !window.CSSStyleSheet) {
    return;
  }

  const originalInsertRule = CSSStyleSheet.prototype.insertRule;
  const originalAddRule = CSSStyleSheet.prototype.addRule;

  // Patch insertRule to handle modern CSS.
  CSSStyleSheet.prototype.insertRule = function(rule, index) {
    try {
      // Pre-process modern CSS features before parsing.
      const processedRule = preprocessModernCSS(rule);

      return originalInsertRule.call(this, processedRule, index);
    } catch (e) {
      // If parsing fails, try to handle it gracefully.
      if (e.message && e.message.includes('parse')) {
        // For modern CSS features that jsdom can't parse, we'll skip the error
        // and return a dummy index to prevent test failures.
        return index !== undefined ? index : this.cssRules.length;
      }

      throw e;
    }
  };

  // Patch addRule similarly.
  if (originalAddRule) {
    CSSStyleSheet.prototype.addRule = function(selector, style, index) {
      try {
        const processedStyle = preprocessModernCSS(style || '');

        return originalAddRule.call(this, selector, processedStyle, index);
      } catch (e) {
        if (e.message && e.message.includes('parse')) {
          return -1; // Return -1 on failure (browser behavior).
        }

        throw e;
      }
    };
  }

  // Patch CSSStyleDeclaration to better handle CSS custom properties.
  patchCSSStyleDeclaration();

  // Patch HTMLStyleElement.textContent setter to preprocess CSS before setting.
  patchHTMLStyleElement();
}

/**
 * Pre-processes modern CSS features that jsdom can't parse.
 * Currently handles:
 * - light-dark() function.
 * - :where() pseudo-class (replace with regular selector).
 * - color-scheme: light dark (simplify to just light).
 *
 * @param {string} cssText The CSS text to preprocess.
 * @returns {string} The preprocessed CSS text.
 */
function preprocessModernCSS(cssText) {
  if (typeof cssText !== 'string') {
    return cssText;
  }

  const cached = preprocessCache.get(cssText);

  if (cached !== undefined) {
    return cached;
  }

  let processed = cssText;

  // Replace light-dark() with a fallback value that jsdom can parse.
  // light-dark(light-color, dark-color) -> use the light color as fallback.
  const lightDarkRegex = /light-dark\s*\(\s*([^,]+)\s*,\s*[^)]+\s*\)/g;

  processed = processed.replace(lightDarkRegex, (match, lightColor) => {
    // Extract the light color value and use it as fallback.
    return lightColor.trim();
  });

  // Replace :where() pseudo-class with regular selector (jsdom may have issues with :where)
  // :where(.class) -> .class
  const whereRegex = /:where\s*\(([^)]+)\)/g;

  processed = processed.replace(whereRegex, '$1');

  // Simplify color-scheme: light dark to just light (jsdom may not support multiple values)
  processed = processed.replace(/color-scheme:\s*light\s+dark;?/gi, 'color-scheme: light;');

  // Replace :has() pseudo-class with :not(*) so nwsapi (JSDOM's selector engine) doesn't throw.
  // nwsapi in JSDOM 16.x does not support :has(); it produces "invalid selector" SyntaxErrors.
  // :not(*) is a valid selector that matches nothing, so the rule stays valid but has no effect.
  processed = processed.replace(/:has\s*\([^)]+\)/g, ':not(*)');

  preprocessCache.set(cssText, processed);

  return processed;
}

/**
 * Patches HTMLStyleElement.textContent setter to preprocess CSS before it's set.
 * This prevents jsdom from throwing errors when parsing modern CSS features.
 */
function patchHTMLStyleElement() {
  if (typeof window === 'undefined' || !window.HTMLStyleElement) {
    return;
  }

  const styleElementProto = HTMLStyleElement.prototype;

  // Try to get the textContent descriptor from various prototype chains
  let textContentDescriptor = Object.getOwnPropertyDescriptor(styleElementProto, 'textContent');

  if (!textContentDescriptor) {
    textContentDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent') ||
                            Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'textContent') ||
                            Object.getOwnPropertyDescriptor(Element.prototype, 'textContent');
  }

  if (textContentDescriptor && textContentDescriptor.set) {
    const originalSetter = textContentDescriptor.set;

    // Override the setter to preprocess CSS
    try {
      Object.defineProperty(styleElementProto, 'textContent', {
        set(value) {
          if (typeof value === 'string') {
            // Preprocess modern CSS features before setting
            const processedValue = preprocessModernCSS(value);

            originalSetter.call(this, processedValue);
          } else {
            originalSetter.call(this, value);
          }
        },
        get: textContentDescriptor.get,
        configurable: true,
        enumerable: textContentDescriptor.enumerable
      });
    } catch (e) {
      // If we can't override textContent, try innerHTML as fallback
      const innerHTMLDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');

      if (innerHTMLDescriptor && innerHTMLDescriptor.set) {
        const originalInnerHTMLSetter = innerHTMLDescriptor.set;

        Object.defineProperty(styleElementProto, 'innerHTML', {
          set(value) {
            if (typeof value === 'string') {
              const processedValue = preprocessModernCSS(value);

              originalInnerHTMLSetter.call(this, processedValue);
            } else {
              originalInnerHTMLSetter.call(this, value);
            }
          },
          get: innerHTMLDescriptor.get,
          configurable: true,
          enumerable: innerHTMLDescriptor.enumerable
        });
      }
    }
  }
}

/** .
 * Returns a minimal CSSStyleDeclaration-like object when getComputedStyle throws
 * (e.g. Due to unsupported :has() selector in JSDOM). Provides getPropertyValue
 * and avoids crashes when reading computed styles.
 *
 * @param {Element} element The element (used for inline style fallback).
 * @returns {object} Object with getPropertyValue() returning '' or inline value.
 */
function getMinimalComputedStyle(element) {
  return {
    getPropertyValue(property) {
      if (element && element.style) {
        const inline = element.style.getPropertyValue(property);

        if (inline) {
          return inline;
        }
      }

      return '';
    }
  };
}

// Module-level so clearComputedStyleCache() can replace it between tests.
// WeakMap has no .clear() method — reassigning the reference is the only option.
let computedStyleCache = new WeakMap();

/**
 * Replaces the per-element computed style cache with a fresh WeakMap.
 * Call this in a beforeEach hook to prevent stale cached snapshots from leaking
 * between tests when an element's class list or inline styles change mid-test.
 */
function clearComputedStyleCache() {
  computedStyleCache = new WeakMap();
}

/**
 * Patches CSSStyleDeclaration to improve CSS custom property support.
 */
function patchCSSStyleDeclaration() {
  if (typeof window === 'undefined' || !window.CSSStyleDeclaration) {
    return;
  }

  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  const originalGetComputedStyle = window.getComputedStyle;

  // Cache for CSS custom property values resolved from :root.
  // CSS custom properties are defined on :root and don't change during a test run,
  // so we can safely cache them for the lifetime of the jsdom instance.
  const cssVarCache = new Map();

  // Enhance getPropertyValue to handle CSS custom properties.
  // Does NOT fall back to getComputedStyle — that path is both expensive and
  // recursive (the returned CSSStyleDeclaration has the same patched prototype).
  // The getComputedStyle proxy below handles the CSS variable lookup with caching.
  CSSStyleDeclaration.prototype.getPropertyValue = function(property) {
    const value = originalGetPropertyValue.call(this, property);

    if (!value && property.startsWith('--')) {
      // Try inline style first (cheap, no cascade evaluation).
      if (this._ownerElement && this._ownerElement.style) {
        const inlineValue = this._ownerElement.style.getPropertyValue(property);

        if (inlineValue) {
          return inlineValue;
        }
      }
    }

    return value;
  };

  /**
   * Returns a cached CSSStyleDeclaration for the element, calling jsdom's
   * getComputedStyle at most once per unique element.
   *
   * @param {Element} element The element to compute styles for.
   * @param {string|null} pseudoElement Optional pseudo-element string.
   * @returns {CSSStyleDeclaration} The computed style object.
   */
  function getCachedComputed(element, pseudoElement) {
    // Only cache non-pseudo-element lookups (pseudo-elements are rare and uncacheable).
    if (pseudoElement) {
      try {
        return originalGetComputedStyle.call(window, element, pseudoElement);
      } catch (e) {
        if (e instanceof SyntaxError || (e.message && /not a valid selector/i.test(e.message))) {
          return getMinimalComputedStyle(element);
        }
        throw e;
      }
    }

    if (computedStyleCache.has(element)) {
      return computedStyleCache.get(element);
    }

    let computed;

    try {
      computed = originalGetComputedStyle.call(window, element, pseudoElement);
    } catch (e) {
      // JSDOM's nwsapi throws SyntaxError on unsupported selectors (e.g. :has()).
      if (e instanceof SyntaxError || (e.message && /not a valid selector/i.test(e.message))) {
        computed = getMinimalComputedStyle(element);
      } else {
        throw e;
      }
    }

    computedStyleCache.set(element, computed);

    return computed;
  }

  // Enhance getComputedStyle to support CSS custom properties.
  // PERF: getCachedComputed() ensures jsdom's CSS cascade evaluation (~34ms) runs at
  // most once per unique element per test, instead of once per call (195× per HOT init).
  window.getComputedStyle = function(element, pseudoElement) {
    const computed = getCachedComputed(element, pseudoElement);

    // Create a proxy that resolves unresolved CSS custom properties.
    return new Proxy(computed, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function(property) {
            const value = target.getPropertyValue(property);

            if (!value && property.startsWith('--')) {
              // Check inline style (cheapest, no cascade).
              if (element.style) {
                const inlineValue = element.style.getPropertyValue(property);

                if (inlineValue) {
                  return inlineValue;
                }
              }

              // Check theme defaults (no DOM traversal).
              const defaultValue = getDefaultThemeCSSVar(element, property);

              if (defaultValue) {
                return defaultValue;
              }

              // CSS custom properties are defined on :root so the value is the
              // same regardless of which element triggered the lookup.
              if (cssVarCache.has(property)) {
                return cssVarCache.get(property);
              }

              // Resolve from :root — single call, no parent-chain walk.
              try {
                const rootComputed = originalGetComputedStyle.call(window, document.documentElement);
                const rootValue = originalGetPropertyValue.call(rootComputed, property);

                cssVarCache.set(property, rootValue || '');

                if (rootValue) {
                  return rootValue;
                }
              } catch (e) {
                cssVarCache.set(property, '');
              }
            }

            return value;
          };
        }

        return target[prop];
      }
    });
  };
}

/**
 * Patches console.error to suppress CSS parsing errors for modern features.
 */
function patchConsoleErrors() {
  if (typeof console === 'undefined') {
    return;
  }

  // eslint-disable-next-line no-console
  const originalError = console.error;

  // eslint-disable-next-line no-console
  console.error = function(...args) {
    // Convert all arguments to string for comprehensive checking
    const argsString = args.map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message || ''} ${arg.type || ''} ${arg.detail || ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        return `${arg.type || ''} ${arg.detail || ''} ${JSON.stringify(arg).substring(0, 200)}`;
      }

      return String(arg);
    }).join(' ');

    // Check if this is a CSS parsing error
    const hasCSSParsingError =
      argsString.includes('Could not parse CSS stylesheet') ||
      argsString.includes('css parsing') ||
      (argsString.includes('type') && argsString.includes('css parsing')) ||
      args.some((arg) => {
        // Direct check for Error objects
        if (arg instanceof Error) {
          if (arg.message && arg.message.includes('Could not parse CSS stylesheet')) {
            return true;
          }
          if (arg.type === 'css parsing' || arg.type === 'CSS parsing') {
            return true;
          }
          if (arg.detail && typeof arg.detail === 'string' &&
              (arg.detail.includes('--ht-') || arg.detail.includes('.ht-theme-'))) {
            return true;
          }
        }
        // Check for objects with type property
        if (arg && typeof arg === 'object' && !Array.isArray(arg) && arg !== null) {
          if (arg.type === 'css parsing' || arg.type === 'CSS parsing') {
            return true;
          }
          if (arg.detail && typeof arg.detail === 'string' &&
              (arg.detail.includes('--ht-') || arg.detail.includes('.ht-theme-'))) {
            return true;
          }
        }

        return false;
      });

    // Suppress jsdom CSS parsing errors for modern CSS features.
    if (hasCSSParsingError) {
      // Silently ignore - this is expected for modern CSS features in jsdom.
      return;
    }

    // Call original error handler.
    originalError.apply(console, args);
  };
}

/**
 * Default CSS custom properties for themes in test environment.
 * These will be populated from the actual theme CSS files.
 */
const DEFAULT_THEME_CSS_VARS = {
  // Fallback values if CSS file can't be read.
  '--ht-line-height': '20px',
  '--ht-cell-vertical-padding': '5px',
  '--ht-cell-horizontal-padding': '7px',
};

/**
 * Checks if an element or any of its ancestors has a theme class.
 *
 * @param {HTMLElement} element The element to check.
 * @returns {boolean} True if element or ancestor has a theme class.
 */
function hasThemeClass(element) {
  if (!element) {
    return false;
  }

  let current = element;

  while (current && current !== document.documentElement) {
    if (current.classList) {
      const hasTheme = Array.from(current.classList).some(cls =>
        cls.startsWith('ht-theme-')
      );

      if (hasTheme) {
        return true;
      }
    }

    current = current.parentElement;
  }

  return false;
}

/**
 * Gets a default CSS custom property value if element has a theme class.
 *
 * @param {HTMLElement} element The element to check.
 * @param {string} property The CSS custom property name.
 * @returns {string|undefined} The default value or undefined.
 */
function getDefaultThemeCSSVar(element, property) {
  if (hasThemeClass(element) && DEFAULT_THEME_CSS_VARS[property]) {
    return DEFAULT_THEME_CSS_VARS[property];
  }

  return undefined;
}

/**
 * Initialize all CSS polyfills.
 */
function initCSSPolyfill() {
  patchCSSStyleSheet();
  patchConsoleErrors();
}

module.exports = {
  patchCSSStyleSheet,
  patchConsoleErrors,
  initCSSPolyfill,
  clearComputedStyleCache
};
