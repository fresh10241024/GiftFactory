import { defineConfig } from "vite"
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    root: "src/",
    publicDir: "../public",
    server: {
        host: true, // Open to local network and display URL
        open: true, // Open in browser on development server start
    },
    build: {
        outDir: "../dist", // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                chat: resolve(__dirname, 'src/chat.html'),
                gift: resolve(__dirname, 'src/gift.html'),
            },
        },
    }
})
