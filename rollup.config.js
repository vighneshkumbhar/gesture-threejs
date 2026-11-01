import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
        name: 'GestureThreeJS',
        globals: {
          three: 'THREE',
          '@mediapipe/hands': 'Hands'
        }
      }
    ],
    external: ['three', '@mediapipe/hands'],
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true
      }),
      terser({
        compress: { drop_console: true, drop_debugger: true },
        format: { comments: false }
      })
    ]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    external: ['three', '@mediapipe/hands'],
    plugins: [dts()]
  }
]);