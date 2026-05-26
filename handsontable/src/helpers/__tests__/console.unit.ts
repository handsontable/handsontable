/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-global-assign */

import {
  log,
  warn,
  info,
  error,
  deprecatedWarn,
  logAggregatedItems,
} from 'handsontable/helpers/console';

describe('Console', () => {
  describe('log', () => {
    it('should call function `console.log` with all arguments', () => {
      console.log = jasmine.createSpy('log');

      log('a', 'b', 'c');
      expect(console.log).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should not throw Exception when `console` is not exposed', () => {
      const cachedConsole = console;

      console = undefined;

      expect(() => {
        log('a', 'b', 'c');
      }).not.toThrow();

      console = cachedConsole;
    });
  });

  describe('warn', () => {
    it('should call function `console.warn` with all arguments', () => {
      console.warn = jasmine.createSpy('warn');

      warn('a', 'b', 'c');
      expect(console.warn).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should not throw Exception when `console` is not exposed', () => {
      const cachedConsole = console;

      console = undefined;

      expect(() => {
        warn('a', 'b', 'c');
      }).not.toThrow();

      console = cachedConsole;
    });
  });

  describe('deprecatedWarn', () => {
    it('should call function `console.warn` with all arguments', () => {
      console.warn = jasmine.createSpy('warn');

      deprecatedWarn('Test');
      expect(console.warn).toHaveBeenCalledWith('Deprecated: Test');
    });
  });

  describe('info', () => {
    it('should call function `console.info` with all arguments', () => {
      console.info = jasmine.createSpy('info');

      info('a', 'b', 'c');
      expect(console.info).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should not throw Exception when `console` is not exposed', () => {
      const cachedConsole = console;

      console = undefined;

      expect(() => {
        info('a', 'b', 'c');
      }).not.toThrow();

      console = cachedConsole;
    });
  });

  describe('error', () => {
    it('should call function `console.error` with all arguments', () => {
      console.error = jasmine.createSpy('error');

      error('a', 'b', 'c');
      expect(console.error).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should not throw Exception when `console` is not exposed', () => {
      const cachedConsole = console;

      console = undefined;

      expect(() => {
        error('a', 'b', 'c');
      }).not.toThrow();

      console = cachedConsole;
    });
  });

  describe('logAggregatedItems', () => {
    it('should do nothing when items is not an array', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({ logFunction, message: '[itemsCount]', items: null });
      logAggregatedItems({ logFunction, message: '[itemsCount]', items: undefined });

      expect(logFunction).not.toHaveBeenCalled();
    });

    it('should do nothing when items is an empty array', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({ logFunction, message: '[itemsCount]', items: [] });

      expect(logFunction).not.toHaveBeenCalled();
    });

    it('should call logFunction with substituted message (singular "cell")', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({
        logFunction,
        message: 'Found [itemsCount]:\n[affectedCells]',
        items: ['A1'],
      });

      expect(logFunction).toHaveBeenCalledWith(
        'Found 1 cell:\nAffected cells:\n  - A1'
      );
    });

    it('should call logFunction with substituted message (plural "cells")', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({
        logFunction,
        message: '[itemsCount]\n[affectedCells]',
        items: ['A1', 'B2'],
      });

      expect(logFunction).toHaveBeenCalledWith(
        '2 cells\nAffected cells:\n  - A1\n  - B2'
      );
    });

    it('should use default itemFormatter', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({
        logFunction,
        message: '[affectedCells]',
        items: [1, 2, 3],
      });

      expect(logFunction).toHaveBeenCalledWith(
        'Affected cells:\n  - 1\n  - 2\n  - 3'
      );
    });

    it('should use custom itemFormatter', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({
        logFunction,
        message: '[affectedCells]',
        items: [{ row: 0, col: 1 }, { row: 1, col: 2 }],
        itemFormatter: item => `row ${item.row}, col ${item.col}`,
      });

      expect(logFunction).toHaveBeenCalledWith(
        'Affected cells:\n  - row 0, col 1\n  - row 1, col 2'
      );
    });

    it('should limit listed items to maxSample and append "...and N more"', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({
        logFunction,
        message: '[itemsCount]\n[affectedCells]',
        items: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
        maxSample: 3,
      });

      expect(logFunction).toHaveBeenCalledWith(
        '7 cells\nAffected cells:\n  - A1\n  - A2\n  - A3\n  - ...and 4 more'
      );
    });

    it('should use default maxSample of 5 when not provided', () => {
      const logFunction = jasmine.createSpy('log');

      logAggregatedItems({
        logFunction,
        message: '[affectedCells]',
        items: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      });

      expect(logFunction).toHaveBeenCalledWith(
        'Affected cells:\n  - a\n  - b\n  - c\n  - d\n  - e\n  - ...and 2 more'
      );
    });

    it('should use custom logFunction (e.g. warn)', () => {
      const logFunction = jasmine.createSpy('warn');

      logAggregatedItems({
        logFunction,
        message: '[itemsCount]',
        items: ['X'],
      });

      expect(logFunction).toHaveBeenCalledWith('1 cell');
    });
  });
});
