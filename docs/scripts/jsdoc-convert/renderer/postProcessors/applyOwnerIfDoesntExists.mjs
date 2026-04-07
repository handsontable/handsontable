export const applyOwnerIfDoesntExists = (data) => {
  const first = data[0];

  if (first.kind === 'class') {
    return data; // class element exists, all's right
  }

  return [
    {
      id: first.memberof,
      longname: first.memberof,
      name: first.memberof,
      kind: 'class',
      scope: 'global',
    },
    ...data
  ];
};
