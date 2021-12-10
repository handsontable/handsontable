/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-global-assign */

import {
  log,
  warn,
  info,
  error
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
});
