import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  input: 'krisinformation-alert-card.js',
  output: {
    file: 'dist/krisinformation-alert-card.js',
    format: 'esm'
  },
  plugins: [nodeResolve()]
});
