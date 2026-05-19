import { verifyAngularVersion, UNSUPPORTED_ANGULAR_VERSION_WARNING } from './angular-version-checker';

describe('verifyAngularVersion', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should not warn when Angular version is at the minimum supported version (16)', () => {
    verifyAngularVersion({ major: '16', full: '16.0.0' });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not warn for Angular 17', () => {
    verifyAngularVersion({ major: '17', full: '17.3.0' });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not warn for Angular 19', () => {
    verifyAngularVersion({ major: '19', full: '19.2.20' });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not warn for Angular 21 (maximum supported version)', () => {
    verifyAngularVersion({ major: '21', full: '21.0.0' });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should warn when Angular version is below the minimum supported version (15)', () => {
    verifyAngularVersion({ major: '15', full: '15.2.0' });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      UNSUPPORTED_ANGULAR_VERSION_WARNING.replace('%%VERSION%%', '15.2.0')
    );
  });

  it('should warn when Angular version is above the maximum supported version (22)', () => {
    verifyAngularVersion({ major: '22', full: '22.0.0' });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      UNSUPPORTED_ANGULAR_VERSION_WARNING.replace('%%VERSION%%', '22.0.0')
    );
  });

  it('should include the actual Angular version in the warning message', () => {
    verifyAngularVersion({ major: '14', full: '14.3.0' });

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('14.3.0'));
  });
});
