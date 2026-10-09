import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: '/beforesending/',
  plugins: [react()],
  build: {
    outDir: 'site',
    emptyOutDir: true,
  },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/demo美术素材/新版/**', '**/animals_v2_cutout/**'] },
    watch: { ignored: ["**/ui-preview/**", "**/edge-*/**", "**/Before-Sending-embedded.html", "**/demo美术素材/新版/**"] },
  },
});
