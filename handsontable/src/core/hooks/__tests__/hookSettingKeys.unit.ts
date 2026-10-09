import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REGISTERED_HOOKS } from 'handsontable/core/hooks/constants';

/**
 * Mirrors the key rule behind `HookSettingKey` in `src/settings.ts`. When this test fails, a hook
 * was added (or a function option was named like one) and the rule there needs to follow.
 */
const isHookSettingKey = (key: string) =>
  /^(before|after|modify)/.test(key) ||
  ['construct', 'init', 'hasExternalDataSource', 'dialogFocusNextElement', 'dialogFocusPreviousElement']
    .includes(key);

const declaredGridSettingKeys = (): string[] => {
  const source = readFileSync(join(__dirname, '../../settings.ts'), 'utf8');
  const body = source.slice(source.indexOf('export interface GridSettings {'));
  const keys: string[] = [];

  body.slice(0, body.indexOf('\n}\n')).split('\n').forEach((line) => {
    const match = line.match(/^ {2}(\w+)\??: /);

    if (match) {
      keys.push(match[1]);
    }
  });

  return keys;
};

/**
 * Options that the rule treats as hooks although the hook bus does not register them. Each one is typed
 * as a hook callback in `GridSettings`, so `HotColumnProps` is right to leave it out. Add a name here
 * only after checking that it is a callback and not an option that merely holds a function.
 */
const UNREGISTERED_HOOK_CALLBACKS = ['afterChangesObserved'];

describe('HookSettingKey', () => {
  const settingKeys = declaredGridSettingKeys();
  const hooks = new Set<string>(REGISTERED_HOOKS);

  it('should read the GridSettings keys (guards against the key scan going quiet)', () => {
    expect(settingKeys.length).toBeGreaterThan(300);
    expect(settingKeys).toEqual(expect.arrayContaining(['afterChange', 'init', 'renderer', 'readOnly']));
  });

  it('should cover every registered hook that GridSettings declares', () => {
    const missed = settingKeys.filter(key => hooks.has(key) && !isHookSettingKey(key));

    // A name here is a hook that `OmitHooks` would leave on `HotColumnProps`: widen `HookSettingKey`
    // in `src/settings.ts` and `isHookSettingKey` above.
    expect(missed).toEqual([]);
  });

  it('should not cover a GridSettings option that is not a hook', () => {
    const wrong = settingKeys.filter(
      key => !hooks.has(key) && isHookSettingKey(key) && !UNREGISTERED_HOOK_CALLBACKS.includes(key)
    );

    // A name here is an option `OmitHooks` would wrongly drop from `HotColumnProps`: narrow
    // `HookSettingKey` in `src/settings.ts` and `isHookSettingKey` above, or add it to
    // UNREGISTERED_HOOK_CALLBACKS when it really is a hook callback.
    expect(wrong).toEqual([]);
  });
});
