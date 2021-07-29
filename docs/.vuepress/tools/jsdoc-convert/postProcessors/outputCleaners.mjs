const clearEmptyOptionHeaders = text => text.replace(/## Options\n## Members/g, '## Members');
const clearEmptyMembersHeaders = text => text.replace(/## Members\n## Methods/g, '## Methods');
const clearEmptyFunctionsHeaders = text => text
  .replace(/(## Methods\n)+$/g, '\n')
  .replace(/(## Methods\n## Methods\n\n## Description)/g, '## Description')
  .replace(/(\n## Methods)+/g, '\n## Methods');

export const outputCleaners = [
  clearEmptyOptionHeaders,
  clearEmptyMembersHeaders,
  clearEmptyFunctionsHeaders
];
