/**
 * Barrel for the settings slice. Keeps every `'./settings'` / `'../settings'` import resolving to the
 * `Settings` class after the file was split into the accessor engine (`accessor.ts`) and the defaults
 * data (`defaults.ts`).
 */
export { default } from './accessor';
