/**
 * Whether the ManualColumnFreeze plugin is currently switched off.
 *
 * Both menu entries need this in two places. `hidden()` keeps a disabled plugin's entry out of the
 * rendered menu, and `disabled()` closes the API path: `CommandExecutor` never evicts a command it
 * registered, and `execute()` gates on `disabled`, not `hidden`, so a stale entry stays runnable
 * through `executeCommand()`. Missing either site leaves the entry hidden but still executable.
 *
 * @param {ManualColumnFreeze} manualColumnFreezePlugin The plugin instance.
 * @returns {boolean}
 */
export function isPluginOff(manualColumnFreezePlugin: unknown): boolean {
  return !(manualColumnFreezePlugin as { enabled: boolean }).enabled;
}
