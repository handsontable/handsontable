/**
 * The license capability tokens the XLSX engine reads from an entitlement license key. This module
 * imports nothing, so any other module can depend on it.
 */

/**
 * The lifecycle stage of a capability token.
 */
export type CapabilityStatus = 'stable';

/**
 * The plugins that gate a feature behind a capability token.
 */
export type CapabilityPlugin = 'ImportFile' | 'ExportFile';

/**
 * One capability token and the plugins and tokens it relates to.
 */
export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  plugins: CapabilityPlugin[];
  since: string;
  status: CapabilityStatus;
  requires: { allOf?: string[]; anyOf?: string[] };
}

/**
 * The prefix every XLSX capability token starts with.
 */
export const XLSX_CAPABILITY_PREFIX = 'xlsx:';

/**
 * The shape a capability token must have (the same pattern the license generator uses).
 */
export const CAPABILITY_TOKEN_PATTERN = /^[a-z][a-z0-9_]*(?::[a-z0-9_]+(?:\.[a-z0-9_]+)*)?$/;

/**
 * The XLSX capability tokens, in the order the specification lists them.
 */
export const XLSX_CAPABILITIES: readonly CapabilityDefinition[] = Object.freeze([
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:import',
    name: 'XLSX import',
    description:
        'Read .xlsx files into the grid: cell values, shared strings, sheet selection, and column '
      + 'type inference.',
    plugins: ['ImportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: {},
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:export',
    name: 'XLSX export',
    description: 'Write the grid to an .xlsx file: cell values, sheet names, and the To Excel context menu item.',
    plugins: ['ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: {},
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:formulas',
    name: 'Formulas',
    description:
        'Import formulas into the Formulas plugin and export live formulas instead of calculated '
      + 'values, including shared-formula translation.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:layout',
    name: 'Sheet layout',
    description:
        'Column widths, row heights, hidden rows and columns, merged cells, frozen panes, '
      + 'right-to-left direction, and sheet state.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:number_formats',
    name: 'Number formats',
    description:
        'Date, time, currency, percentage, and custom number formats on export. Import always reads '
      + 'number formats to infer cell types, so this token does not restrict import.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:comments',
    name: 'Comments',
    description: 'Cell comments, imported into the Comments plugin and exported with VML so they display in Excel.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:import_report',
    name: 'Import report',
    description:
        'The full list of workbook features the import did not carry over, returned in the import '
      + 'result. Without this token the list holds only the license entries, so you always see '
      + 'which tokens are missing.',
    plugins: ['ImportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { allOf: ['xlsx:import'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:styles',
    name: 'Cell styles',
    description: 'Font, fill, borders, and alignment of cells and headers.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:conditional_formatting',
    name: 'Conditional formatting',
    description:
        'Conditional formatting rules: cellIs, expression, containsText family, top10, '
      + 'aboveAverage, and timePeriod.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:data_validation',
    name: 'Data validation',
    description:
        'Dropdown lists from data validation rules, imported as dropdown cells and exported with a '
      + 'helper sheet for the list values.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
  Object.freeze<CapabilityDefinition>({
    id: 'xlsx:protection',
    name: 'Sheet protection',
    description:
        'Locked cells and sheet protection, with an optional SHA-512 password hash on export. '
      + 'Read-only cells export as locked cells on a protected sheet, and a protected sheet imports '
      + 'its locked cells as read-only.',
    plugins: ['ImportFile', 'ExportFile'],
    since: '19.0.0',
    status: 'stable',
    requires: { anyOf: ['xlsx:import', 'xlsx:export'] },
  }),
]);

/**
 * The ids of all XLSX capability tokens, in declaration order.
 */
export const XLSX_CAPABILITY_IDS: readonly string[] = Object.freeze(XLSX_CAPABILITIES.map(({ id }) => id));

/**
 * Returns the capability tokens a plugin gates.
 *
 * @param {CapabilityPlugin} plugin The plugin name.
 * @returns {CapabilityDefinition[]}
 */
export function capabilitiesOfPlugin(plugin: CapabilityPlugin): CapabilityDefinition[] {
  return XLSX_CAPABILITIES.filter(({ plugins }) => plugins.includes(plugin));
}
