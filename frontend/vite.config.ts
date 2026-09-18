import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  vite: {
    preview: {
      port: 5004,
      allowedHosts: ["megainfluencer.megascale.co.in"],
    },
  },
});