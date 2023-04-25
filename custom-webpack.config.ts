import type { Configuration } from 'webpack';

module.exports = {
  entry: {
    background: { import: 'src/background.ts', runtime: false },
    devtools: { import: 'src/devtools.ts', runtime: false },
 },

} as Configuration;
