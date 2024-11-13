import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const dir = "output";

/** @type {import('rollup').RollupOptions} */
export default {
  input: "src/main.ts",
  external: ["typeorm"],
  output: [
    {
      dir,
      format: "commonjs",
    },
    {
      file: `${dir}/main.mjs`,
    },
  ],
  plugins: [typescript(), terser()],
};
