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

describe('HookSettingKey', () => {
  const settingKeys = declaredGridSettingKeys();
  const hooks = new Set<string>(REGISTERED_HOOKS);

  it('should cover every registered hook that GridSettings declares', () => {
    const missed = settingKeys.filter(key => hooks.has(key) && !isHookSettingKey(key));

    expect(missed).toEqual([]);
  });

  it('should not cover a GridSettings option that is not a registered hook', () => {
    // `afterChangesObserved` is typed as a hook callback but is not registered with the hook bus.
    const wrong = settingKeys.filter(key => !hooks.has(key) && isHookSettingKey(key));

    expect(wrong).toEqual(['afterChangesObserved']);
  });
});
