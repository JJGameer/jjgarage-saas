import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./", //Vite vai procurar o index.html na raíz do frontensd
});
