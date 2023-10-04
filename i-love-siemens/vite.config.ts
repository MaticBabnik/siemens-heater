import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        proxy: {
            "/ws": {
                target: "ws://192.168.116.100:8080",
                ignorePath: true,
                ws: true,
            },
        },
    },
});
