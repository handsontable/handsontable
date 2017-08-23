const formatters = [];

export function register(formatter) {
  formatters.push(formatter);
}

export function get() {
  return formatters;
}
