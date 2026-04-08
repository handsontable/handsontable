// Clear class memberof (f.i. BasePlugin is member of BasePlugin)
export const clearMemberofIfClass = (data) => {
  data.some((member) => {
    if (member.kind === 'class') {
      member.memberof = undefined;
    }

    return member.kind === 'class';
  });

  return data;
};
