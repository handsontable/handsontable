import { hasTypedKeyTag, extractTypedKeyData } from '../extractKeyData';
import { sha512 } from '../sha512';
import { stringToUtf8Bytes } from '../encoding';
import { buildTestKey } from './buildTestKey';
import {
  TRIAL_KEY,
  TRIAL_SAAS_KEY,
  FREEMIUM_KEY,
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_SAAS_KEY,
  PERPETUAL_KEY,
  HF_ADDONS_KEY,
  HF_ONLY_KEY,
  FIXTURE_EXPIRY_TIMESTAMP,
} from './fixtures';

describe('typedLicenseKey/sha512', () => {
  // Known-answer vectors from the SHA-512 spec / FIPS 180-4.
  it('should hash the empty input', () => {
    expect(sha512([])).toBe(
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce' +
      '47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
    );
  });

  it('should hash "abc"', () => {
    expect(sha512(stringToUtf8Bytes('abc'))).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
      '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    );
  });
});

describe('typedLicenseKey/hasTypedKeyTag', () => {
  it('should recognize every typed key tag', () => {
    expect(hasTypedKeyTag(TRIAL_KEY)).toBe(true);
    expect(hasTypedKeyTag(FREEMIUM_KEY)).toBe(true);
    expect(hasTypedKeyTag(SUBSCRIPTION_KEY)).toBe(true);
    expect(hasTypedKeyTag(PERPETUAL_KEY)).toBe(true);
  });

  it('should tolerate surrounding whitespace', () => {
    expect(hasTypedKeyTag(`  ${TRIAL_KEY}\n`)).toBe(true);
  });

  it('should reject legacy and empty keys without parsing', () => {
    expect(hasTypedKeyTag('d0134-95841-770f2-c4f21-3751d')).toBe(false);
    expect(hasTypedKeyTag('non-commercial-and-evaluation')).toBe(false);
    expect(hasTypedKeyTag('')).toBe(false);
    expect(hasTypedKeyTag('[UNKNOWN]_something')).toBe(false);
  });
});

describe('typedLicenseKey/extractTypedKeyData', () => {
  describe('authoritative CLI fixtures (compatibility proof)', () => {
    it('should read a trial key', () => {
      const data = extractTypedKeyData(TRIAL_KEY);

      expect(data.keyType).toBe('trial');
      expect(data.payload.v).toBe(1);
      expect(data.payload.holder).toBe('Test Fixture');
      expect(data.payload.products.handsontable.tier).toBe('enterprise');
      expect(data.payload.products.handsontable.mode).toBe('internal');
      expect(data.payload.products.handsontable.grace).toBe(15);
      expect(data.expiryTimestamp).toBe(FIXTURE_EXPIRY_TIMESTAMP);
    });

    it('should read a saas trial key', () => {
      expect(extractTypedKeyData(TRIAL_SAAS_KEY).payload.products.handsontable.mode).toBe('saas');
    });

    it('should read a freemium key with a null expiry', () => {
      const data = extractTypedKeyData(FREEMIUM_KEY);

      expect(data.keyType).toBe('freemium');
      expect(data.payload.products.handsontable.tier).toBe('freemium');
      expect(data.expiryTimestamp).toBe(null);
    });

    it('should read a subscription key', () => {
      const data = extractTypedKeyData(SUBSCRIPTION_KEY);

      expect(data.keyType).toBe('subscription');
      expect(data.payload.products.handsontable.grace).toBe(90);
      expect(data.expiryTimestamp).toBe(FIXTURE_EXPIRY_TIMESTAMP);
    });

    it('should read a saas subscription key', () => {
      expect(extractTypedKeyData(SUBSCRIPTION_SAAS_KEY).payload.products.handsontable.mode).toBe('saas');
    });

    it('should read a perpetual key', () => {
      const data = extractTypedKeyData(PERPETUAL_KEY);

      expect(data.keyType).toBe('perpetual');
      expect(data.expiryTimestamp).toBe(FIXTURE_EXPIRY_TIMESTAMP);
    });

    it('should read a key carrying HyperFormula add-ons', () => {
      const data = extractTypedKeyData(HF_ADDONS_KEY);

      expect(data.payload.products.hyperformula.tier).toBe('data_grid');
      expect(data.payload.products.hyperformula.addons).toEqual(['spreadsheet', 'import_export']);
    });

    it('should read a HyperFormula-only key (its expiry resolves to HyperFormula)', () => {
      // The reader is product-agnostic; the "no Handsontable grant" policy lives
      // in the grants/classifier layers, not here.
      const data = extractTypedKeyData(HF_ONLY_KEY);

      expect(data.keyType).toBe('subscription');
      expect(data.payload.products.handsontable).toBe(undefined);
      expect(data.expiryTimestamp).toBe(FIXTURE_EXPIRY_TIMESTAMP);
    });

    it('should tolerate surrounding whitespace', () => {
      expect(extractTypedKeyData(`\n  ${TRIAL_KEY}  \n`).keyType).toBe('trial');
    });

    it('should keep a real epoch-0 expiry distinct from "never" (null)', () => {
      // The 1970-01-01 timestamp of 0 must stay distinguishable from a
      // freemium key's `null` - the code uses `=== null`/`=== undefined`, not
      // falsy checks. This pins that invariant against a future refactor.
      const key = buildTestKey('[SUB]', {
        v: 1,
        holder: 'x',
        products: { handsontable: { tier: 'enterprise', exp: '1970-01-01', grace: 90 } },
      });

      expect(extractTypedKeyData(key).expiryTimestamp).toBe(0);
      expect(extractTypedKeyData(FREEMIUM_KEY).expiryTimestamp).toBe(null);
    });
  });

  describe('rejection of malformed and tampered keys', () => {
    it('should reject a non-typed key', () => {
      expect(extractTypedKeyData('d0134-95841-770f2-c4f21-3751d')).toBe(null);
      expect(extractTypedKeyData('')).toBe(null);
    });

    it('should reject a tampered checksum', () => {
      const last = TRIAL_KEY.slice(-1) === 'a' ? 'b' : 'a';

      expect(extractTypedKeyData(TRIAL_KEY.slice(0, -1) + last)).toBe(null);
    });

    it('should reject a tampered payload', () => {
      // Flip a character in the middle of the key body (the prose/payload).
      const mid = Math.floor(TRIAL_KEY.length / 2);
      const swapped = TRIAL_KEY.charAt(mid) === 'A' ? 'B' : 'A';

      expect(extractTypedKeyData(TRIAL_KEY.slice(0, mid) + swapped + TRIAL_KEY.slice(mid + 1))).toBe(null);
    });

    it('should reject a truncated key', () => {
      expect(extractTypedKeyData(TRIAL_KEY.slice(0, 100))).toBe(null);
      expect(extractTypedKeyData('[TRIAL]_x')).toBe(null);
    });

    it('should reject an unsupported format version', () => {
      const key = buildTestKey('[SUB]', {
        v: 2,
        holder: 'x',
        products: { handsontable: { tier: 'enterprise', exp: '2027-01-01', grace: 90 } },
      });

      expect(extractTypedKeyData(key)).toBe(null);
    });

    it('should reject a payload granting an unknown product', () => {
      const key = buildTestKey('[SUB]', {
        v: 1,
        holder: 'x',
        products: { spreadsheet_viewer: { tier: 'enterprise', exp: '2027-01-01', grace: 90 } },
      });

      expect(extractTypedKeyData(key)).toBe(null);
    });

    it('should reject a payload with an impossible expiry date', () => {
      const key = buildTestKey('[SUB]', {
        v: 1,
        holder: 'x',
        products: { handsontable: { tier: 'enterprise', exp: '2027-02-30', grace: 90 } },
      });

      expect(extractTypedKeyData(key)).toBe(null);
    });

    it('should reject non-object and array payloads', () => {
      expect(extractTypedKeyData(buildTestKey('[SUB]', null))).toBe(null);
      expect(extractTypedKeyData(buildTestKey('[SUB]', [1, 2, 3]))).toBe(null);
      expect(extractTypedKeyData(buildTestKey('[SUB]', { v: 1, products: [] }))).toBe(null);
    });

    it('should reject a payload whose product entry is not an object', () => {
      const key = buildTestKey('[SUB]', { v: 1, holder: 'x', products: { handsontable: 'enterprise' } });

      expect(extractTypedKeyData(key)).toBe(null);
    });
  });

  describe('single-character mutation loop', () => {
    it('should invalidate every single-character substitution of a valid key', () => {
      const alphabet = 'ABab01_-+/=[]{}.';

      // Sample positions across the key (full O(n*alphabet) is overkill in a
      // unit test); the checksum makes any change fatal wherever it lands.
      for (let i = 0; i < TRIAL_KEY.length; i += 7) {
        for (const replacement of alphabet) {
          if (replacement !== TRIAL_KEY.charAt(i)) {
            const mutated = TRIAL_KEY.slice(0, i) + replacement + TRIAL_KEY.slice(i + 1);

            expect(extractTypedKeyData(mutated)).toBe(null);
          }
        }
      }
    });

    it('should invalidate a single-character deletion of a valid key', () => {
      for (let i = 0; i < TRIAL_KEY.length; i += 11) {
        const mutated = TRIAL_KEY.slice(0, i) + TRIAL_KEY.slice(i + 1);

        expect(extractTypedKeyData(mutated)).toBe(null);
      }
    });
  });
});
