import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load ALL env vars (no prefix filter) so we can access GEMINI_API_KEY
    const env = loadEnv(mode, process.cwd(), '');

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
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        },
    };
});
