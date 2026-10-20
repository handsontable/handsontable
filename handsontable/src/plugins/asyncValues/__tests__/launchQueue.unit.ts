import { Launch, LaunchQueue } from '../launchQueue';

describe('AsyncValues LaunchQueue', () => {
  it('should start launches in order through a long standing backlog', () => {
    const queue = new LaunchQueue(() => 1);
    const started: number[] = [];
    const releases: Array<() => void> = [];

    // Far more launches than the compaction threshold, all waiting behind one slot.
    for (let index = 0; index < 3000; index++) {
      queue.push(new Launch((release) => {
        started.push(index);
        releases.push(release);
      }, () => true));
    }

    expect(started).toEqual([0]);

    for (let index = 0; index < 2999; index++) {
      releases[index]();
    }

    expect(started).toEqual(Array.from({ length: 3000 }, (_, index) => index));
  });

  it('should drop a launch that has nothing left to compute', () => {
    const queue = new LaunchQueue(() => 1);
    const run = jest.fn();
    let release = () => {};

    queue.push(new Launch((onRelease) => {
      release = onRelease;
    }, () => true));
    queue.push(new Launch(run, () => false));
    release();

    expect(run).not.toHaveBeenCalled();
  });
});
