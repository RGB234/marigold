import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { visualizer } from 'rollup-plugin-visualizer'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig( ({mode}) => ({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        cloudflare(),
        ...(process.env.BUNDLE_ANALYZE === "true"
            ? [visualizer({ filename: "dist/bundle-report.html", gzipSize: true, brotliSize: true })]
            : []),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 8000
    },
    esbuild: {
        pure:
            mode === "prod"
                ? ["console.log", "console.debug", "console.info"]
                : [],
    },
}))
