// @ts-check
import { defineConfig } from "astro/config";

// Static output: deploying is just `astro build` (spec, sections 13 and 15).
export default defineConfig({
  output: "static",
});
