// @ts-check
import { defineConfig } from "astro/config";

// Saída estática: o deploy é só `astro build` (spec, seções 13 e 15).
export default defineConfig({
  output: "static",
});
