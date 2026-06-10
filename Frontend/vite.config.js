import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./",

  resolve: {
    conditions: ["import", "module", "browser", "default"],
  },

  optimizeDeps: {
    include: ["recharts", "react-is", "react-smooth", "es-toolkit/compat"],
    esbuildOptions: {
      conditions: ["import", "module", "browser", "default"],
    },
  },

  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
