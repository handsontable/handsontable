describe('CI Gate canary (DEV-2059)', () => {
  it('deliberately fails so the pipeline proves a red CI Gate blocks the merge', () => {
    expect('merge').toBe('blocked by CI Gate');
  });
});
