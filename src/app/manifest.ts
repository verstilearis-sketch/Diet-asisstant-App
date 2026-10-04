import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nutriq — AI Nutrition Planner',
    short_name: 'Nutriq',
    description:
      'Get a personalized diet plan based on your goals, lifestyle, and location. Powered by smart AI nutrition science.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#177245',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
