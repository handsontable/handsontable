module.exports = (config, ...rest) => {
  return { ...config, resolve: { ...config.resolve, symlinks: false } };
};
