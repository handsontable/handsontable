import { mainTheme } from '../theme/main';

describe('main theme tokens', () => {
  it('should keep a translucent dropdown menu icon hover background', () => {
    expect(mainTheme.tokens.iconButtonHoverBackgroundColor).toBe('#22222266');
  });
});
