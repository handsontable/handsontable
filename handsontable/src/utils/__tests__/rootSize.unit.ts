import {
  classifyInlineSize,
  createCssValueOracle,
  resolveRootSize,
} from 'handsontable/utils/rootSize';

describe('resolveRootSize', () => {
  describe('numbers', () => {
    it('should resolve a non-negative number to pixels', () => {
      expect(resolveRootSize(500)).toEqual({ kind: 'px', cssValue: '500px', isContainerDriven: false });
      expect(resolveRootSize(0)).toEqual({ kind: 'px', cssValue: '0px', isContainerDriven: false });
      expect(resolveRootSize(12.5)).toEqual({ kind: 'px', cssValue: '12.5px', isContainerDriven: false });
    });

    it('should reject a negative or non-finite number', () => {
      expect(resolveRootSize(-100).kind).toBe('invalid');
      expect(resolveRootSize(NaN).kind).toBe('invalid');
      expect(resolveRootSize(Infinity).kind).toBe('invalid');
      expect(resolveRootSize(-Infinity).kind).toBe('invalid');
    });
  });

  describe('pixel strings', () => {
    it('should resolve a bare numeric string and a pixel string to pixels', () => {
      expect(resolveRootSize('250')).toEqual({ kind: 'px', cssValue: '250px', isContainerDriven: false });
      expect(resolveRootSize('250px')).toEqual({ kind: 'px', cssValue: '250px', isContainerDriven: false });
      expect(resolveRootSize('12.5px').cssValue).toBe('12.5px');
      expect(resolveRootSize('0').cssValue).toBe('0px');
    });

    it('should ignore whitespace and the unit letter case', () => {
      expect(resolveRootSize(' 250 PX ')).toEqual({ kind: 'px', cssValue: '250px', isContainerDriven: false });
      expect(resolveRootSize('250 px').cssValue).toBe('250px');
    });

    it('should reject a negative string, with or without a unit', () => {
      expect(resolveRootSize('-250').kind).toBe('invalid');
      expect(resolveRootSize('-250px', () => false).kind).toBe('invalid');
    });
  });

  describe('the `auto` keyword', () => {
    it('should resolve `auto` in any letter case as container-driven', () => {
      expect(resolveRootSize('auto')).toEqual({ kind: 'auto', cssValue: 'auto', isContainerDriven: true });
      expect(resolveRootSize(' AUTO ')).toEqual({ kind: 'auto', cssValue: 'auto', isContainerDriven: true });
    });
  });

  describe('CSS lengths', () => {
    it('should pass through percentages, viewport and container-query units as container-driven', () => {
      expect(resolveRootSize('50%')).toEqual({ kind: 'css', cssValue: '50%', isContainerDriven: true });
      expect(resolveRootSize('75vh').isContainerDriven).toBe(true);
      expect(resolveRootSize('100dvh').isContainerDriven).toBe(true);
      expect(resolveRootSize('100svw').isContainerDriven).toBe(true);
      expect(resolveRootSize('50cqw').isContainerDriven).toBe(true);
      expect(resolveRootSize('50cqi').isContainerDriven).toBe(true);
      expect(resolveRootSize('75vh').kind).toBe('css');
    });

    it('should pass through font-relative and absolute units as definite', () => {
      expect(resolveRootSize('20em')).toEqual({ kind: 'css', cssValue: '20em', isContainerDriven: false });
      expect(resolveRootSize('10rem').isContainerDriven).toBe(false);
      expect(resolveRootSize('40ch').isContainerDriven).toBe(false);
      expect(resolveRootSize('10cm').isContainerDriven).toBe(false);
      expect(resolveRootSize('12pt').kind).toBe('css');
    });

    it('should keep the value as written, trimmed', () => {
      expect(resolveRootSize('  50%  ').cssValue).toBe('50%');
      expect(resolveRootSize('20EM').cssValue).toBe('20EM');
    });
  });

  describe('CSS functions', () => {
    it('should pass through math and substitution functions without an oracle', () => {
      expect(resolveRootSize('calc(100% - 40px)')).toEqual({
        kind: 'css', cssValue: 'calc(100% - 40px)', isContainerDriven: true,
      });
      expect(resolveRootSize('calc(20em + 4px)').isContainerDriven).toBe(false);
      expect(resolveRootSize('min(500px, 100%)').isContainerDriven).toBe(true);
      expect(resolveRootSize('max(300px, 20em)').isContainerDriven).toBe(false);
      expect(resolveRootSize('clamp(200px, 50vh, 600px)').isContainerDriven).toBe(true);
      expect(resolveRootSize('var(--grid-height)').isContainerDriven).toBe(true);
      expect(resolveRootSize('env(safe-area-inset-bottom)').isContainerDriven).toBe(true);
    });

    it('should let the oracle reject a malformed function', () => {
      expect(resolveRootSize('calc(100% -40px)', () => false).kind).toBe('invalid');
      expect(resolveRootSize('calc(100% - 40px)', () => true).kind).toBe('css');
    });
  });

  describe('rejected keywords', () => {
    it.each([
      'fit-content', 'fit-content(200px)', 'min-content', 'max-content', 'inherit', 'initial',
      'unset', 'revert', 'revert-layer', 'stretch', 'none', 'normal', 'MIN-CONTENT',
    ])('should reject `%s` even when the oracle accepts it', (keyword) => {
      expect(resolveRootSize(keyword, () => true).kind).toBe('invalid');
    });
  });

  describe('unreadable values', () => {
    it('should reject text and malformed sizes without an oracle', () => {
      expect(resolveRootSize('abc').kind).toBe('invalid');
      expect(resolveRootSize('').kind).toBe('invalid');
      expect(resolveRootSize('   ').kind).toBe('invalid');
      expect(resolveRootSize('100px100').kind).toBe('invalid');
      expect(resolveRootSize('100 px 100').kind).toBe('invalid');
    });

    it('should ask the oracle about a string the grammar does not know', () => {
      const oracle = jest.fn((value: string) => value === '100xyz');

      expect(resolveRootSize('100xyz', oracle).kind).toBe('css');
      expect(resolveRootSize('abc', oracle).kind).toBe('invalid');
      expect(oracle).toHaveBeenCalledWith('100xyz');
      expect(oracle).toHaveBeenCalledWith('abc');
    });

    it('should not ask the oracle about the forms the grammar decides', () => {
      const oracle = jest.fn(() => false);

      expect(resolveRootSize('250', oracle).kind).toBe('px');
      expect(resolveRootSize('auto', oracle).kind).toBe('auto');
      expect(resolveRootSize('50%', oracle).kind).toBe('css');
      expect(oracle).not.toHaveBeenCalled();
    });

    it('should reject values that are not numbers or strings', () => {
      expect(resolveRootSize(true).kind).toBe('invalid');
      expect(resolveRootSize([200]).kind).toBe('invalid');
      expect(resolveRootSize({}).kind).toBe('invalid');
      expect(resolveRootSize(null).kind).toBe('invalid');
      expect(resolveRootSize(undefined).kind).toBe('invalid');
    });

    it('should carry no css value for an invalid resolution', () => {
      expect(resolveRootSize('abc')).toEqual({ kind: 'invalid', cssValue: null, isContainerDriven: false });
    });
  });
});

describe('createCssValueOracle', () => {
  it('should return undefined where the window has no `CSS.supports` (jsdom)', () => {
    expect(createCssValueOracle({} as Window, 'height')).toBeUndefined();
    expect(createCssValueOracle({ CSS: {} } as unknown as Window, 'height')).toBeUndefined();
  });

  it('should ask `CSS.supports` for the given property', () => {
    const supports = jest.fn((property: string, value: string) => property === 'width' && value === '50%');
    const oracle = createCssValueOracle({ CSS: { supports } } as unknown as Window, 'width');

    expect(oracle?.('50%')).toBe(true);
    expect(oracle?.('abc')).toBe(false);
    expect(supports).toHaveBeenCalledWith('width', '50%');
  });

  it('should treat a throwing `CSS.supports` as a rejection', () => {
    const supports = () => {
      throw new Error('no');
    };
    const oracle = createCssValueOracle({ CSS: { supports } } as unknown as Window, 'height');

    expect(oracle?.('50%')).toBe(false);
  });
});

describe('classifyInlineSize', () => {
  it('should classify the two free states', () => {
    expect(classifyInlineSize('')).toBe('unset');
    expect(classifyInlineSize('auto')).toBe('auto');
  });

  it('should classify pixel and font-relative lengths as definite', () => {
    expect(classifyInlineSize('500px')).toBe('definite');
    expect(classifyInlineSize('20em')).toBe('definite');
    expect(classifyInlineSize('calc(20em + 4px)')).toBe('definite');
  });

  it('should classify container-driven values, including inside functions', () => {
    expect(classifyInlineSize('100%')).toBe('container-driven');
    expect(classifyInlineSize('80vw')).toBe('container-driven');
    expect(classifyInlineSize('100dvh')).toBe('container-driven');
    expect(classifyInlineSize('50cqw')).toBe('container-driven');
    expect(classifyInlineSize('calc(100% - 40px)')).toBe('container-driven');
    expect(classifyInlineSize('var(--w)')).toBe('container-driven');
    expect(classifyInlineSize('env(safe-area-inset-left)')).toBe('container-driven');
  });
});
