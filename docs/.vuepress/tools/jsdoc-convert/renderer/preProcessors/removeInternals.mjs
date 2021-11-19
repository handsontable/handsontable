export const removeInternals = (data) => {
  return data.filter((x) => {
    const isInternal = x.customTags
      ?.filter(tag => tag.tag === 'internal')
      ?.length > 0;
    return !isInternal;
  });
};
