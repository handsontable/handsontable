import { StyleManager, escapeXml } from '../styleManager';

describe('StyleManager', () => {
  describe('registerStyle', () => {
    it('should return 0 for the default style', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({});

      expect(index).toBe(0);
    });

    it('should assign a new index for a bold font style', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({ font: { bold: true } });

      expect(index).toBeGreaterThan(0);
    });

    it('should return the same index for identical styles', () => {
      const manager = new StyleManager();
      const index1 = manager.registerStyle({ font: { bold: true } });
      const index2 = manager.registerStyle({ font: { bold: true } });

      expect(index1).toBe(index2);
    });

    it('should assign different indexes for different styles', () => {
      const manager = new StyleManager();
      const boldIndex = manager.registerStyle({ font: { bold: true } });
      const italicIndex = manager.registerStyle({ font: { italic: true } });

      expect(boldIndex).not.toBe(italicIndex);
    });

    it('should handle fill styles', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({ fill: { color: 'FF0000' } });

      expect(index).toBeGreaterThan(0);
    });

    it('should handle border styles', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({
        border: {
          top: { style: 'thin', color: '000000' },
        },
      });

      expect(index).toBeGreaterThan(0);
    });

    it('should handle alignment styles', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({
        alignment: { horizontal: 'center', vertical: 'center' },
      });

      expect(index).toBeGreaterThan(0);
    });

    it('should handle number format styles', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({
        numberFormat: '#,##0.00',
      });

      expect(index).toBeGreaterThan(0);
    });

    it('should handle combined styles', () => {
      const manager = new StyleManager();
      const index = manager.registerStyle({
        font: { bold: true, color: 'FF0000' },
        fill: { color: 'FFFF00' },
        alignment: { horizontal: 'center' },
        numberFormat: '#,##0',
      });

      expect(index).toBeGreaterThan(0);
    });
  });

  describe('toXml', () => {
    it('should produce valid XML with XML declaration', () => {
      const manager = new StyleManager();
      const xml = manager.toXml();

      expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    });

    it('should contain the styleSheet root element', () => {
      const manager = new StyleManager();
      const xml = manager.toXml();

      expect(xml).toContain('<styleSheet');
      expect(xml).toContain('</styleSheet>');
    });

    it('should contain at least one font', () => {
      const manager = new StyleManager();
      const xml = manager.toXml();

      expect(xml).toContain('<fonts count="1"');
      expect(xml).toContain('<font>');
    });

    it('should contain two default fills', () => {
      const manager = new StyleManager();
      const xml = manager.toXml();

      expect(xml).toContain('<fills count="2"');
      expect(xml).toContain('patternType="none"');
      expect(xml).toContain('patternType="gray125"');
    });

    it('should contain at least one border', () => {
      const manager = new StyleManager();
      const xml = manager.toXml();

      expect(xml).toContain('<borders count="1"');
    });

    it('should contain at least one cellXf', () => {
      const manager = new StyleManager();
      const xml = manager.toXml();

      expect(xml).toContain('<cellXfs count="1"');
    });

    it('should include bold font when registered', () => {
      const manager = new StyleManager();

      manager.registerStyle({ font: { bold: true } });

      const xml = manager.toXml();

      expect(xml).toContain('<b/>');
      expect(xml).toContain('<fonts count="2"');
    });

    it('should include fill color when registered', () => {
      const manager = new StyleManager();

      manager.registerStyle({ fill: { color: 'FF0000' } });

      const xml = manager.toXml();

      expect(xml).toContain('fgColor rgb="FFFF0000"');
      expect(xml).toContain('patternType="solid"');
    });

    it('should include numFmts when custom number format is registered', () => {
      const manager = new StyleManager();

      manager.registerStyle({ numberFormat: '#,##0.00' });

      const xml = manager.toXml();

      expect(xml).toContain('<numFmts count="1"');
      expect(xml).toContain('formatCode="#,##0.00"');
    });

    it('should include alignment when registered', () => {
      const manager = new StyleManager();

      manager.registerStyle({ alignment: { horizontal: 'center' } });

      const xml = manager.toXml();

      expect(xml).toContain('horizontal="center"');
      expect(xml).toContain('applyAlignment="1"');
    });

    it('should include border side with color when registered', () => {
      const manager = new StyleManager();

      manager.registerStyle({
        border: {
          top: { style: 'thin', color: 'FF0000' },
        },
      });

      const xml = manager.toXml();

      expect(xml).toContain('<top style="thin">');
      expect(xml).toContain('rgb="FFFF0000"');
    });
  });
});

describe('escapeXml', () => {
  it('should escape ampersand', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B');
  });

  it('should escape less-than', () => {
    expect(escapeXml('1 < 2')).toBe('1 &lt; 2');
  });

  it('should escape greater-than', () => {
    expect(escapeXml('2 > 1')).toBe('2 &gt; 1');
  });

  it('should escape double quotes', () => {
    expect(escapeXml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeXml('it\'s')).toBe('it&apos;s');
  });

  it('should handle null and undefined', () => {
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
  });

  it('should handle numbers', () => {
    expect(escapeXml(42)).toBe('42');
  });
});
