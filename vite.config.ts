import { defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const siteUrl = env.VITE_SITE_URL || '';
  const analyticsScript = (mode === 'production' && env.VITE_ANALYTICS_SCRIPT) || '';

  return {
    plugins: [
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            siteUrl,
            analyticsScript,
            title: 'Chrome T-Rex Dino Game realized in TSL | WebGPU & Three.js',
            description: 'Play Chrome\'s iconic T-Rex dinosaur game recreated almost entirely in WebGPU shaders using TSL (Three.js Shading Language). A technical showcase of what can be run on GPU with modern web graphics.',
            keywords: 'chrome dino game, t-rex runner, dinosaur game, webgpu game, three.js game, browser game, endless runner, free online game, chrome offline game, tsl shaders, web graphics, typescript game',
          },
        },
      }),
    ],
  };
});
