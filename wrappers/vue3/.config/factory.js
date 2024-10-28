import { baseConfig } from './base';
import { cjsConfig } from './commonjs';
import { esConfig } from './es';
import { umdConfig } from './umd';
import { minConfig } from './minified';

export function createConfig() {
  const env = process.env.NODE_ENV;
  const config = baseConfig;
  const newConfigs = {
    cjs: cjsConfig,
    es: esConfig,
    umd: umdConfig,
    min: minConfig,
  };
  const newConfig = newConfigs[env];

  for (let key in newConfig) {
    if (newConfig.hasOwnProperty(key)) {
      if (Array.isArray(config[key]) && Array.isArray(newConfig[key])) {
        config[key] = newConfig[key];

      } else if (typeof config[key] === 'object' && typeof newConfig[key] === 'object') {
        Object.assign(config[key], newConfig[key]);

      } else {
        config[key] = newConfig[key];
      }
    }
  }

  return config;
}
