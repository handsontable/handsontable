// TODO: refine the list of default HF settings

export default {
  licenseKey: 'internal-use-in-handsontable',

  // default engine configuration
  binarySearchThreshold: 20,
  matrixDetection: true,
  matrixDetectionThreshold: 100,
  useColumnIndex: false,
  useStats: false,

  // desired UX
  evaluateNullToZero: true, // excel compatibility
  precisionEpsilon: 1e-13, // excel compatilibity
  precisionRounding: 14, // excel compatilibity
  smartRounding: true, // excel compatilibity
  leapYear1900: true, // excel and lotus123 leap year bug compatiblity
  nullDate: {
    year: 1899,
    month: 12,
    day: 31
  }, // same as above, not sure if correct
  nullYear: 30,

  // for simple formats (ie. US format)
  // for more advanced formats pls use: parseDateTime, stringifyDateTime
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'],

  // criterions, only wildcards and match whole cell
  matchWholeCell: true, // excel compatilibity
  useRegularExpressions: false, // excel compatilibity
  useWildcards: true, // excel compatilibity

  // those work together
  functionArgSeparator: ',', // excel compatibility (works with "language", "thousandSeparator", and "decimalSeparator")
  thousandSeparator: '', // excel compatiblity (works with "language", "decimalSeparator" and "functionArgSeparator")
  decimalSeparator: '.', // excel compatiblity (works with "language", "thousandSeparator" and "functionArgSeparator")
  language: 'enGB',
};
