import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
	name: 'vueTapAndHold',
  input: 'tap-and-hold.js',
  output: {
    file: 'tap-and-hold.build.js',
    format: 'umd'
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ]
};
