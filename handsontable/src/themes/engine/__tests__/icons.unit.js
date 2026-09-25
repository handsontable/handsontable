import { createIcon, syncIcon } from '../icons';
import { createThemeManager } from '../manager';
import { createTheme } from '../builder';
import mainIcons from '../../static/variables/icons/main';
import mainColors from '../../static/variables/colors/main';
import mainTokens from '../../static/variables/tokens/main';

describe('createIcon / syncIcon', () => {
  it('falls back to a plain glyph element when the instance has no theme manager', () => {
    const el = createIcon({ rootDocument: document, themeManager: null }, 'menu', { flipInRtl: true });

    expect(el.className).toBe('ht-icon ht-icon-menu ht-icon--flip-rtl');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('delegates to the theme manager when present', () => {
    const themeManager = { createIcon: jest.fn(() => document.createElement('i')) };

    createIcon({ rootDocument: document, themeManager }, 'menu');

    expect(themeManager.createIcon).toHaveBeenCalledWith('menu', {});
  });

  it('syncIcon creates, keeps, swaps, and removes a slot icon', () => {
    const hot = { rootDocument: document, themeManager: null };
    const container = document.createElement('div');

    const first = syncIcon(hot, container, 'slot', 'arrowNarrowUp');

    expect(container.querySelector('.slot.ht-icon-arrow-narrow-up')).toBe(first);

    const same = syncIcon(hot, container, 'slot', 'arrowNarrowUp');

    expect(same).toBe(first);

    const swapped = syncIcon(hot, container, 'slot', 'arrowNarrowDown');

    expect(swapped).not.toBe(first);
    expect(container.querySelectorAll('.slot').length).toBe(1);
    expect(container.querySelector('.slot').className).toContain('ht-icon-arrow-narrow-down');

    expect(syncIcon(hot, container, 'slot', null)).toBeNull();
    expect(container.querySelector('.slot')).toBeNull();
  });

  describe('keep-path revision guard (DEV-3003)', () => {
    let guidCounter = 0;

    /**
     * A minimal theme config satisfying `ThemeBuilder`'s required keys, so `syncIcon()` can be
     * driven against a REAL `ThemeManager` - the exact collaborator it stamps and reads the
     * icons revision from - instead of a hand-rolled stand-in for the mechanism under test.
     * @param overrides
     */
    const createValidThemeConfig = (overrides = {}) => ({
      name: 'test-theme',
      icons: mainIcons,
      colors: mainColors,
      tokens: mainTokens,
      ...overrides,
    });

    const createMockHot = () => {
      guidCounter += 1;

      return {
        guid: `ht_mock_icons_${guidCounter}`,
        rootDocument: document,
        rootWrapperElement: document.createElement('div'),
        rootPortalElement: document.createElement('div'),
        stylesHandler: { clearCache: jest.fn() },
        render: jest.fn(),
        runHooks: jest.fn(),
      };
    };

    it('re-applies a class-list mapping to the SAME element after a runtime theme change ' +
      '(glyph -> class list)', () => {
      const theme = createTheme(createValidThemeConfig());
      const hot = createMockHot();

      hot.themeManager = createThemeManager({ hot, themeObject: theme });

      const container = document.createElement('div');
      const icon = syncIcon(hot, container, 'slot', 'arrowRight');

      // Baseline: `arrowRight` is unmapped in `mainIcons`, so the slot starts on the GLYPH path -
      // no `ht-icon--external` class.
      expect(icon.className).toBe('ht-icon ht-icon-arrow-right slot');

      // A runtime `icons` config change (a theme switch takes the same `#resolveIcons()` path).
      theme.params({ icons: { arrowRight: 'ti ti-chevron-right' } });

      const remapped = syncIcon(hot, container, 'slot', 'arrowRight');

      expect(remapped).toBe(icon);
      expect(remapped.className).toBe('ht-icon ht-icon-arrow-right slot ht-icon--external ti ti-chevron-right');
      expect(remapped.dataset.htIconsRevision).toBe(String(hot.themeManager.getIconsRevision()));
    });

    it('re-applies a renderer-callback mapping to the SAME element after a runtime theme ' +
      'change (glyph -> callback) - the other branch `applyIcon()` takes', () => {
      const theme = createTheme(createValidThemeConfig());
      const hot = createMockHot();

      hot.themeManager = createThemeManager({ hot, themeObject: theme });

      const container = document.createElement('div');
      const icon = syncIcon(hot, container, 'slot', 'check');

      expect(icon.className).toBe('ht-icon ht-icon-check slot');

      const renderer = jest.fn((element, name) => {
        element.textContent = name;
      });

      theme.params({ icons: { check: renderer } });

      const remapped = syncIcon(hot, container, 'slot', 'check');

      expect(remapped).toBe(icon);
      expect(renderer).toHaveBeenCalledWith(icon, 'check');
      expect(remapped.className).toBe('ht-icon ht-icon-check slot ht-icon--external');
      expect(remapped.textContent).toBe('check');
    });

    it('does NOT re-apply the mapping across repeated draws when the theme has not changed - ' +
      'the property the guard exists for', () => {
      const theme = createTheme(createValidThemeConfig({
        icons: { ...mainIcons, arrowRight: 'ti ti-chevron-right' },
      }));
      const hot = createMockHot();

      hot.themeManager = createThemeManager({ hot, themeObject: theme });

      const container = document.createElement('div');
      const icon = syncIcon(hot, container, 'slot', 'arrowRight');
      const stampedRevision = icon.dataset.htIconsRevision;
      const applySpy = jest.spyOn(hot.themeManager, 'applyIcon');

      // Simulate several header re-draws with no theme change in between - this runs on every
      // header draw in production, which is exactly why the guard exists.
      syncIcon(hot, container, 'slot', 'arrowRight');
      syncIcon(hot, container, 'slot', 'arrowRight');
      syncIcon(hot, container, 'slot', 'arrowRight');

      expect(applySpy).not.toHaveBeenCalled();
      expect(icon.dataset.htIconsRevision).toBe(stampedRevision);
      expect(icon.className).toBe('ht-icon ht-icon-arrow-right slot ht-icon--external ti ti-chevron-right');
    });

    it('does not get stuck on a stale mapping across two successive theme changes', () => {
      const theme = createTheme(createValidThemeConfig());
      const hot = createMockHot();

      hot.themeManager = createThemeManager({ hot, themeObject: theme });

      const container = document.createElement('div');
      const icon = syncIcon(hot, container, 'slot', 'arrowRight');

      expect(icon.className).toBe('ht-icon ht-icon-arrow-right slot');

      theme.params({ icons: { arrowRight: 'ti ti-chevron-right' } });

      const afterFirstChange = syncIcon(hot, container, 'slot', 'arrowRight');

      expect(afterFirstChange).toBe(icon);
      expect(afterFirstChange.className).toContain('ti ti-chevron-right');

      // A guard stuck comparing against the FIRST post-creation revision (rather than the
      // CURRENT one) would silently keep this mapping instead of picking up the second change.
      theme.params({ icons: { arrowRight: 'ti ti-x' } });

      const afterSecondChange = syncIcon(hot, container, 'slot', 'arrowRight');

      expect(afterSecondChange).toBe(icon);
      expect(afterSecondChange.className).toBe('ht-icon ht-icon-arrow-right slot ht-icon--external ti ti-x');
      expect(afterSecondChange.className).not.toContain('ti-chevron-right');
    });
  });
});
