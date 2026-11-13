import { type Page } from '@playwright/test';

/**
 * The animation watch of the motion checks (`forced-colors-motion.spec.ts` on the grid and
 * `a11y/sites/forced-colors-motion.spec.ts` on a site): every animation `document.getAnimations()` shows running,
 * frame by frame. `page.clock` drives none of them, so the watch runs on real time. The verdicts are
 * `lib/motion.mjs`.
 */

export interface SeenAnimation {
  kind: string;
  name: string;
  properties: string[];
  duration: number;
  // 'Infinity' for an endless animation: the record is attached as JSON, which writes the number as null.
  iterations: number | 'Infinity';
  target: string;
  firstSeen: number;
  lastSeen: number;
  running: boolean;
}

export interface Watch {
  animations: SeenAnimation[];
  // When the watch's first and last frames ran, on the clock of `firstSeen` and `lastSeen`.
  frames: { first: number; last: number };
}

/**
 * Watches `document.getAnimations()` on every frame for a time and records each animation seen running:
 * its kind, its name (the animation name or the transitioned property), the properties it animates, its
 * duration and iterations, its target, and when it was first and last seen running. It also records when
 * its own first and last frames ran, which bound what "seen for the whole watch" means.
 *
 * @param page The page.
 * @param ms How long to watch.
 * @returns The animations and the watch's frames.
 */
export async function watchAnimations(page: Page, ms: number): Promise<Watch> {
  return page.evaluate(async(duration) => {
    const start = performance.now();
    const frames = { first: -1, last: -1 };
    const records = new Map<Animation, Record<string, unknown>>();
    const kebab = (name: string) => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const describe = (animation: Animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target as Element | null;
      const css = animation as Animation & { animationName?: string; transitionProperty?: string };
      const keyframes = effect?.getKeyframes?.() ?? [];
      const properties = css.transitionProperty
        ? [css.transitionProperty]
        : [...new Set(keyframes.flatMap(frame => Object.keys(frame).filter(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key))))].map(kebab);
      const timing = effect?.getComputedTiming?.() ?? {};
      const classes = target ? [...target.classList].slice(0, 1).map(name => `.${name}`).join('') : '';

      return {
        kind: animation.constructor.name,
        // A script animation's `id` is '' unless the script set one.
        name: css.animationName ?? css.transitionProperty ?? (animation.id || 'animation'),
        properties,
        duration: Number(timing.duration) || 0,
        iterations: timing.iterations === Infinity ? 'Infinity' : Number(timing.iterations ?? 1),
        target: target ? `${target.tagName.toLowerCase()}${classes}` : 'none',
      };
    };

    await new Promise<void>((resolve) => {
      const tick = () => {
        const now = performance.now() - start;

        if (frames.first < 0) {
          frames.first = now;
        }
        frames.last = now;
        for (const animation of document.getAnimations()) {
          if (animation.playState === 'running') {
            const record = records.get(animation) ?? { ...describe(animation), firstSeen: now };

            record.lastSeen = now;
            records.set(animation, record);
          }
        }
        if (now >= duration) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    });

    return {
      animations: [...records].map(([animation, record]) => ({ ...record, running: animation.playState === 'running' }) as SeenAnimation),
      frames,
    };
  }, ms);
}
