import { defineConfig } from "vite"
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
            },
        },
    }
})
