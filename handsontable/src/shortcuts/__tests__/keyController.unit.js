import { createKeysController } from '../keyController';

describe('createKeysController', () => {
  it('should create keysController', () => {
    const keyController = createKeysController();

    expect(keyController).toBeDefined();
    expect(keyController.press).toBeDefined();
    expect(keyController.release).toBeDefined();
    expect(keyController.releaseAll).toBeDefined();
    expect(keyController.getPressed).toBeDefined();
    expect(keyController.isPressed).toBeDefined();
  });

  it('should press buttons', () => {
    const keyController = createKeysController();

    keyController.press('a');
    keyController.press('b');
    keyController.press('c');

    expect(keyController.getPressed()).toEqual(['a', 'b', 'c']);
  });

  it('should release button', () => {
    const keyController = createKeysController();

    keyController.press('a');
    keyController.press('b');
    keyController.press('c');

    keyController.release('b');

    expect(keyController.getPressed()).toEqual(['a', 'c']);
  });

  it('should release all buttons', () => {
    const keyController = createKeysController();

    keyController.press('a');
    keyController.press('b');
    keyController.press('c');

    keyController.releaseAll();

    expect(keyController.getPressed()).toEqual([]);
  });

  it('should check if key is pressed', () => {
    const keyController = createKeysController();

    keyController.press('d');
    keyController.press('e');
    keyController.press('f');

    expect(keyController.isPressed('e')).toEqual(true);
    expect(keyController.isPressed('g')).toEqual(false);
  })
});
