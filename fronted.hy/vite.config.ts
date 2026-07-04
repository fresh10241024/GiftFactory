import { defineConfig } from "vite"
import { resolve } from 'path'
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "./",
    root: "src/",
    publicDir: "../public",
    server: {
        host: true,
        open: true,
        proxy: {
            '/api': {
                target: 'https://web-production-53c2a.up.railway.app',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        outDir: "../dist", // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                chat: resolve(__dirname, 'src/chat.html'),
                analysis: resolve(__dirname, 'src/analysis.html'),
                gift: resolve(__dirname, 'src/gift.html'),
                dashboard: resolve(__dirname, 'src/dashboard.html'),
                manifestPreview: resolve(__dirname, 'src/manifest-preview.html'),
                photoExplorationPreview: resolve(__dirname, 'src/photo-exploration-preview.html'),
            },
        },
    }
})
