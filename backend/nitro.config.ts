import { defineNitroConfig } from "nitropack/config"

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: "2025-01-29",
  sourceMap: true,
  routeRules: {
    '/api/**': { cors: true }
  },
  experimental: {
    websocket: true
  }
});
