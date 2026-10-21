import { resolveAutoLinkSettings, resolveAutoLinkSettingsCached } from '../resolveSettings';
import type { ResolvedAutoLinkSettings } from '../resolveSettings';
import type { AutoLinkSettings } from '../autoLink';

const BASE: ResolvedAutoLinkSettings = {
  target: '_blank',
  schemes: ['http', 'https', 'mailto', 'tel'],
  inline: true,
  strict: true,
  classNames: [],
};

describe('resolveAutoLinkSettings', () => {
  it('should fall back to the base schemes when every override entry is unknown to the allowlist', () => {
    const override = { schemes: ['ftp', 'ssh'] } as unknown as AutoLinkSettings;

    expect(resolveAutoLinkSettings(BASE, override).schemes).toEqual(BASE.schemes);
  });

  it('should keep an explicit empty schemes array empty, rather than falling back', () => {
    const override: AutoLinkSettings = { schemes: [] };

    expect(resolveAutoLinkSettings(BASE, override).schemes).toEqual([]);
  });

  it('should narrow to a valid subset of schemes', () => {
    const override: AutoLinkSettings = { schemes: ['https'] };

    expect(resolveAutoLinkSettings(BASE, override).schemes).toEqual(['https']);
  });

  it('should keep the base schemes when the override does not mention schemes', () => {
    expect(resolveAutoLinkSettings(BASE, {}).schemes).toEqual(BASE.schemes);
  });

  it('should narrow to the known entries when an override mixes known and unknown schemes', () => {
    const override = { schemes: ['https', 'ftp'] } as unknown as AutoLinkSettings;

    expect(resolveAutoLinkSettings(BASE, override).schemes).toEqual(['https']);
  });

  it('should override target, inline and className only when valid', () => {
    const override: AutoLinkSettings = { target: '_self', inline: false, className: 'company-link' };
    const resolved = resolveAutoLinkSettings(BASE, override);

    expect(resolved.target).toBe('_self');
    expect(resolved.inline).toBe(false);
    expect(resolved.classNames).toEqual(['company-link']);
  });

  it('should keep the base target, inline and className when the override values are invalid', () => {
    const override = { target: 'nope', inline: 'nope', className: 42 } as unknown as AutoLinkSettings;
    const resolved = resolveAutoLinkSettings(BASE, override);

    expect(resolved.target).toBe(BASE.target);
    expect(resolved.inline).toBe(BASE.inline);
    expect(resolved.classNames).toEqual(BASE.classNames);
  });

  it('should accept a boolean `strict` override', () => {
    expect(resolveAutoLinkSettings(BASE, { strict: false }).strict).toBe(false);
    expect(resolveAutoLinkSettings({ ...BASE, strict: false }, { strict: true }).strict).toBe(true);
  });

  it('should ignore a non-boolean `strict` override and keep the base value', () => {
    const override = { strict: 'nope' } as unknown as AutoLinkSettings;

    expect(resolveAutoLinkSettings(BASE, override).strict).toBe(BASE.strict);
  });

  it('should keep the base `strict` when the override does not mention it', () => {
    expect(resolveAutoLinkSettings(BASE, {}).strict).toBe(BASE.strict);
  });
});

describe('resolveAutoLinkSettingsCached', () => {
  it('should return the identical result object when resolving the same override object twice', () => {
    const cache = new WeakMap<object, ResolvedAutoLinkSettings>();
    const override: AutoLinkSettings = { target: '_self' };

    const first = resolveAutoLinkSettingsCached(cache, BASE, override);
    const second = resolveAutoLinkSettingsCached(cache, BASE, override);

    expect(second).toBe(first);
  });

  it('should resolve two different override objects independently, even with identical contents', () => {
    const cache = new WeakMap<object, ResolvedAutoLinkSettings>();
    const overrideA: AutoLinkSettings = { target: '_self' };
    const overrideB: AutoLinkSettings = { target: '_self' };

    const resolvedA = resolveAutoLinkSettingsCached(cache, BASE, overrideA);
    const resolvedB = resolveAutoLinkSettingsCached(cache, BASE, overrideB);

    expect(resolvedA).not.toBe(resolvedB);
    expect(resolvedA).toEqual(resolvedB);
  });

  it('should return a value equal to a direct, uncached resolve', () => {
    const cache = new WeakMap<object, ResolvedAutoLinkSettings>();
    const override: AutoLinkSettings = { schemes: ['https'], className: 'company-link' };

    expect(resolveAutoLinkSettingsCached(cache, BASE, override)).toEqual(resolveAutoLinkSettings(BASE, override));
  });
});
