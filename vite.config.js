import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
        server: {
            host: '127.0.0.1',
            port: 5173,
            strictPort: true,
        },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/css/sheltrify.css', 'resources/js/app.tsx'],
                refresh: true,
            }),
            react(),
        ],
    };
});
