import { resolveAutoLinkSettings } from '../resolveSettings';
import type { ResolvedAutoLinkSettings } from '../resolveSettings';
import type { AutoLinkSettings } from '../autoLink';

const BASE: ResolvedAutoLinkSettings = {
  target: '_blank',
  schemes: ['http', 'https', 'mailto', 'tel'],
  inline: true,
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
});
