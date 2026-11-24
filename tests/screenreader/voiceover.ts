import { execFile } from 'node:child_process';
import {
  OUTPUT_STEP_BOUNDARY,
  READ_LAST_PHRASE,
  STEP_BOUNDARY,
  isStepBoundary,
  voiceOverAppleScript,
} from '../lib/screenreader-voiceover.mjs';

/**
 * The I/O half of the VoiceOver step boundary (`lib/screenreader-voiceover.mjs` holds the pure half),
 * shared by the scenario runner (`screenreader.spec.ts`) and the specs beside it that capture VoiceOver
 * themselves. Not a spec: Playwright refuses a spec that imports another spec.
 */

/**
 * VoiceOver preferences for a reproducible transcript, merged into the bundle `@guidepup/setup install
 * voiceover` installed. Usage hints off: VoiceOver says "You are currently on a cell, inside of a
 * table…" a second after every move, which is about VoiceOver, not the grid, and doubled every step's
 * time (about 10 s against 4 s). The mouse pointer no longer follows VoiceOver's cursor: with it on,
 * an opened context menu puts VoiceOver's cursor on the menu, the pointer lands in the menu's middle,
 * and the hover selects the item under it ("Remove column"), so every later ArrowDown started from
 * there. A keyboard user's pointer stays where it was.
 */
export const VOICEOVER_SETTINGS = {
  SCRShouldOutputVOInstructions: false,
  SCRConfigurationCursorTrackingMToVO: false,
};
/**
 * How many times the VoiceOver reader reads the last phrase after it spoke the step boundary, before
 * it speaks the boundary again, and how many times it speaks it before the run stops as tooling. Each
 * read is one `osascript` round trip (tens of milliseconds), which is the polling interval: no timer.
 */
const BOUNDARY_READS = 40;
const BOUNDARY_ATTEMPTS = 3;
/**
 * The budget of one `osascript` call to VoiceOver, before Node kills it.
 */
const OSASCRIPT_TIMEOUT_MS = 10_000;

/**
 * Runs AppleScript in VoiceOver's dictionary through `osascript`, the way Guidepup does (the script on
 * stdin), and returns what it printed.
 *
 * @param body The commands, inside `tell application "VoiceOver"`.
 * @returns The script's output, trimmed.
 */
export function runVoiceOverScript(body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile('/usr/bin/osascript', [], { timeout: OSASCRIPT_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        reject(error);

        return;
      }

      resolve(String(stdout).trim());
    });

    child.stdin?.end(voiceOverAppleScript(body));
  });
}

/**
 * Makes VoiceOver speak the step boundary and waits until it is VoiceOver's last phrase, so the next
 * capture tells silence (the boundary alone) from a phrase the previous step left behind
 * (`lib/screenreader-voiceover.mjs`). A read that fails counts as not yet. Speech that arrives while
 * the boundary is being set (a late phrase of the previous step) is lost, as Guidepup loses speech
 * while it stops the previous utterance.
 */
export async function markStepBoundary(): Promise<void> {
  for (let attempt = 0; attempt < BOUNDARY_ATTEMPTS; attempt += 1) {
    await runVoiceOverScript(OUTPUT_STEP_BOUNDARY);

    for (let read = 0; read < BOUNDARY_READS; read += 1) {
      const last = await runVoiceOverScript(READ_LAST_PHRASE).catch(() => '');

      if (isStepBoundary(last)) {
        return;
      }
    }
  }

  throw new Error(`VoiceOver never reported the step boundary ("${STEP_BOUNDARY}") as its last phrase after ${BOUNDARY_ATTEMPTS} attempts; without it a silent step reads as the previous step's phrase.`);
}
